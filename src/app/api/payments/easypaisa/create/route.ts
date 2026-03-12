import { NextRequest, NextResponse } from 'next/server';
import { easyPaisaClient } from '@/lib/payments/easypaisa/client';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * POST /api/payments/easypaisa/create
 *
 * Create a new EasyPaisa payment transaction
 *
 * Request body:
 * {
 *   "orderId": string,
 *   "amount": number,
 *   "description": string (optional),
 *   "cnic": string (optional)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "payment": {
 *     "url": string,
 *     "params": EasyPaisaPaymentParams,
 *     "transactionId": string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, description, cnic } = body;

    // Validate inputs
    if (!orderId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid parameters: orderId and valid amount are required' },
        { status: 400 }
      );
    }

    // Validate CNIC if provided (must be 13 digits)
    if (cnic && !/^\d{13}$/.test(cnic.replace(/-/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid CNIC: must be 13 digits' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to continue' },
        { status: 401 }
      );
    }

    // Get order details with user and event information
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        event:events(id, title, user_id),
        user:users!inner(email, phone, full_name)
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      logger.error('Order fetch error:', orderError);
      return NextResponse.json(
        { error: 'Order not found or does not belong to you' },
        { status: 404 }
      );
    }

    // Check if order is already paid
    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 400 }
      );
    }

    // Get user details
    const customerEmail = order.user?.email || user.email;
    const customerPhone = order.user?.phone || '';
    const customerName = order.user?.full_name || user.user_metadata?.full_name || '';

    // Build description
    const eventTitle = order.event?.title || 'Event Ticket';
    const paymentDescription = description || `FSTIVO - ${eventTitle}`;

    // Create EasyPaisa payment
    const payment = await easyPaisaClient.createPayment({
      amount,
      orderId,
      description: paymentDescription,
      customerEmail,
      customerPhone,
      customerName,
      cnic,
    });

    // Store payment intent
    const { error: intentError } = await supabase.from('payment_intents').insert({
      order_id: orderId,
      provider: 'easypaisa',
      amount,
      currency: 'PKR',
      status: 'pending',
      metadata: {
        transaction_id: payment.transactionId,
        payment_url: payment.url,
      },
    });

    if (intentError) {
      logger.error('Payment intent creation error:', intentError);
      // Continue anyway, as the payment can still be processed
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    logger.error('EasyPaisa payment creation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to create payment',
        details: message,
      },
      { status: 500 }
    );
  }
}
