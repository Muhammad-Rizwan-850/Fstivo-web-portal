import { logger } from '@/lib/logger';
/**
 * @swagger
 * /api/feature-flags/{flagId}/check:
 *   get:
 *     summary: Check if a feature flag is enabled
 *     description: Check if a specific feature flag is enabled for the current user or provided user ID.
 *     tags:
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: flagId
 *         required: true
 *         schema:
 *           type: string
 *         description: Feature flag ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID to check (optional, defaults to current user)
 *       - in: query
 *         name: context
 *         schema:
 *           type: string
 *         description: JSON string of context data for condition evaluation
 *     responses:
 *       200:
 *         description: Feature flag status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 flagId:
 *                   type: string
 *                 enabled:
 *                   type: boolean
 *                 userId:
 *                   type: string
 *       400:
 *         description: Bad request - Invalid parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Feature flag not found
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { featureFlags } from '@/lib/feature-flags';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  try {
    const supabase = createClient();
    const { flagId } = await params;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;
    const contextParam = searchParams.get('context');

    let context: Record<string, any> = {};
    if (contextParam) {
      try {
        context = JSON.parse(contextParam);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid context JSON' }, { status: 400 });
      }
    }

    if (!flagId) {
      return NextResponse.json({ error: 'Flag ID is required' }, { status: 400 });
    }

    // Check if the flag exists
    const flag = featureFlags.getFlag(flagId);
    if (!flag) {
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 });
    }

    // Check if the flag is enabled for this user
    const isEnabled = await featureFlags.isEnabled(flagId, userId, context);

    return NextResponse.json({
      flagId,
      enabled: isEnabled,
      userId,
    });
  } catch (error) {
    logger.error('Error checking feature flag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}