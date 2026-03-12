import { logger } from '@/lib/logger';
/**
 * @swagger
 * /api/feature-flags:
 *   get:
 *     summary: Get all feature flags
 *     description: Retrieve all feature flags with their current status. Requires admin authentication.
 *     tags:
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feature flags retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 flags:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FeatureFlag'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *   post:
 *     summary: Create a new feature flag
 *     description: Create a new feature flag. Requires admin authentication.
 *     tags:
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - enabled
 *               - environment
 *             properties:
 *               name:
 *                 type: string
 *                 description: Feature flag name
 *               description:
 *                 type: string
 *                 description: Feature flag description
 *               enabled:
 *                 type: boolean
 *                 description: Whether the flag is enabled
 *               rollout_percentage:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Rollout percentage (0-100)
 *               user_groups:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: User groups that can access this feature
 *               environment:
 *                 type: string
 *                 enum: [development, staging, production]
 *                 description: Environment for this flag
 *     responses:
 *       201:
 *         description: Feature flag created successfully
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { featureFlags, FeatureFlag } from '@/lib/feature-flags';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('admin_role')
      .eq('id', user.id)
      .single();

    if (!profile?.admin_role) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all feature flags
    const flags = featureFlags.getAllFlags();

    return NextResponse.json({ flags });
  } catch (error) {
    logger.error('Error fetching feature flags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('admin_role')
      .eq('id', user.id)
      .single();

    if (!profile?.admin_role) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, enabled, rollout_percentage, user_groups, environment } = body;

    // Validate input
    if (!name || !description || typeof enabled !== 'boolean' || !environment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (rollout_percentage !== undefined && (rollout_percentage < 0 || rollout_percentage > 100)) {
      return NextResponse.json({ error: 'Rollout percentage must be between 0 and 100' }, { status: 400 });
    }

    if (!['development', 'staging', 'production'].includes(environment)) {
      return NextResponse.json({ error: 'Invalid environment' }, { status: 400 });
    }

    // Create the feature flag
    const newFlag = await featureFlags.createFlag({
      name,
      description,
      enabled,
      rollout_percentage,
      user_groups,
      environment: environment as FeatureFlag['environment'],
    });

    if (!newFlag) {
      return NextResponse.json({ error: 'Failed to create feature flag' }, { status: 500 });
    }

    return NextResponse.json({ flag: newFlag }, { status: 201 });
  } catch (error) {
    logger.error('Error creating feature flag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}