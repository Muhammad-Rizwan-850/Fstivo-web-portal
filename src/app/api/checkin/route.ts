import { logger } from '@/lib/logger';
/**
 * @swagger
 * /api/checkin:
 *   post:
 *     summary: Check in attendee with QR code
 *     description: Process attendee check-in using QR code. Requires admin or organizer authentication.
 *     tags:
 *       - Check-in
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qr_code
 *             properties:
 *               qr_code:
 *                 type: string
 *                 description: QR code value from attendee's ticket
 *     responses:
 *       200:
 *         description: Check-in successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Check-in successful"
 *                 registration:
 *                   $ref: '#/components/schemas/Registration'
 *       400:
 *         description: Bad request - QR code required or invalid
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - Admin or organizer access required
 *       404:
 *         description: Not found - Invalid QR code
 *       409:
 *         description: Conflict - Already checked in
 *       500:
 *         description: Internal server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { qr_code } = await request.json();

    if (!qr_code) {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 });
    }

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or organizer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('admin_role')
      .eq('id', user.id)
      .single();

    if (!profile?.admin_role) {
      return NextResponse.json({ error: 'Admin or organizer access required' }, { status: 403 });
    }

    // Find registration by QR code
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        id,
        qr_code,
        registration_number,
        status,
        checked_in_at,
        user:user_profiles!inner(
          id,
          full_name,
          email
        ),
        event:events!inner(
          id,
          title,
          organizer_id
        )
      `)
      .eq('qr_code', qr_code)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 404 });
    }

    // Check if already checked in
    if (registration.status === 'attended') {
      return NextResponse.json({
        error: 'Already checked in',
        registration: {
          id: registration.id,
          user: registration.user,
          event: registration.event,
          checked_in_at: registration.checked_in_at,
        }
      }, { status: 409 });
    }

    // Check if registration is confirmed
    if (registration.status !== 'confirmed') {
      return NextResponse.json({
        error: 'Registration not confirmed',
        registration: {
          id: registration.id,
          user: registration.user,
          event: registration.event,
          status: registration.status,
        }
      }, { status: 400 });
    }

    // Perform check-in
    const now = new Date().toISOString();
    const { data: updatedRegistration, error: updateError } = await supabase
      .from('registrations')
      .update({
        status: 'attended',
        checked_in_at: now,
      })
      .eq('id', registration.id)
      .select(`
        id,
        registration_number,
        status,
        checked_in_at,
        user:user_profiles!inner(
          full_name,
          email
        ),
        event:events!inner(
          title
        )
      `)
      .single();

    if (updateError) {
      logger.error('Check-in update error:', updateError);
      return NextResponse.json({ error: 'Check-in failed' }, { status: 500 });
    }

    // Log the check-in action
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_id: user.id,
        action: 'check_in',
        target_type: 'registration',
        target_id: registration.id,
        details: {
          qr_code: qr_code,
          attendee_name: registration.user.full_name,
          event_title: registration.event.title,
        },
      });

    return NextResponse.json({
      success: true,
      message: 'Check-in successful',
      registration: {
        id: updatedRegistration.id,
        registration_number: updatedRegistration.registration_number,
        user: updatedRegistration.user,
        event: updatedRegistration.event,
        checked_in_at: updatedRegistration.checked_in_at,
      },
    });
  } catch (error) {
    logger.error('Check-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}