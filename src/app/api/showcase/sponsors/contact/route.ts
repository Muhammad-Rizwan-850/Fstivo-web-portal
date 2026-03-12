import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { logger } from '@/lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * POST /api/showcase/sponsors/contact
 * Submit a sponsorship inquiry
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const {
      company_name,
      contact_name,
      email,
      phone,
      interested_tier,
      message
    } = body

    // Validate required fields
    if (!company_name || !contact_name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: company_name, contact_name, email' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Insert contact request
    const { data: contactRequest, error: insertError } = await supabase
      .from('sponsor_contact_requests')
      .insert({
        company_name,
        contact_name,
        email,
        phone,
        interested_tier,
        message,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      logger.error('Error creating contact request:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit contact request' },
        { status: 500 }
      )
    }

    // Send email notification to admin (if Resend is configured)
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'FSTIVO Partnerships <partnerships@fstivo.com>',
          to: ['admin@fstivo.com'], // Replace with actual admin email
          subject: `New Sponsorship Inquiry from ${company_name}`,
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
                .value { background: white; padding: 10px; border-radius: 5px; border-left: 3px solid #667eea; }
                .tier-badge { display: inline-block; background: #667eea; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">🤝 New Sponsorship Inquiry</h1>
                  <p style="margin: 10px 0 0; opacity: 0.9;">A potential sponsor is interested in partnering with FSTIVO</p>
                </div>

                <div class="content">
                  <div class="field">
                    <div class="label">Company Name</div>
                    <div class="value">${company_name}</div>
                  </div>

                  <div class="field">
                    <div class="label">Contact Person</div>
                    <div class="value">${contact_name}</div>
                  </div>

                  <div class="field">
                    <div class="label">Email</div>
                    <div class="value"><a href="mailto:${email}">${email}</a></div>
                  </div>

                  ${phone ? `
                    <div class="field">
                      <div class="label">Phone</div>
                      <div class="value">${phone}</div>
                    </div>
                  ` : ''}

                  ${interested_tier ? `
                    <div class="field">
                      <div class="label">Interested Tier</div>
                      <div class="value">
                        <span class="tier-badge">${interested_tier.toUpperCase()}</span>
                      </div>
                    </div>
                  ` : ''}

                  ${message ? `
                    <div class="field">
                      <div class="label">Message</div>
                      <div class="value">${message}</div>
                    </div>
                  ` : ''}
                </div>

                <div class="footer">
                  <p>This inquiry was submitted via FSTIVO Sponsors Showcase</p>
                  <p>Request ID: ${contactRequest.id}</p>
                </div>
              </div>
            </body>
            </html>
          `
        })
      } catch (emailError) {
        logger.error('Error sending notification email:', emailError)
        // Don't fail the request if email fails
      }
    }

    // Send confirmation email to inquirer (if Resend is configured)
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'FSTIVO Partnerships <partnerships@fstivo.com>',
          to: [email],
          subject: 'Thank you for your interest in FSTIVO Sponsorship',
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
                  <h1 style="margin: 0;">🎉 Thank You for Your Interest!</h1>
                </div>

                <div class="content">
                  <p>Dear ${contact_name},</p>

                  <p>Thank you for expressing interest in partnering with FSTIVO. We're excited about the possibility of working with ${company_name}!</p>

                  <div class="highlight">
                    <strong>📋 What happens next?</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                      <li>Our partnerships team will review your inquiry within 24-48 hours</li>
                      <li>We'll send you a detailed sponsorship package tailored to your interests</li>
                      <li>We'll schedule a call to discuss how we can create value together</li>
                    </ul>
                  </div>

                  <p><strong>Quick Stats:</strong></p>
                  <ul>
                    <li>🎓 30,000+ students engaged annually</li>
                    <li>🏛️ 45+ university partnerships</li>
                    <li>📊 4.8/5 average sponsor satisfaction</li>
                    <li>💼 320% average ROI on sponsorship</li>
                  </ul>

                  <p>If you have any immediate questions, please don't hesitate to reach out:</p>
                  <p>
                    📧 Email: partnerships@fstivo.com<br>
                    📞 Phone: +92-300-SPONSOR (776-6767)
                  </p>

                  <p>Looking forward to building something great together!</p>

                  <p>
                    Best regards,<br>
                    <strong>FSTIVO Partnerships Team</strong>
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
      } catch (emailError) {
        logger.error('Error sending confirmation email:', emailError)
      }
    }

    return NextResponse.json({
      message: 'Contact request submitted successfully',
      request: contactRequest
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
 * GET /api/showcase/sponsors/contact
 * Get contact requests (Admin only)
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

    let query = supabase
      .from('sponsor_contact_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: requests, error } = await query

    if (error) {
      logger.error('Error fetching contact requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch contact requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      requests: requests || []
    })

  } catch (error) {
    logger.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
