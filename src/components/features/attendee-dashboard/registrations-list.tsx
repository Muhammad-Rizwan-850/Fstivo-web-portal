/**
 * Registrations List Component
 * Display user's registrations with filtering and real-time updates
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  Ticket as TicketIcon,
  X,
  ChevronDown,
  Download,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { RegistrationWithEvent } from '@/lib/types'
import { cancelRegistration } from '@/lib/actions/registrations'

interface RegistrationsListProps {
  userId: string
  registrations: RegistrationWithEvent[]
}

export function RegistrationsList({ userId, registrations }: RegistrationsListProps) {
  const [filter, setFilter] = useState<string>('all')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filteredRegistrations, setFilteredRegistrations] = useState<RegistrationWithEvent[]>(registrations)

  // Update filtered registrations when data or filters change
  useEffect(() => {
    let filtered = [...registrations]

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter((r) => r.status === filter)
    }

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter((r) =>
        r.event?.title?.toLowerCase().includes(searchLower) ||
        r.event?.venue_city?.toLowerCase().includes(searchLower)
      )
    }

    setFilteredRegistrations(filtered)
  }, [registrations, filter, search])

  const statusOptions = [
    { value: 'all', label: 'All Registrations' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'pending', label: 'Pending' },
    { value: 'attended', label: 'Attended' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredRegistrations.length} {filteredRegistrations.length === 1 ? 'registration' : 'registrations'}
          {filter !== 'all' && ` filtered by ${statusOptions.find(o => o.value === filter)?.label}`}
        </p>
        {(search || filter !== 'all') && (
          <button
            onClick={() => {
              setSearch('')
              setFilter('all')
            }}
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Clear filters
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Registrations List */}
      {filteredRegistrations.length > 0 ? (
        <div className="space-y-4">
          {filteredRegistrations.map((registration) => (
            <RegistrationCard
              key={registration.id}
              registration={registration}
              cancellingId={cancellingId}
              setCancellingId={setCancellingId}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <TicketIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No registrations found</h3>
          <p className="text-gray-500 mb-6">
            {search || filter !== 'all'
              ? 'Try adjusting your filters'
              : "You haven't registered for any events yet"}
          </p>
          {!search && filter === 'all' && (
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Browse Events
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// Registration Card Component
function RegistrationCard({
  registration,
  cancellingId,
  setCancellingId,
}: {
  registration: RegistrationWithEvent
  cancellingId: string | null
  setCancellingId: (id: string | null) => void
}) {
  const eventDate = new Date(registration.event?.start_date || '')
  const hasPassed = eventDate < new Date()
  const timeAgo = formatDistanceToNow(eventDate, { addSuffix: true })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      case 'attended':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'refunded':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {/* Event Image */}
        {registration.event?.cover_image_url && (
          <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0">
            <img
              src={registration.event.cover_image_url}
              alt={registration.event.title || 'Event'}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {registration.event?.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {eventDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    {registration.event?.venue_city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {registration.event.venue_city}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      registration.status
                    )}`}
                  >
                    {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                  </span>
                  {registration.payment_status && (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
                        registration.payment_status
                      )}`}
                    >
                      {registration.payment_status.charAt(0).toUpperCase() + registration.payment_status.slice(1)}
                    </span>
                  )}
                </div>
              </div>

              {/* Ticket Info */}
              {registration.ticket_type && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <TicketIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {registration.ticket_type.name}
                  </span>
                  {registration.quantity && registration.quantity > 1 && (
                    <span className="text-gray-500">× {registration.quantity}</span>
                  )}
                </div>
              )}

              {/* Check-in Status */}
              {registration.checked_in_at && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                  <Users className="h-4 w-4" />
                  <span>Checked in {timeAgo}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex sm:flex-col gap-2 sm:items-end">
              <Link
                href={`/dashboard/attendee?tab=tickets`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                View Ticket
                <Download className="h-4 w-4" />
              </Link>
              {registration.status === 'confirmed' && !hasPassed && (
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to cancel this registration? This action cannot be undone.')) {
                      setCancellingId(registration.id)
                      const result = await cancelRegistration(registration.id)
                      if (result.error) {
                        alert(result.error)
                      } else {
                        // Show success message
                        const refundAmount = result.refundAmount ?? 0
                        const message = refundAmount > 0
                          ? `Registration cancelled. Refund of ${refundAmount} PKR (${(result.refundPercentage ?? 0) * 100}%) will be processed within 5-7 business days.`
                          : 'Registration cancelled successfully.'
                        alert(message)
                        // Refresh the page
                        window.location.reload()
                      }
                      setCancellingId(null)
                    }
                  }}
                  disabled={cancellingId === registration.id}
                  className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancellingId === registration.id ? 'Cancelling...' : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
