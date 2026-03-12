/**
 * Enhanced User Dashboard Component
 * Comprehensive dashboard with stats, events, recommendations, and achievements
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Ticket,
  Trophy,
  TrendingUp,
  MapPin,
  DollarSign,
  Star,
  Award,
  Users,
  ChevronRight,
  Bell,
  Settings,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/auth/client'
import type { Event, EventCategory } from '@/lib/types'
import { logger } from '@/lib/logger';

interface RegistrationResponse {
  id: string
  status: string
  payment_status: string
  total_amount: number
  created_at: string
  event: Event & { category?: EventCategory }
  ticket_type: {
    name: string
    price: number
  }
}

interface DashboardStats {
  totalEvents: number
  totalSpent: number
  certificatesEarned: number
  volunteerPoints: number
}

interface EventStatus {
  label: string
  color: string
}

export function EnhancedUserDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<RegistrationResponse[]>([])
  const [pastEvents, setPastEvents] = useState<RegistrationResponse[]>([])
  const [recommendations, setRecommendations] = useState<(Event & { category?: EventCategory })[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalSpent: 0,
    certificatesEarned: 0,
    volunteerPoints: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      if (!supabase) {
        setError('Database not configured. Please set up Supabase to access your dashboard.')
        setLoading(false)
        return
      }

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) {
        router.push('/auth/sign-in')
        return
      }

      setUser(user)

      // Fetch user's registrations with full event details
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select(
          `
          *,
          event:events(*, category:event_categories(*)),
          ticket_type:ticket_types(*)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (regError) throw regError

      // Separate upcoming and past events
      const now = new Date()
      const upcoming = (registrations || []).filter((reg: any) => {
        const eventDate = new Date(reg.event?.start_date)
        return eventDate > now
      }) as RegistrationResponse[]

      const past = (registrations || []).filter((reg: any) => {
        const eventDate = new Date(reg.event?.start_date)
        return eventDate <= now
      }) as RegistrationResponse[]

      setUpcomingEvents(upcoming)
      setPastEvents(past)

      // Calculate stats
      const totalSpent = (registrations || []).reduce((sum: number, reg: any) => sum + (reg.total_amount || 0), 0)
      const attendedCount = past.filter((reg: any) => reg.status === 'attended').length

      setStats({
        totalEvents: registrations?.length || 0,
        totalSpent,
        certificatesEarned: attendedCount,
        volunteerPoints: 0, // Will fetch from volunteer table
      })

      // Fetch volunteer points if user is a volunteer
      const { data: volunteerData } = await supabase
        .from('volunteers')
        .select('total_points')
        .eq('user_id', user.id)
        .single()

      if (volunteerData && 'total_points' in volunteerData) {
        setStats((prev) => ({
          ...prev,
          volunteerPoints: (volunteerData as any).total_points || 0,
        }))
      }

      // Fetch recommended events (published events user hasn't registered for)
      const registeredEventIds = (registrations || []).map((r: any) => r.event_id)

      const { data: recommended, error: recError } = await supabase
        .from('events')
        .select('*, category:event_categories(*), ticket_types(*)')
        .eq('is_published', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date')
        .limit(8)

      if (!recError && recommended) {
        // Filter out events user already registered for
        const filtered = recommended
          .filter((event: any) => !registeredEventIds.includes(event.id))
          .slice(0, 4) as (Event & { category?: EventCategory })[]
        setRecommendations(filtered)
      }
    } catch (err) {
      logger.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const getEventStatus = (event: any): EventStatus => {
    const now = new Date()
    const startDate = new Date(event.start_date)
    const endDate = new Date(event.end_date)

    if (now < startDate) {
      const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntil === 0) return { label: 'Today', color: 'bg-green-100 text-green-700' }
      if (daysUntil === 1) return { label: 'Tomorrow', color: 'bg-blue-100 text-blue-700' }
      return { label: `In ${daysUntil} days`, color: 'bg-blue-100 text-blue-700' }
    }
    if (now >= startDate && now <= endDate) {
      return { label: 'Happening Now', color: 'bg-green-100 text-green-700' }
    }
    return { label: 'Completed', color: 'bg-gray-100 text-gray-700' }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-700 text-center">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={
                  user?.user_metadata?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.user_metadata?.full_name || 'User'
                  )}&background=6366f1&color=fff`
                }
                alt={user?.user_metadata?.full_name || 'User'}
                className="w-16 h-16 rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}!
                </h1>
                <p className="text-gray-600">Here's what's happening with your events</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button
                onClick={() => router.push('/dashboard/settings')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Events</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
            <p className="text-xs text-gray-500 mt-2">{upcomingEvents.length} upcoming</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Spent</p>
            <p className="text-3xl font-bold text-gray-900">
              ₨{stats.totalSpent.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Avg ₨{stats.totalEvents > 0 ? Math.round(stats.totalSpent / stats.totalEvents).toLocaleString() : 0} per
              event
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Certificates</p>
            <p className="text-3xl font-bold text-gray-900">{stats.certificatesEarned}</p>
            <p className="text-xs text-gray-500 mt-2">{pastEvents.length} events completed</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Volunteer Points</p>
            <p className="text-3xl font-bold text-gray-900">{stats.volunteerPoints}</p>
            <p className="text-xs text-gray-500 mt-2">
              {stats.volunteerPoints >= 2000 ? 'Level 4' : stats.volunteerPoints >= 1000 ? 'Level 3' : stats.volunteerPoints >= 500 ? 'Level 2' : 'Level 1'}{' '}
              Contributor
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Events */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Events Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">My Events</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'upcoming'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Upcoming ({upcomingEvents.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('past')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'past' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Past ({pastEvents.length})
                  </button>
                </div>
              </div>

              {/* Event List */}
              <div className="space-y-4">
                {(activeTab === 'upcoming' ? upcomingEvents : pastEvents).length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {activeTab === 'upcoming'
                        ? "You don't have any upcoming events"
                        : "You haven't attended any events yet"}
                    </p>
                    <button
                      onClick={() => router.push('/events')}
                      className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Discover Events
                    </button>
                  </div>
                ) : (
                  (activeTab === 'upcoming' ? upcomingEvents : pastEvents).map((registration) => {
                    const status = getEventStatus(registration.event)
                    return (
                      <div
                        key={registration.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/events/${registration.event.id}`)}
                      >
                        <div className="flex gap-4">
                          <img
                            src={
                              registration.event.cover_image_url ||
                              (registration.event as any).banner_image_url ||
                              '/api/placeholder/200'
                            }
                            alt={registration.event.title}
                            className="w-24 h-24 rounded-lg object-cover flex-shrink-0 bg-gray-200"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">{registration.event.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(registration.event.start_date)}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {registration.event.venue_city || 'TBD'}
                                  </span>
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-600">{registration.ticket_type?.name || 'Standard'} Ticket</span>
                                <span className="text-gray-400">•</span>
                                <span className="font-medium text-gray-900">
                                  ₨{registration.total_amount?.toLocaleString() || 0}
                                </span>
                              </div>
                              <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1">
                                View Details
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/dashboard/tickets')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Ticket className="w-6 h-6 text-indigo-600 mb-2" />
                  <p className="font-medium text-gray-900 text-sm">View Tickets</p>
                </button>
                <button
                  onClick={() => router.push('/dashboard/certificates')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Award className="w-6 h-6 text-indigo-600 mb-2" />
                  <p className="font-medium text-gray-900 text-sm">My Certificates</p>
                </button>
                <button
                  onClick={() => router.push('/dashboard/volunteer')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Users className="w-6 h-6 text-indigo-600 mb-2" />
                  <p className="font-medium text-gray-900 text-sm">Volunteer</p>
                </button>
                <button
                  onClick={() => router.push('/events')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Calendar className="w-6 h-6 text-indigo-600 mb-2" />
                  <p className="font-medium text-gray-900 text-sm">Browse Events</p>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Achievements</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Early Adopter</p>
                    <p className="text-xs text-gray-600">Joined in {new Date(user?.created_at || Date.now()).getFullYear()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Event Explorer</p>
                    <p className="text-xs text-gray-600">Attended {stats.totalEvents} events</p>
                  </div>
                </div>
                {stats.volunteerPoints > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Community Helper</p>
                      <p className="text-xs text-gray-600">{stats.volunteerPoints} points earned</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Events */}
            {recommendations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Recommended</h3>
                  <button
                    onClick={() => router.push('/events')}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    See All
                  </button>
                </div>
                <div className="space-y-3">
                  {recommendations.map((event) => (
                    <div
                      key={event.id}
                      className="group cursor-pointer"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      <div className="flex gap-3">
                        <img
                          src={event.cover_image_url || (event as any).banner_image_url || '/api/placeholder/100'}
                          alt={event.title}
                          className="w-16 h-16 rounded-lg object-cover bg-gray-200"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            {event.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span>{event.category?.icon || '📅'}</span>
                            <span>{event.venue_city || 'Online'}</span>
                            {event.price && event.price > 0 ? (
                              <span>• ₨{event.price}</span>
                            ) : (
                              <span className="text-green-600">• Free</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Volunteer Progress */}
            {stats.volunteerPoints > 0 && (
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-sm p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      Level {stats.volunteerPoints >= 2000 ? 4 : stats.volunteerPoints >= 1000 ? 3 : stats.volunteerPoints >= 500 ? 2 : 1}
                    </p>
                    <p className="text-sm text-indigo-100">Community Contributor</p>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress to next level</span>
                    <span>
                      {stats.volunteerPoints}/
                      {stats.volunteerPoints >= 2000 ? 4000 : stats.volunteerPoints >= 1000 ? 2000 : stats.volunteerPoints >= 500 ? 1000 : 500}{' '}
                      pts
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-white rounded-full h-2 transition-all"
                      style={{
                        width: `${
                          (stats.volunteerPoints /
                            (stats.volunteerPoints >= 2000 ? 4000 : stats.volunteerPoints >= 1000 ? 2000 : stats.volunteerPoints >= 500 ? 1000 : 500)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-sm text-indigo-100 mt-3">
                  Earn more points to unlock exclusive perks and rewards!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
