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
        event:events(title),
        user:users(email, first_name, last_name)
      `)
      .eq('id', applicationId)
      .single()) as { data: VolunteerApplicationWithRelations | null; error: unknown }

    if (error || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
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

    const applicantName = application.user?.first_name && application.user?.last_name
      ? `${application.user.first_name} ${application.user.last_name}`
      : 'Volunteer Applicant'

    // Send email
    const createdAt = application.created_at ? (typeof application.created_at === 'string' ? new Date(application.created_at) : new Date()) : new Date()
    await emailService.sendVolunteerApplicationConfirmation(userEmail, {
      applicantName,
      eventName: application.event?.title || 'Event',
      applicationDate: createdAt.toLocaleDateString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Volunteer application confirmation email sent successfully',
    })
  } catch (error) {
    logger.error('Error sending volunteer application confirmation:', error)
    return NextResponse.json(
      { error: 'Failed to send volunteer application confirmation email' },
      { status: 500 }
    )
  }
}
