// =====================================================
// API ROUTE: CONTACT VERIFICATION
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/config';
import type { ChannelData, VerificationRequestData } from '@/types/api';
import { logger } from '@/lib/logger';

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { channel, contactValue } = body;

    // Validate
    if (!channel || !contactValue) {
      return NextResponse.json(
        { error: 'Channel and contact value are required' },
        { status: 400 }
      );
    }

    // Get channel ID
    const { data: channelData } = await (supabase as any)
      .from('notification_channels')
      .select('id')
      .eq('name', channel)
      .single();

    if (!channelData?.id) {
      return NextResponse.json(
        { error: 'Invalid channel' },
        { status: 400 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    const token = `verify_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store verification request
    await (supabase as any)
      .from('user_contact_verification')
      .upsert({
        user_id: user.id,
        channel_id: channelData.id,
        contact_value: contactValue,
        is_verified: false,
        verification_token: token,
        verification_sent_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,channel_id'
      });

    // In development, just log the code
    if (process.env.NODE_ENV === 'development') {
      logger.info(`🔐 Verification code for ${channel}: ${code}`);
      logger.info(`📱 Contact: ${contactValue}`);
    }

    // In production, send the code via the actual channel
    if (process.env.NODE_ENV === 'production') {
      // For SMS/WhatsApp, use Twilio
      // For Email, use Resend
      // For now, just return the code (in production, don't return it!)
      if (channel === 'email' && process.env.RESEND_API_KEY) {
        // Send email with code
        const resend = await import('resend');
        const resendClient = new resend.Resend(process.env.RESEND_API_KEY);

        await resendClient.emails.send({
          from: 'Fstivo <noreply@fstivo.com>',
          to: contactValue,
          subject: 'Verify Your Contact',
          html: `<p>Your verification code is: <strong>${code}</strong></p>`,
        });
      } else if (channel === 'sms' && process.env.TWILIO_ACCOUNT_SID) {
        // Send SMS with code
        const twilio = await import('twilio');
        const client = new twilio.Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        await client.messages.create({
          body: `Your Fstivo verification code is: ${code}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: contactValue,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
      token,
      // Only include code in development
      ...(process.env.NODE_ENV === 'development' && { code }),
    });

  } catch (error) {
    logger.error('Send verification error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token, code } = body;

    // Validate
    if (!token || !code) {
      return NextResponse.json(
        { error: 'Token and code are required' },
        { status: 400 }
      );
    }

    // In development, verify the code directly
    // In production, you'd verify against the stored token/code
    if (process.env.NODE_ENV === 'development') {
      // For development, just mark as verified if code is 6 digits
      if (code.length === 6 && /^\d+$/.test(code)) {
        const { data: verification } = await (supabase as any)
          .from('user_contact_verification')
          .select('*')
          .eq('verification_token', token)
          .eq('user_id', user.id)
          .single();

        if (verification) {
          await (supabase as any)
            .from('user_contact_verification')
            .update({
              is_verified: true,
              verified_at: new Date().toISOString(),
              verification_token: null,
            })
            .eq('id', verification.id);

          return NextResponse.json({
            success: true,
            message: 'Contact verified successfully',
          });
        }
      }

      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Production verification logic
    // You would typically:
    // 1. Store the code in a separate table with expiration
    // 2. Verify the code matches
    // 3. Mark as verified

    return NextResponse.json(
      { error: 'Verification not implemented in production yet' },
      { status: 501 }
    );

  } catch (error) {
    logger.error('Verify contact error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
