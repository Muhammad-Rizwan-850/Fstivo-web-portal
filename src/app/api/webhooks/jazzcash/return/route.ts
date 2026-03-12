import { NextRequest, NextResponse } from 'next/server';
import { jazzCashClient } from '@/lib/payments/jazzcash/client';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { ensureWebhookIdempotency } from '@/lib/webhooks/idempotency';

/**
 * POST /api/webhooks/jazzcash/return
 *
 * Handle JazzCash payment return webhook
 *
 * This endpoint receives the POST request from JazzCash after payment completion
 * It verifies the signature, updates the order status, and redirects the user
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const webhookData: Record<string, string> = {};

    // Convert FormData to plain object
    formData.forEach((value, key) => {
      webhookData[key] = value.toString();
    });

    logger.info('JazzCash webhook received:', JSON.stringify(webhookData, null, 2));

    // Basic runtime validation: ensure required fields exist before verifying
    const requiredKeys = ['pp_TxnRefNo', 'pp_ResponseCode', 'pp_ResponseMessage'];
    const hasKeys = (obj: any, keys: string[]) => keys.every((k) => obj && Object.prototype.hasOwnProperty.call(obj, k));

    if (!hasKeys(webhookData, requiredKeys)) {
      logger.error('Missing required JazzCash webhook fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const txnRefNo = webhookData.pp_TxnRefNo;

    // Check idempotency: prevent duplicate processing
    const { isDuplicate, error: idempotencyError } = await ensureWebhookIdempotency('jazzcash', txnRefNo);
    if (idempotencyError) {
      logger.warn('Webhook idempotency check failed', { txnRefNo, error: idempotencyError });
    }
    if (isDuplicate) {
      logger.info('Duplicate JazzCash webhook, skipping processing', { txnRefNo });
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Verify webhook signature (cast after runtime validation)
    if (!jazzCashClient.verifyWebhook(webhookData as unknown as any)) {
      logger.error('Invalid JazzCash webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const orderId = webhookData.pp_TxnRefNo;
    const responseCode = webhookData.pp_ResponseCode;
    const responseMessage = webhookData.pp_ResponseMessage;

    // Get payment status
    const { status, message } = jazzCashClient.getPaymentStatus(responseCode);

    logger.info(`JazzCash payment ${orderId}: status=${status}, message=${message}`);

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
            jazzcash_response_code: responseCode,
            jazzcash_response_message: responseMessage,
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
          metadata: webhookData,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)
        .eq('provider', 'jazzcash');

    } else if (status === 'failed') {
      // Update order to failed
      await supabase
        .from('orders')
        .update({
          status: 'failed',
          payment_status: 'failed',
          metadata: {
            jazzcash_response_code: responseCode,
            jazzcash_response_message: responseMessage,
          },
        })
        .eq('id', orderId);

      // Update payment intent
      await supabase
        .from('payment_intents')
        .update({
          status: 'failed',
          metadata: webhookData,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)
        .eq('provider', 'jazzcash');

    } else {
      // Payment pending - update intent but don't change order
      await supabase
        .from('payment_intents')
        .update({
          status: 'pending',
          metadata: webhookData,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)
        .eq('provider', 'jazzcash');
    }

    // Log webhook for audit
    await supabase.from('webhook_logs').insert({
      provider: 'jazzcash',
      event_type: 'payment_return',
      event_id: webhookData.pp_TxnRefNo,
      payload: webhookData,
      verified: true,
      processed: true,
      processed_at: new Date().toISOString(),
    });

    // Redirect user to appropriate page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const redirectUrl = status === 'success'
      ? `${baseUrl}/payment/success?order=${orderId}&provider=jazzcash`
      : `${baseUrl}/payment/failed?order=${orderId}&provider=jazzcash&reason=${encodeURIComponent(message)}`;

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    logger.error('JazzCash webhook processing error:', error);
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
