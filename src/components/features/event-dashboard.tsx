'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Users, DollarSign, TrendingUp, Eye, Clock, MapPin, AlertCircle, Loader2 } from 'lucide-react'
import type { Event } from '@/lib/types'
import { fetchEventById, fetchEventStats } from '@/lib/actions/events'
import { logger } from '@/lib/logger';

interface EventDashboardProps {
  eventId: string
}

export function EventDashboard({ eventId }: EventDashboardProps) {
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEventData()
  }, [eventId])

  const fetchEventData = async () => {
    try {
      setLoading(true)

      // Fetch event details
      const eventData = await fetchEventById(eventId)

      if (!eventData) {
        throw new Error('Event not found')
      }

      setEvent(eventData)

      // Fetch event statistics
      const statsData = await fetchEventStats(eventId)
      setStats(statsData)
    } catch (err) {
      logger.error('Error fetching event data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch event data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading event data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2 text-center">Error Loading Event</h2>
          <p className="text-red-700 text-center">{error}</p>
        </div>
      </div>
    )
  }

  if (!event || !stats) {
    return null
  }

  const capacityPercentage = stats.total_registrations > 0
    ? ((stats.total_registrations / stats.capacity) * 100).toFixed(1)
    : '0'

  const checkInPercentage = stats.total_registrations > 0
    ? ((stats.total_checked_in / stats.total_registrations) * 100).toFixed(1)
    : '0'

  const maxRegistrationsPerDay = stats.registrations_by_day?.length > 0
    ? Math.max(...stats.registrations_by_day.map((d: any) => d.count))
    : 1

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.start_date).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {event.venue_name}{event.venue_city && `, ${event.venue_city}`}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                event.status === 'published'
                  ? 'bg-green-100 text-green-700'
                  : event.status === 'draft'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {event.status}
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Registrations</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total_registrations || 0}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 rounded-full h-2 transition-all"
                  style={{ width: `${Math.min(parseFloat(capacityPercentage), 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">{capacityPercentage}%</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">
              ₨{(stats.total_revenue || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Avg: ₨{stats.total_registrations > 0
                ? Math.round(stats.total_revenue / stats.total_registrations).toLocaleString()
                : 0}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Checked In</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total_checked_in || 0}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 rounded-full h-2 transition-all"
                  style={{ width: `${Math.min(parseFloat(checkInPercentage), 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">{checkInPercentage}%</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Capacity</p>
            <p className="text-3xl font-bold text-gray-900">{stats.capacity || 0}</p>
            <p className="text-xs text-gray-500 mt-2">
              {stats.capacity - stats.total_registrations} spots remaining
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Registration Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Trend</h3>
            <div className="space-y-3">
              {stats.registrations_by_day?.map((day: any, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-indigo-600 h-8 rounded-full flex items-center justify-end pr-3 transition-all"
                      style={{ width: `${(day.count / maxRegistrationsPerDay) * 100}%` }}
                    >
                      <span className="text-white text-sm font-medium">{day.count}</span>
                    </div>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-gray-500 text-center py-4">No registration data available</p>
              )}
            </div>
          </div>

          {/* Ticket Sales Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Sales by Type</h3>
            <div className="space-y-4">
              {stats.tickets_sold_by_type?.map((ticket: any, index: number) => (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{ticket.type}</span>
                    <span className="text-sm text-gray-600">{ticket.sold} sold</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-green-600 rounded-full h-2 transition-all"
                        style={{ width: `${(ticket.sold / stats.total_registrations) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      ₨{ticket.revenue?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-gray-500 text-center py-4">No ticket sales data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push(`/dashboard/events/${eventId}/schedule`)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors text-center"
            >
              <Calendar className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900">View Schedule</span>
            </button>
            <button
              onClick={() => router.push(`/dashboard/events/${eventId}/attendees`)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors text-center"
            >
              <Users className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900">Manage Attendees</span>
            </button>
            <button
              onClick={() => router.push(`/dashboard/events/${eventId}/financials`)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors text-center"
            >
              <DollarSign className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900">Financial Report</span>
            </button>
            <button
              onClick={() => router.push(`/dashboard/events/${eventId}/check-in`)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors text-center"
            >
              <Eye className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900">Check-In Portal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
