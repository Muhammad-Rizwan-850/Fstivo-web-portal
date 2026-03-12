import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import { emailService } from '@/lib/emailService'
import type { RegistrationWithRelations } from '@/types/api'
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { registrationId } = await request.json()

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch registration with check-in data
    const { data: registration, error } = (await supabase
      .from('registrations')
      .select(`
        *,
        event:events(title),
        user:users(email, first_name, last_name)
      `)
      .eq('id', registrationId)
      .not('checked_in_at', 'is', null)
      .single()) as { data: RegistrationWithRelations | null; error: unknown }

    if (error || !registration) {
      return NextResponse.json(
        { error: 'Registration not found or not checked in' },
        { status: 404 }
      )
    }

    const userEmail = registration.user?.email
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    const attendeeName = registration.user?.first_name && registration.user?.last_name
      ? `${registration.user.first_name} ${registration.user.last_name}`
      : 'Attendee'

    // Send email
    await emailService.sendCheckinConfirmation(userEmail, {
      eventName: registration.event?.title || 'Event',
      attendeeName,
      checkInTime: registration.checked_in_at ? new Date(registration.checked_in_at).toLocaleString() : new Date().toLocaleString(),
      registrationNumber: registration.registration_number || 'N/A',
    })

    return NextResponse.json({
      success: true,
      message: 'Check-in confirmation email sent successfully',
    })
  } catch (error) {
    logger.error('Error sending check-in confirmation:', error)
    return NextResponse.json(
      { error: 'Failed to send check-in confirmation email' },
      { status: 500 }
    )
  }
}
