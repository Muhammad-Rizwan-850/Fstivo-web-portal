import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/emailService'
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, resetToken } = await request.json()

    if (!email || !resetToken) {
      return NextResponse.json(
        { error: 'Email and reset token are required' },
        { status: 400 }
      )
    }

    // Create password reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`

    // Send password reset email
    await emailService.sendPasswordReset(email, {
      userName: email.split('@')[0], // Fallback to email username
      resetUrl,
      expiryTime: '1 hour',
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
    })
  } catch (error) {
    logger.error('Error sending password reset email:', error)
    return NextResponse.json(
      { error: 'Failed to send password reset email' },
      { status: 500 }
    )
  }
}
