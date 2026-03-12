import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { logger } from '@/lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * POST /api/showcase/team-volunteers/appreciation
 * Submit an appreciation message for a volunteer or team member
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const {
      sender_name,
      sender_email,
      volunteer_id,
      team_member_id,
      message
    } = body

    // Validate required fields
    if (!sender_name || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: sender_name, message' },
        { status: 400 }
      )
    }

    // Validate that either volunteer_id or team_member_id is provided
    if (!volunteer_id && !team_member_id) {
      return NextResponse.json(
        { error: 'Either volunteer_id or team_member_id must be provided' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (sender_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(sender_email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Insert appreciation message
    const { data: appreciation, error: insertError } = await supabase
      .from('appreciation_messages')
      .insert({
        sender_name,
        sender_email,
        volunteer_id,
        team_member_id,
        message,
        is_public: true,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      logger.error('Error creating appreciation message:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit appreciation message' },
        { status: 500 }
      )
    }

    // Send notification email to admin (if Resend is configured)
    if (process.env.RESEND_API_KEY) {
      try {
        // Get recipient details
        let recipientName = ''
        let recipientEmail = ''

        if (volunteer_id) {
          const { data: volunteer } = await supabase
            .from('volunteers')
            .select('name, email')
            .eq('id', volunteer_id)
            .single()

          if (volunteer) {
            recipientName = volunteer.name
            recipientEmail = volunteer.email
          }
        } else if (team_member_id) {
          const { data: teamMember } = await supabase
            .from('team_members')
            .select('name, email')
            .eq('id', team_member_id)
            .single()

          if (teamMember) {
            recipientName = teamMember.name
            recipientEmail = teamMember.email
          }
        }

        // Send admin notification
        await resend.emails.send({
          from: 'FSTIVO Appreciation <appreciation@fstivo.com>',
          to: ['admin@fstivo.com'], // Replace with actual admin email
          subject: `New Appreciation Message for ${recipientName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .field { margin-bottom: 20px; }
                .label { font-weight: bold; color: #667eea; margin-bottom: 5px; }
                .value { background: white; padding: 15px; border-radius: 5px; border-left: 3px solid #667eea; }
                .badge { display: inline-block; background: #10B981; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">💝 New Appreciation Message</h1>
                  <p style="margin: 10px 0 0; opacity: 0.9;">Someone shared kind words for ${recipientName}</p>
                </div>

                <div class="content">
                  <div class="field">
                    <div class="label">From</div>
                    <div class="value">
                      <strong>${sender_name}</strong>
                      ${sender_email ? `<br><small>${sender_email}</small>` : ''}
                    </div>
                  </div>

                  <div class="field">
                    <div class="label">For</div>
                    <div class="value">
                      <strong>${recipientName}</strong>
                      ${volunteer_id ? '<br><span class="badge">Volunteer</span>' : '<br><span class="badge">Team Member</span>'}
                    </div>
                  </div>

                  <div class="field">
                    <div class="label">Message</div>
                    <div class="value">
                      <em>"${message}"</em>
                    </div>
                  </div>

                  <div class="field">
                    <div class="label">Status</div>
                    <div class="value">
                      <span class="badge">Pending Approval</span>
                    </div>
                  </div>
                </div>

                <div class="footer">
                  <p>This message was submitted via FSTIVO Team & Volunteers Showcase</p>
                  <p>Message ID: ${appreciation.id}</p>
                </div>
              </div>
            </body>
            </html>
          `
        })

        // Send confirmation email to sender (if email provided)
        if (sender_email) {
          await resend.emails.send({
            from: 'FSTIVO Appreciation <appreciation@fstivo.com>',
            to: [sender_email],
            subject: 'Thank You for Sharing Appreciation!',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                  .highlight { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0;">💝 Thank You!</h1>
                    <p style="margin: 10px 0 0;">Your appreciation means the world</p>
                  </div>

                  <div class="content">
                    <p>Dear ${sender_name},</p>

                    <p>Thank you for taking the time to share your appreciation for ${recipientName}. Your kind words have been submitted and will be reviewed shortly.</p>

                    <div class="highlight">
                      <strong>📋 What happens next?</strong>
                      <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Our team will review your message</li>
                        <li>Once approved, it will appear on our Appreciation Wall</li>
                        <li>The recipient will be notified of your kind words</li>
                      </ul>
                    </div>

                    <p><strong>Your Message:</strong></p>
                    <p style="background: white; padding: 15px; border-radius: 5px; font-style: italic;">
                      "${message}"
                    </p>

                    <p>We appreciate your contribution to making our community more positive and supportive!</p>

                    <p>
                      Best regards,<br>
                      <strong>FSTIVO Team</strong>
                    </p>
                  </div>

                  <div class="footer">
                    <p>FSTIVO - Connecting Universities, Empowering Students</p>
                  </div>
                </div>
              </body>
              </html>
            `
          })
        }
      } catch (emailError) {
        logger.error('Error sending notification email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      message: 'Appreciation submitted successfully',
      appreciation
    }, { status: 201 })

  } catch (error) {
    logger.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/showcase/team-volunteers/appreciation
 * Get appreciation messages (Admin only)
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('appreciation_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: messages, error } = await query

    if (error) {
      logger.error('Error fetching appreciation messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch appreciation messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      messages: messages || [],
      pagination: {
        limit,
        offset,
        total: messages?.length || 0
      }
    })

  } catch (error) {
    logger.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
