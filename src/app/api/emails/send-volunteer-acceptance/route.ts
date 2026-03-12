import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import { emailService } from '@/lib/emailService'
import type { VolunteerApplicationWithRelations } from '@/types/api'
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { applicationId } = await request.json()

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch volunteer application with event and user data
    const { data: application, error } = (await supabase
      .from('volunteer_applications')
      .select(`
        *,
        event:events(*),
        user:users(email, first_name, last_name)
      `)
      .eq('id', applicationId)
      .eq('status', 'accepted')
      .single()) as { data: VolunteerApplicationWithRelations | null; error: unknown }

    if (error || !application) {
      return NextResponse.json(
        { error: 'Application not found or not accepted' },
        { status: 404 }
      )
    }

    const userEmail = application.user?.email
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    const volunteerName = application.user?.first_name && application.user?.last_name
      ? `${application.user.first_name} ${application.user.last_name}`
      : 'Volunteer'

    // Send email
    await emailService.sendVolunteerAcceptance(userEmail, {
      volunteerName,
      eventName: application.event?.title || 'Event',
      role: application.preferred_role || 'Volunteer',
      eventDate: new Date(application.event?.start_date || '').toLocaleDateString(),
      eventLocation: `${application.event?.venue_name || 'TBD'}${application.event?.venue_city ? `, ${application.event.venue_city}` : ''}`,
      trainingDate: application.training_date ? new Date(application.training_date).toLocaleDateString() : undefined,
    })

    return NextResponse.json({
      success: true,
      message: 'Volunteer acceptance email sent successfully',
    })
  } catch (error) {
    logger.error('Error sending volunteer acceptance:', error)
    return NextResponse.json(
      { error: 'Failed to send volunteer acceptance email' },
      { status: 500 }
    )
  }
}
