'use server'

import { createClient } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  createPaymentIntent,
  getPaymentStatus,
  createRefund,
  initiatePayment,
} from '@/lib/payments'
import type { PaymentProvider } from '@/lib/payments'
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CreatePaymentIntentRequest {
  registration_id: string
  provider: PaymentProvider
  return_url?: string
}

export interface VerifyPaymentRequest {
  registration_id: string
  provider: PaymentProvider
  transaction_id?: string
  [key: string]: any // For provider-specific params
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createPaymentIntentSchema = z.object({
  registration_id: z.string().uuid('Invalid registration ID'),
  provider: z.enum(['stripe', 'jazzcash', 'easypaisa']),
  return_url: z.string().url().optional(),
})

const verifyPaymentSchema = z.object({
  registration_id: z.string().uuid('Invalid registration ID'),
  provider: z.enum(['stripe', 'jazzcash', 'easypaisa']),
  transaction_id: z.string().optional(),
})

// ============================================================================
// PAYMENT SERVER ACTIONS
// ============================================================================

/**
 * Create a payment intent for a registration
 * Initiates payment with the specified provider
 */
export async function createPaymentIntentAction(formData: CreatePaymentIntentRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Validate input
  const validatedFields = createPaymentIntentSchema.safeParse(formData)
  if (!validatedFields.success) {
    return { error: 'Invalid input', details: validatedFields.error.flatten() }
  }

  const { registration_id, provider, return_url } = validatedFields.data

  // Get registration details
  const { data: registration, error: registrationError } = await (supabase.from('registrations') as any)
    .select(`
      *,
      event:event_id(id, title, currency)
    `)
    .eq('id', registration_id)
    .eq('user_id', user.id)
    .single()

  if (registrationError || !registration) {
    return { error: 'Registration not found' }
  }

  // Check if already paid
  if (registration.payment_status === 'paid') {
    return { error: 'Registration is already paid' }
  }

  // Check if already processing
  if (registration.payment_id) {
    return { error: 'Payment already initiated' }
  }

  const amount = registration.payment_amount || 0
  if (amount <= 0) {
    return { error: 'This registration does not require payment' }
  }

  const currency = registration.event?.currency || 'PKR'
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || return_url || ''

  try {
    let paymentResult: any

    switch (provider) {
      case 'stripe': {
        const stripeResult = await createPaymentIntent(
          amount,
          currency.toLowerCase(),
          {
            registration_id: registration.id,
            user_id: user.id,
            event_id: registration.event_id,
            email: user.email || '',
          }
        )

        if (!stripeResult.success || !stripeResult.data) {
          return { error: stripeResult.error || 'Failed to create payment intent' }
        }

        const stripeData = stripeResult.data as any
        paymentResult = {
          provider: 'stripe' as const,
          client_secret: stripeData.client_secret,
          payment_intent_id: stripeData.id,
          amount: stripeData.amount / 100,
          currency: stripeData.currency,
        }

        // Store payment intent ID
        await (supabase.from('registrations') as any)
          .update({ payment_id: stripeData.id })
          .eq('id', registration_id)

        break
      }

      case 'jazzcash': {
        const jazzcashResult = await initiatePayment('jazzcash', {
          amount,
          orderId: registration.id,
          description: `Registration for ${registration.event.title}`,
          returnUrl: `${baseUrl}/payments/jazzcash/callback`,
        })

        if (!jazzcashResult.success) {
          const errorMsg = typeof jazzcashResult === 'object' && 'error' in jazzcashResult
            ? jazzcashResult.error
            : 'Failed to initiate JazzCash payment'
          return { error: errorMsg as string }
        }

        paymentResult = {
          provider: 'jazzcash' as const,
          payment_url: (jazzcashResult as any).paymentUrl,
          payment_data: (jazzcashResult as any).paymentData,
          amount,
        }
        break
      }

      case 'easypaisa': {
        const { data: profile } = await (supabase.from('profiles') as any)
          .select('email, phone')
          .eq('id', user.id)
          .single()

        const easypaisaResult = await initiatePayment('easypaisa', {
          amount,
          orderId: registration.id,
          description: `Registration for ${registration.event.title}`,
          returnUrl: `${baseUrl}/payments/easypaisa/callback`,
          email: profile?.email,
          phone: profile?.phone,
        })

        if (!easypaisaResult.success) {
          const errorMsg = typeof easypaisaResult === 'object' && 'error' in easypaisaResult
            ? easypaisaResult.error
            : 'Failed to initiate Easypaisa payment'
          return { error: errorMsg as string }
        }

        paymentResult = {
          provider: 'easypaisa' as const,
          payment_url: (easypaisaResult as any).paymentUrl,
          payment_data: (easypaisaResult as any).paymentData,
          amount,
        }
        break
      }

      default:
        return { error: 'Invalid payment provider' }
    }

    revalidatePath('/dashboard/registrations', 'page')

    return {
      success: true,
      payment: paymentResult,
      registration: {
        id: registration.id,
        amount,
        currency,
        event_title: registration.event.title,
      },
    }
  } catch (error) {
    logger.error('Payment intent creation error:', error)
    return { error: 'Failed to create payment intent' }
  }
}

/**
 * Verify and process payment after completion
 * Used for manual payment verification or callback processing
 */
export async function verifyPaymentAction(formData: VerifyPaymentRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Validate input
  const validatedFields = verifyPaymentSchema.safeParse(formData)
  if (!validatedFields.success) {
    return { error: 'Invalid input', details: validatedFields.error.flatten() }
  }

  const { registration_id, provider, transaction_id, ...providerParams } = validatedFields.data

  // Get registration
  const { data: registration } = await (supabase.from('registrations') as any)
    .select('*, event:event_id(id)')
    .eq('id', registration_id)
    .single()

  if (!registration) {
    return { error: 'Registration not found' }
  }

  // Verify ownership or organizer permissions
  if (registration.user_id !== user.id) {
    const { data: event } = await (supabase.from('events') as any)
      .select('organizer_id')
      .eq('id', registration.event_id)
      .single()

    if (event?.organizer_id !== user.id) {
      return { error: 'You do not have permission to verify this payment' }
    }
  }

  try {
    let verified = false
    let paymentId = transaction_id || ''

    switch (provider) {
      case 'stripe': {
        if (!registration.payment_id) {
          return { error: 'No payment ID found for this registration' }
        }

        const statusResult = await getPaymentStatus(registration.payment_id)
        if (!statusResult.success) {
          return { error: 'Failed to verify payment status' }
        }

        verified = (statusResult.status as string) === 'succeeded'
        paymentId = registration.payment_id
        break
      }

      case 'jazzcash':
      case 'easypaisa': {
        // For JazzCash and Easypaisa, verification is done via webhook callback
        // Manual verification is not implemented yet
        // TODO: Implement verifyPayment method for both clients
        return { error: 'Manual verification not yet implemented for this provider' }
      }

      default:
        return { error: 'Invalid payment provider' }
    }

    if (verified) {
      // Update registration
      await (supabase.from('registrations') as any)
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          payment_id: paymentId,
          payment_method: provider,
          payment_date: new Date().toISOString(),
        })
        .eq('id', registration_id)

      revalidatePath('/dashboard/registrations', 'page')
      revalidatePath(`/events/${registration.event_id}`, 'page')

      return { success: true, message: 'Payment verified successfully' }
    } else {
      return { error: 'Payment verification failed' }
    }
  } catch (error) {
    logger.error('Payment verification error:', error)
    return { error: 'Failed to verify payment' }
  }
}

