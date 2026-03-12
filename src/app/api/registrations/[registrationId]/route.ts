import { logger } from '@/lib/logger';
/**
 * @swagger
 * /api/registrations/{registrationId}:
 *   get:
 *     summary: Get registration details
 *     description: Retrieve detailed information about a specific registration including QR code data. Requires authentication and appropriate permissions.
 *     tags:
 *       - Registrations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration ID
 *     responses:
 *       200:
 *         description: Registration details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 registration:
 *                   $ref: '#/components/schemas/Registration'
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 ticketType:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Not found - Registration not found
 *       500:
 *         description: Internal server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ registrationId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { registrationId } = await params;
    const supabase = createClient();

    // Get user session for authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch registration with related data
    const { data: registration, error } = await supabase
      .from('registrations')
      .select(`
        id,
        qr_code,
        registration_number,
        status,
        checked_in_at,
        created_at,
        user:user_profiles!inner(
          id,
          full_name,
          email
        ),
        event:events!inner(
          id,
          title,
          date,
          start_time,
          venue_name,
          city,
          cover_image_url
        ),
        ticket_type:ticket_types!inner(
          id,
          name,
          price
        )
      `)
      .eq('id', registrationId)
      .single();

    if (error || !registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Check if user owns this registration or is an admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('admin_role')
      .eq('id', user.id)
      .single();

    const isOwner = registration.user.id === user.id;
    const isAdmin = profile?.admin_role;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Transform the data for the frontend
    const transformedRegistration = {
      id: registration.id,
      qr_code: registration.qr_code,
      registration_number: registration.registration_number,
      status: registration.status,
      checked_in_at: registration.checked_in_at,
      user: {
        full_name: registration.user.full_name,
        email: registration.user.email,
      },
      event: {
        title: registration.event.title,
        date: registration.event.date,
        location: `${registration.event.venue_name}, ${registration.event.city}`,
        start_time: registration.event.start_time,
      },
      ticket_type: {
        name: registration.ticket_type.name,
        price: registration.ticket_type.price,
      },
    };

    return NextResponse.json(transformedRegistration);
  } catch (error) {
    logger.error('Registration fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}