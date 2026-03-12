import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/emailService'
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, userName } = await request.json()

    if (!email || !userName) {
      return NextResponse.json(
        { error: 'Email and user name are required' },
        { status: 400 }
      )
    }

    // Create email verification URL
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?email=${encodeURIComponent(email)}`

    // Send welcome email
    await emailService.sendWelcomeEmail(email, {
      userName,
      verifyUrl,
    })

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
    })
  } catch (error) {
    logger.error('Error sending welcome email:', error)
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    )
  }
}