/**
 * Process refund for a registration
 */
export async function processRefundAction(
  registrationId: string,
  reason?: string,
  partialAmount?: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Get registration
  const { data: registration, error } = await (supabase.from('registrations') as any)
    .select(`
      *,
      event:event_id(id, title, organizer_id)
    `)
    .eq('id', registrationId)
    .single()

  if (error || !registration) {
    return { error: 'Registration not found' }
  }

  // Check permissions (user must be organizer or admin)
  const isAdmin = user?.user_metadata?.role === 'admin'
  if (registration.event.organizer_id !== user.id && !isAdmin) {
    return { error: 'You do not have permission to refund this registration' }
  }

  // Check if already refunded
  if (registration.payment_status === 'refunded') {
    return { error: 'Payment has already been refunded' }
  }

  // Check if payment exists
  if (registration.payment_status !== 'paid') {
    return { error: 'No payment to refund' }
  }

  // Get payment method
  const paymentMethod = registration.payment_method
  if (!paymentMethod) {
    return { error: 'No payment method found' }
  }

  try {
    let refundResult: any

    switch (paymentMethod) {
      case 'stripe': {
        if (!registration.payment_id) {
          return { error: 'No Stripe payment ID found' }
        }

        const stripeRefundResult = await createRefund(
          registration.payment_id,
          partialAmount,
          'requested_by_customer'
        )

        if (!stripeRefundResult.success || !stripeRefundResult.data) {
          return { error: stripeRefundResult.error || 'Refund failed' }
        }

        const refundData = stripeRefundResult.data as any
        refundResult = {
          provider: 'stripe',
          refund_id: refundData.id,
          amount: refundData.amount / 100,
          currency: refundData.currency,
        }
        break
      }

      case 'jazzcash':
      case 'easypaisa': {
        // For JazzCash and Easypaisa, refunds typically need to be processed
        // manually through their dashboards or via API integration
        refundResult = {
          provider: paymentMethod,
          message: `Refund initiated. Please process manually through ${paymentMethod} dashboard.`,
        }

        // Update registration as refunded
        await (supabase.from('registrations') as any)
          .update({
            payment_status: 'refunded',
            status: 'cancelled',
            refunded_at: new Date().toISOString(),
            custom_answers: {
              ...(registration.custom_answers || {}),
              refund_reason: reason,
              refund_amount: partialAmount,
            },
          })
          .eq('id', registrationId)

        // Update ticket sold count
        if (registration.ticket_type_id) {
          const { data: ticketType } = await (supabase.from('ticket_types') as any)
            .select('quantity_sold')
            .eq('id', registration.ticket_type_id)
            .single()

          if (ticketType) {
            await (supabase.from('ticket_types') as any)
              .update({ quantity_sold: Math.max(0, ticketType.quantity_sold - 1) })
              .eq('id', registration.ticket_type_id)
          }
        }

        revalidatePath('/dashboard/registrations', 'page')
        revalidatePath(`/dashboard/events/${registration.event_id}/registrations`, 'page')

        return {
          success: true,
          message: 'Refund processed successfully',
          refund: refundResult,
        }
      }

      default:
        return { error: 'Unsupported payment method for refund' }
    }

    // Update registration for Stripe refunds
    if (paymentMethod === 'stripe') {
      await (supabase.from('registrations') as any)
        .update({
          payment_status: 'refunded',
          status: 'cancelled',
          refunded_at: new Date().toISOString(),
          custom_answers: {
            ...(registration.custom_answers || {}),
            refund_reason: reason,
            refund_id: refundResult.refund_id,
          },
        })
        .eq('id', registrationId)

      // Update ticket sold count
      if (registration.ticket_type_id) {
        const { data: ticketType } = await (supabase.from('ticket_types') as any)
          .select('quantity_sold')
          .eq('id', registration.ticket_type_id)
          .single()

        if (ticketType) {
          await (supabase.from('ticket_types') as any)
            .update({ quantity_sold: Math.max(0, ticketType.quantity_sold - 1) })
            .eq('id', registration.ticket_type_id)
        }
      }
    }

    revalidatePath('/dashboard/registrations', 'page')
    revalidatePath(`/dashboard/events/${registration.event_id}/registrations`, 'page')

    return {
      success: true,
      message: 'Refund processed successfully',
      refund: refundResult,
    }
  } catch (error) {
    logger.error('Refund processing error:', error)
    return { error: 'Failed to process refund' }
  }
}

