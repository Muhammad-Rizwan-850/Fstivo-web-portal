import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/emailService'
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Send test email
    await emailService.sendRegistrationConfirmation(email, {
      eventName: 'Test Event 2024',
      registrationNumber: 'TEST-' + Date.now(),
      attendeeName: 'Test User',
      ticketType: 'VIP Ticket',
      eventDate: new Date().toLocaleDateString(),
      eventTime: '10:00 AM',
      eventLocation: 'Test Venue, Test City',
      amount: 1000,
    })

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      sentTo: email,
    })
  } catch (error) {
    logger.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}
