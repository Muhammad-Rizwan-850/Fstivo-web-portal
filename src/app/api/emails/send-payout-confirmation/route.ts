import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import { emailService } from '@/lib/emailService'
import type { PayoutWithRelations } from '@/types/api'
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { payoutId } = await request.json()

    if (!payoutId) {
      return NextResponse.json(
        { error: 'Payout ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch payout with recipient data
    const { data: payout, error } = (await supabase
      .from('payouts')
      .select(`
        *,
        recipient:users(email, first_name, last_name)
      `)
      .eq('id', payoutId)
      .eq('status', 'completed')
      .single()) as { data: PayoutWithRelations | null; error: unknown }

    if (error || !payout) {
      return NextResponse.json(
        { error: 'Payout not found or not completed' },
        { status: 404 }
      )
    }

    const userEmail = payout.recipient?.email
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Recipient email not found' },
        { status: 400 }
      )
    }

    const recipientName = payout.recipient?.first_name && payout.recipient?.last_name
      ? `${payout.recipient.first_name} ${payout.recipient.last_name}`
      : 'Recipient'

    // Send email
    await emailService.sendPayoutConfirmation(userEmail, {
      recipientName,
      amount: payout.amount || 0,
      payoutDate: new Date(payout.updated_at || '').toLocaleDateString(),
      paymentMethod: payout.payment_method || 'Bank Transfer',
      reference: payout.reference_number || payout.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Payout confirmation email sent successfully',
    })
  } catch (error) {
    logger.error('Error sending payout confirmation:', error)
    return NextResponse.json(
      { error: 'Failed to send payout confirmation email' },
      { status: 500 }
    )
  }
}
