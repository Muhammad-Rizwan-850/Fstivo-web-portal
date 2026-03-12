'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

/**
 * Cancel a registration with optional refund processing
 *
 * @param registrationId - The ID of the registration to cancel
 * @returns Object with success status or error message
 */
export async function cancelRegistration(registrationId: string) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized: Please sign in to continue' };
    }

    // Get registration with event and order details
    const { data: registration, error: fetchError } = await supabase
      .from('registrations')
      .select(`
        *,
        event:events(
          id,
          title,
          cancel_deadline,
          refund_policy,
          start_date
        ),
        order:orders(
          id,
          amount,
          payment_status,
          payment_provider
        )
      `)
      .eq('id', registrationId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !registration) {
      logger.error('Registration fetch error:', fetchError);
      return { error: 'Registration not found' };
    }

    // Check if registration is already cancelled
    if (registration.status === 'cancelled') {
      return { error: 'Registration is already cancelled' };
    }

    // Check if event has already passed
    if (registration.event?.start_date) {
      const eventStartDate = new Date(registration.event.start_date);
      if (eventStartDate < new Date()) {
        return { error: 'Cannot cancel registration for past events' };
      }
    }

    // Check cancellation deadline
    let canCancel = true;
    let refundPercentage = 0;

    if (registration.event?.cancel_deadline) {
      const deadline = new Date(registration.event.cancel_deadline);
      if (deadline < new Date()) {
        canCancel = false;
        return { error: 'Cancellation deadline has passed' };
      }
    }

    // Calculate refund based on policy
    if (registration.event?.refund_policy && registration.event?.start_date) {
      const eventStartDate = new Date(registration.event.start_date);
      const daysUntilEvent = Math.ceil((eventStartDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      if (daysUntilEvent >= 7) {
        refundPercentage = 1.0; // 100% refund if 7+ days before event
      } else if (daysUntilEvent >= 3) {
        refundPercentage = 0.5; // 50% refund if 3-7 days before event
      } else {
        refundPercentage = 0.0; // No refund if less than 3 days before event
      }
    }

    // Update registration status
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        metadata: {
          refund_percentage: refundPercentage,
          cancelled_by: user.id,
        },
      })
      .eq('id', registrationId);

    if (updateError) {
      logger.error('Registration update error:', updateError);
      return { error: 'Failed to cancel registration' };
    }

    // Process refund if applicable
    let refundAmount = 0;
    if (
      refundPercentage > 0 &&
      registration.order?.payment_status === 'paid' &&
      registration.order?.amount
    ) {
      refundAmount = registration.order.amount * refundPercentage;

      // Create refund record
      const { error: refundError } = await supabase.from('refunds').insert({
        order_id: registration.order.id,
        amount: refundAmount,
        reason: 'User cancellation',
        status: 'pending',
        metadata: {
          registration_id: registrationId,
          refundPercentage,
        },
      });

      if (refundError) {
        logger.error('Refund creation error:', refundError);
        // Continue anyway - registration is still cancelled
      }

      // TODO: Process actual refund with payment provider
      // This would call Stripe/JazzCash/EasyPaisa refund API
      logger.info(`Refund of ${refundAmount} PKR to be processed for order ${registration.order.id}`);
    }

    // Deactivate tickets
    const { error: ticketsError } = await supabase
      .from('tickets')
      .update({ status: 'cancelled' })
      .eq('registration_id', registrationId);

    if (ticketsError) {
      logger.error('Ticket deactivation error:', ticketsError);
      // Continue anyway - registration is still cancelled
    }

    // Revalidate paths
    revalidatePath('/dashboard/attendee');
    revalidatePath('/dashboard/registrations');

    return {
      success: true,
      refundAmount,
      refundPercentage: Math.round(refundPercentage * 100),
    };
  } catch (error: any) {
    logger.error('Cancel registration error:', error);
    return { error: 'An unexpected error occurred' };
  }
}
