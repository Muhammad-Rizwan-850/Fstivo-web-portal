import { NextRequest, NextResponse } from 'next/server';
import { easyPaisaClient } from '@/lib/payments/easypaisa/client';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * POST /api/webhooks/easypaisa/return
 *
 * Handle EasyPaisa payment return webhook
 *
 * This endpoint receives the POST request from EasyPaisa after payment completion
 * It verifies the signature, updates the order status, and redirects the user
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const webhookData: Record<string, string | undefined> = {};

    // Convert FormData to plain object
    formData.forEach((value, key) => {
      webhookData[key] = value.toString();
    });

    logger.info('EasyPaisa webhook received:', JSON.stringify(webhookData, null, 2));

    // Basic runtime validation: ensure required fields exist before verifying
    const requiredKeys = ['ORDER_ID', 'TRANSACTION_ID', 'AMOUNT'];
    const hasKeys = (obj: any, keys: string[]) => keys.every((k) => obj && Object.prototype.hasOwnProperty.call(obj, k));

    if (!hasKeys(webhookData, requiredKeys)) {
      logger.error('Missing required EasyPaisa webhook fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify webhook signature (cast after runtime validation)
    if (!easyPaisaClient.verifyWebhook(webhookData as unknown as any)) {
      logger.error('Invalid EasyPaisa webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const orderId = webhookData.ORDER_ID;
    const transactionId = webhookData.TRANSACTION_ID;
    const amount = webhookData.AMOUNT;

    if (!orderId || !transactionId) {
      logger.error('Missing required fields in webhook');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get payment status
    const { status, message } = easyPaisaClient.getPaymentStatus(webhookData as unknown as any);

    logger.info(`EasyPaisa payment ${orderId}: status=${status}, message=${message}, txn_id=${transactionId}`);

    const supabase = createClient();

    // Update order status based on payment result
    if (status === 'success') {
      // Update order to completed
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          metadata: {
            easypaisa_transaction_id: transactionId,
            easypaisa_amount: amount,
          },
        })
        .eq('id', orderId);

      if (updateError) {
        logger.error('Order update error:', updateError);
      }

      // Activate tickets
      const { error: ticketsError } = await supabase
        .from('tickets')
        .update({ status: 'active' })
        .eq('order_id', orderId);

      if (ticketsError) {
        logger.error('Ticket activation error:', ticketsError);
      }

      // Update payment intent
      await supabase
        .from('payment_intents')
        .update({
          status: 'succeeded',
          metadata: {
            transaction_id: transactionId,
            webhook_data: webhookData,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)
        .eq('provider', 'easypaisa');

    } else if (status === 'failed') {
      // Update order to failed
      await supabase
        .from('orders')
        .update({
          status: 'failed',
          payment_status: 'failed',
          metadata: {
            easypaisa_transaction_id: transactionId,
            easypaisa_failure_reason: message,
          },
        })
        .eq('id', orderId);

      // Update payment intent
      await supabase
        .from('payment_intents')
        .update({
          status: 'failed',
          metadata: {
            transaction_id: transactionId,
            webhook_data: webhookData,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)
        .eq('provider', 'easypaisa');

    } else {
      // Payment pending - update intent but don't change order
      await supabase
        .from('payment_intents')
        .update({
          status: 'pending',
          metadata: {
            transaction_id: transactionId,
            webhook_data: webhookData,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)
        .eq('provider', 'easypaisa');
    }

    // Log webhook for audit
    await supabase.from('webhook_logs').insert({
      provider: 'easypaisa',
      event_type: 'payment_return',
      event_id: orderId,
      payload: webhookData,
      verified: true,
      processed: true,
      processed_at: new Date().toISOString(),
    });

    // Redirect user to appropriate page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const redirectUrl = status === 'success'
      ? `${baseUrl}/payment/success?order=${orderId}&provider=easypaisa`
      : `${baseUrl}/payment/failed?order=${orderId}&provider=easypaisa&reason=${encodeURIComponent(message)}`;

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    logger.error('EasyPaisa webhook processing error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: message,
      },
      { status: 500 }
    );
  }
}