/**
 * Get payment details for a registration
 */
export async function getPaymentDetailsAction(registrationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Get registration
  const { data: registration } = await (supabase.from('registrations') as any)
    .select(`
      *,
      event:event_id(id, title, organizer_id),
      ticket_type:ticket_type_id(id, name, price)
    `)
    .eq('id', registrationId)
    .single()

  if (!registration) {
    return { error: 'Registration not found' }
  }

  // Check permissions
  if (registration.user_id !== user.id && registration.event.organizer_id !== user.id) {
    return { error: 'You do not have permission to view this payment' }
  }

  const paymentDetails: any = {
    registration_id: registration.id,
    payment_status: registration.payment_status,
    payment_amount: registration.payment_amount,
    payment_method: registration.payment_method,
    payment_id: registration.payment_id,
    payment_date: registration.payment_date,
    refunded_at: registration.refunded_at,
  }

  // Get additional details from payment provider if available
  if (registration.payment_method === 'stripe' && registration.payment_id) {
    try {
      const statusResult = await getPaymentStatus(registration.payment_id)
      if (statusResult.success) {
        paymentDetails.stripe_status = statusResult.status
        paymentDetails.stripe_metadata = statusResult.metadata
      }
    } catch (error) {
      logger.error('Failed to fetch Stripe payment details:', error)
    }
  }

  return {
    success: true,
    payment: paymentDetails,
    registration: {
      id: registration.id,
      event_title: registration.event.title,
      ticket_name: registration.ticket_type?.name,
      user_id: registration.user_id,
    },
  }
}
