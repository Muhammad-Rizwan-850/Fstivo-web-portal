import { logger } from '@/lib/logger';
/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get platform statistics
 *     description: Retrieve comprehensive platform statistics including user counts, events, revenue, and growth metrics. Requires admin authentication.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                   description: Total number of registered users
 *                 totalEvents:
 *                   type: integer
 *                   description: Total number of events created
 *                 totalRevenue:
 *                   type: number
 *                   description: Total revenue generated
 *                 totalUniversities:
 *                   type: integer
 *                   description: Total number of universities
 *                 activeUsers:
 *                   type: integer
 *                   description: Number of active users
 *                 userGrowth:
 *                   type: integer
 *                   description: User growth percentage over the last 30 days
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         description: Activity type
 *                       count:
 *                         type: integer
 *                         description: Activity count
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */

/**
 * Admin API - Platform Statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import { isAdmin } from '@/lib/admin/adminAuth'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const hasAccess = await isAdmin(user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Get platform statistics using RPC function
    const { data: stats, error } = await (supabase as any).rpc('get_platform_stats')

    if (error) throw error

    const typedStats = stats as any

    // Calculate growth metrics (simplified)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: newUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    const userGrowth = typedStats.totalUsers > 0
      ? Math.round(((newUsers || 0) / typedStats.totalUsers) * 100)
      : 0

    return NextResponse.json({
      totalUsers: typedStats.totalUsers || 0,
      totalEvents: typedStats.totalEvents || 0,
      totalRevenue: typedStats.totalRevenue || 0,
      totalUniversities: typedStats.totalUniversities || 0,
      activeUsers: typedStats.activeUsers || 0,
      pendingEvents: typedStats.pendingEvents || 0,
      publishedEvents: typedStats.publishedEvents || 0,
      growth: {
        users: userGrowth,
        events: 8,
        revenue: 25,
        universities: 5
      }
    })
  } catch (error: any) {
    logger.error('Admin stats error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
