/**
 * Attendee Dashboard Component
 * Main dashboard for event attendees
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Ticket,
  Scan,
  User,
  Calendar,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/auth/client'
import { useLiveMyRegistrations, useRealtimeNotifications } from '@/lib/realtime/hooks'
import { fetchUserDashboardStats } from '@/lib/actions/attendees'
import { DashboardTabs } from '@/components/layout/dashboard-tabs'
import { OverviewSection } from './attendee-dashboard/overview-section'
import { RegistrationsList } from './attendee-dashboard/registrations-list'
import { TicketsSection } from './attendee-dashboard/tickets-section'
import { ProfileSummary } from './attendee-dashboard/profile-summary'
import type { UserDashboardStats } from '@/lib/types'
import { logger } from '@/lib/logger';

export function AttendeeDashboard() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<UserDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Real-time hooks
  const { registrations, status: realtimeStatus } = useLiveMyRegistrations(userId || '')
  const { notifications, unreadCount, markAsRead } = useRealtimeNotifications(userId || '')

  // Get current user
  useEffect(() => {
    async function getUser() {
      try {
        const supabase = createClient()
        if (!supabase) {
          logger.error('Supabase client not configured')
          router.push('/auth/sign-in')
          return
        }
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/sign-in')
          return
        }

        setUserId(user.id)

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setUser(profile || { ...user, full_name: user.user_metadata?.full_name || '' })
      } catch (err) {
        logger.error('[Dashboard] Failed to get user:', err)
        setError('Failed to load user data')
      }
    }

    getUser()
  }, [router])

  // Fetch dashboard stats
  useEffect(() => {
    async function loadStats() {
      if (!userId) return

      try {
        setLoading(true)
        const data = await fetchUserDashboardStats(userId)
        setStats(data)
      } catch (err) {
        logger.error('[Dashboard] Failed to load stats:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [userId])

  // Handle sign out
  async function handleSignOut() {
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push('/')
  }

  // Tabs configuration
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'registrations',
      label: 'My Registrations',
      icon: Ticket,
      count: stats?.totalRegistrations,
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: Scan,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
    },
  ]

  // Loading state
  if (loading || !userId || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, {user.full_name || 'User'}!
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection status */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                  realtimeStatus === 'connected'
                    ? 'bg-green-100 text-green-700'
                    : realtimeStatus === 'connecting'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    realtimeStatus === 'connected'
                      ? 'bg-green-500 animate-pulse'
                      : 'bg-gray-400'
                  }`}
                />
                {realtimeStatus === 'connected'
                  ? 'Live'
                  : realtimeStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Offline'}
              </div>

              {/* Notifications */}
              {unreadCount > 0 && (
                <button
                  onClick={() => setActiveTab('overview')}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                >
                  <Calendar className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </button>
              )}

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DashboardTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewSection
            user={user}
            stats={stats}
            registrations={registrations}
          />
        )}

        {activeTab === 'registrations' && (
          <RegistrationsList
            userId={userId}
            registrations={registrations}
          />
        )}

        {activeTab === 'tickets' && (
          <TicketsSection registrations={registrations} />
        )}

        {activeTab === 'profile' && <ProfileSummary user={user} userId={userId} />}
      </main>
    </div>
  )
}
