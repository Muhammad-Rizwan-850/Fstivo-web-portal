import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * POST /api/tickets/purchase
 *
 * Create an order for ticket purchase
 *
 * This endpoint:
 * 1. Validates ticket tier exists
 * 2. Checks tier availability
 * 3. Creates an order record
 * 4. Returns order ID for payment processing
 *
 * Request body:
 * {
 *   "tier_id": string (UUID),
 *   "quantity": number (1-10),
 *   "event_id": string (UUID, optional but recommended)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "order": {
 *     "id": string,
 *     "event_id": string,
 *     "tier_id": string,
 *     "quantity": number,
 *     "total_amount": number,
 *     "currency": "PKR",
 *     "status": "pending",
 *     "payment_status": "pending",
 *     "user_id": string,
 *     "created_at": string
 *   }
 * }
 */

const purchaseSchema = z.object({
  tier_id: z.string().uuid('Invalid tier ID'),
  quantity: z.number().int().min(1).max(10),
  event_id: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = purchaseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { tier_id, quantity } = validation.data;

    // Get authenticated user
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to continue' },
        { status: 401 }
      );
    }

    // Get ticket tier with event information
    const { data: tier, error: tierError } = await supabase
      .from('ticket_tiers')
      .select('*, event:events(id, title, user_id)')
      .eq('id', tier_id)
      .single();

    if (tierError || !tier) {
      return NextResponse.json(
        { error: 'Ticket tier not found' },
        { status: 404 }
      );
    }

    // Check if event exists and get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, status, tickets_available')
      .eq('id', tier.event?.id || tier.event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if event is active
    if (event.status !== 'active' && event.status !== 'published') {
      return NextResponse.json(
        { error: 'Event is not available for ticket purchase' },
        { status: 400 }
      );
    }

    // Check tier availability
    if (!tier.is_available) {
      return NextResponse.json(
        { error: 'This ticket tier is no longer available' },
        { status: 400 }
      );
    }

    // Check ticket availability
    const availableTickets = (tier.tickets_available ?? 0) - (tier.tickets_sold ?? 0);
    if (availableTickets < quantity) {
      return NextResponse.json(
        {
          error: `Not enough tickets available. Only ${Math.max(0, availableTickets)} remaining.`,
        },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = tier.price * quantity;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        event_id: event.id,
        tier_id: tier.id,
        user_id: user.id,
        quantity,
        total_amount: totalAmount,
        currency: 'PKR',
        status: 'pending',
        payment_status: 'pending',
        metadata: {
          created_from_api: true,
          tier_name: tier.name,
          event_title: event.title,
        },
      })
      .select()
      .single();

    if (orderError || !order) {
      logger.error('Order creation error:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create ticket records
    const ticketsToCreate = Array.from({ length: quantity }, (_, i) => ({
      order_id: order.id,
      event_id: event.id,
      tier_id: tier.id,
      user_id: user.id,
      ticket_number: `${order.id}-${i + 1}`,
      status: 'pending',
      metadata: {
        created_from_api: true,
        purchase_date: new Date().toISOString(),
      },
    }));

    const { error: ticketsError } = await supabase
      .from('tickets')
      .insert(ticketsToCreate);

    if (ticketsError) {
      logger.error('Tickets creation error:', ticketsError);
      // Don't fail the entire request if ticket creation fails
      // The order is created and can be paid for, tickets can be created later
    }

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          event_id: order.event_id,
          tier_id: order.tier_id,
          quantity: order.quantity,
          total_amount: order.total_amount,
          currency: order.currency,
          status: order.status,
          payment_status: order.payment_status,
          user_id: order.user_id,
          created_at: order.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Ticket purchase error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create order';
    return NextResponse.json(
      {
        error: 'Failed to create order',
        details: message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tickets/purchase
 *
 * For validation purposes, return available tiers for an event
 *
 * Query params:
 * - event_id: string (UUID)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json(
        { error: 'event_id query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get available tiers for event
    const { data: tiers, error: tiersError } = await supabase
      .from('ticket_tiers')
      .select('id, name, price, is_available, tickets_available, tickets_sold')
      .eq('event_id', eventId)
      .eq('is_available', true)
      .order('price', { ascending: true });

    if (tiersError) {
      return NextResponse.json(
        { error: 'Failed to fetch ticket tiers' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        tiers: tiers || [],
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Ticket tier fetch error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch tiers';
    return NextResponse.json(
      {
        error: 'Failed to fetch ticket tiers',
        details: message,
      },
      { status: 500 }
    );
  }
}
