import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import { initiatePayment } from '@/lib/payments'
import { createRegistration } from '@/lib/database/queries/registrations'
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { eventId, amount, provider = 'stripe' } = body

    if (!eventId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Type assertion for event
    const eventData = event as { title: string }

    // Check if user already registered
    const { data: existing } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Already registered for this event' },
        { status: 400 }
      )
    }

    // Create registration
    const orderId = `reg_${Date.now()}_${user.id.slice(0, 8)}`

    const registration = await createRegistration({
      event_id: eventId,
      user_id: user.id,
      status: 'pending',
      payment_status: 'pending',
      payment_amount: amount,
    })

    if (!registration) {
      return NextResponse.json(
        { error: 'Failed to create registration' },
        { status: 500 }
      )
    }

    // Initiate payment
    const paymentResult = await initiatePayment(provider, {
      amount,
      orderId,
      description: `Registration for ${eventData.title}`,
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/events/${eventId}/payment`,
      email: user.email,
      metadata: {
        registrationId: registration.id,
        eventId,
        userId: user.id,
      },
    })

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: 'Failed to initiate payment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      payment: 'data' in paymentResult ? paymentResult.data : paymentResult,
      registrationId: registration.id,
    })
  } catch (error) {
    logger.error('Payment intent creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
