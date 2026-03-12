/**
 * Overview Section Component
 * Welcome message and quick stats
 */

'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  Ticket,
  Calendar,
  UserCheck,
  CreditCard,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'
import type { UserDashboardStats, RegistrationWithEvent } from '@/lib/types'

interface OverviewSectionProps {
  user: any
  stats: UserDashboardStats | null
  registrations: RegistrationWithEvent[]
}

export function OverviewSection({ user, stats, registrations }: OverviewSectionProps) {
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Upcoming events (next 3)
  const upcomingEvents = registrations
    .filter((r) => {
      const eventDate = new Date(r.event?.start_date || '')
      return eventDate > new Date() && r.status === 'confirmed'
    })
    .slice(0, 3)

  // Recent activity
  const recentActivity = registrations.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">
          {getGreeting()}, {user?.full_name?.split(' ')[0] || 'User'}!
        </h2>
        <p className="text-indigo-100">
          Here's what's happening with your events
        </p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Registrations"
            value={stats.totalRegistrations}
            icon={Ticket}
            color="indigo"
          />
          <StatCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            icon={Calendar}
            color="purple"
          />
          <StatCard
            title="Events Attended"
            value={stats.checkedInCount}
            icon={UserCheck}
            color="green"
          />
          <StatCard
            title="Total Spent"
            value={`$${stats.totalSpent.toFixed(0)}`}
            icon={CreditCard}
            color="blue"
          />
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
            <Link
              href="/dashboard/attendee"
              onClick={() => {
                // TODO: Trigger tab change
              }}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((registration) => {
                const eventDate = new Date(registration.event?.start_date || '')
                const daysUntil = Math.ceil(
                  (eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )

                return (
                  <div
                    key={registration.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
                  >
                    {registration.event?.cover_image_url && (
                      <img
                        src={registration.event.cover_image_url}
                        alt={registration.event.title || 'Event'}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {registration.event?.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {eventDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {registration.event?.venue_city || 'Virtual'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {daysUntil === 0
                          ? 'Today'
                          : daysUntil === 1
                          ? 'Tomorrow'
                          : `In ${daysUntil} days`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No upcoming events</p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Browse Events
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Recent Activity
          </h3>

          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((registration) => {
                const eventDate = new Date(registration.created_at || '')
                const timeAgo = formatDistanceToNow(eventDate, { addSuffix: true })

                return (
                  <div key={registration.id} className="flex items-start gap-3">
                    <div
                      className={`mt-1 rounded-full p-1 ${
                        registration.status === 'confirmed'
                          ? 'bg-green-100'
                          : registration.status === 'pending'
                          ? 'bg-yellow-100'
                          : registration.status === 'cancelled'
                          ? 'bg-red-100'
                          : 'bg-blue-100'
                      }`}
                    >
                      <CheckCircle
                        className={`h-4 w-4 ${
                          registration.status === 'confirmed'
                            ? 'text-green-600'
                            : registration.status === 'pending'
                            ? 'text-yellow-600'
                            : registration.status === 'cancelled'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {registration.status === 'cancelled'
                          ? 'Cancelled'
                          : 'Registered for'}{' '}
                        {registration.event?.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: string | number
  icon: any
  color: 'indigo' | 'purple' | 'green' | 'blue'
}) {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}
