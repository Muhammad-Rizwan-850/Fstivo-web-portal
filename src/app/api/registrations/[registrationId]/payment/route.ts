import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import { logger } from '@/lib/logger';

/**
 * GET /api/registrations/{registrationId}/payment
 * Get payment details for a registration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
): Promise<NextResponse> {
  try {
    const { registrationId } = await params

    if (!registrationId) {
      return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get registration with payment details
    const { data: registration, error } = await supabase
      .from('registrations')
      .select(`
        id,
        payment_status,
        payment_provider,
        payment_intent_id,
        amount_paid,
        currency,
        paid_at,
        event_id,
        event:events(id, title)
      `)
      .eq('id', registrationId) as any

    if (error || !registration) {
      logger.error('[API] Failed to fetch payment details:', error)
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    const reg = registration as any

    return NextResponse.json({
      payment: {
        payment_status: reg.payment_status,
        payment_provider: reg.payment_provider,
        payment_intent_id: reg.payment_intent_id,
        amount_paid: reg.amount_paid,
        currency: reg.currency,
        paid_at: reg.paid_at,
      },
    })
  } catch (error) {
    logger.error('[API] Error in payment details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
