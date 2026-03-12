'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Share2,
  Heart,
  Bookmark,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Info,
  Clock,
  Ticket,
} from 'lucide-react'
import type { Event } from '@/lib/types'
import { logger } from '@/lib/logger';
import {
  fetchEventById,
  fetchEventTickets,
  fetchEventRegistrations,
} from '@/lib/actions/events'

export function EventDetails() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<(Event & { tags?: string[]; organizer?: any; registrations?: any[] }) | null>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

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

      // Enhance with additional data
      const enhancedEvent = {
        ...eventData,
        tags: ['technology', 'networking', 'innovation', 'career'],
        organizer: {
          id: eventData.organizer_id,
          full_name: 'Event Organizer',
          email: 'organizer@example.com',
          profile_image: `https://ui-avatars.com/api/?name=Event+Organizer&background=6366f1&color=fff`
        }
      }

      setEvent(enhancedEvent as any)

      // Fetch tickets
      const ticketsData = await fetchEventTickets(eventId)
      setTickets(ticketsData)

      // Set default ticket selection
      if (ticketsData.length > 0) {
        setSelectedTicket(ticketsData[0].id)
      }

      // Fetch recent registrations
      const registrations = await fetchEventRegistrations(eventId)
      setRecentRegistrations(registrations.slice(0, 5))

    } catch (err) {
      logger.error('Error fetching event:', err)
      setError(err instanceof Error ? err.message : 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share && event) {
      try {
        await navigator.share({
          title: event.title,
          text: event.short_description || event.description,
          url: window.location.href,
        })
      } catch {
        // User canceled
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
    // In real app: save to user's saved events
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    // In real app: save to user's liked events
  }

  const handleRegister = () => {
    if (selectedTicket) {
      router.push(`/events/${eventId}/register?ticket=${selectedTicket}`)
    } else {
      router.push(`/events/${eventId}/register`)
    }
  }

  const getCapacityPercentage = () => {
    if (!event?._count?.registrations || !event.capacity) return 0
    return Math.round((event._count.registrations / event.capacity) * 100)
  }

  const getMinPrice = () => {
    if (tickets.length === 0) return event?.price || 0
    return Math.min(...tickets.filter(t => t.available > 0).map(t => t.price))
  }

  const getTimeUntilEvent = () => {
    if (!event?.start_date) return ''
    const now = new Date()
    const eventDate = new Date(event.start_date)
    const diffTime = eventDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'Event has passed'
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 7) return `In ${diffDays} days`
    if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} weeks`
    return `In ${Math.floor(diffDays / 30)} months`
  }

  const getCapacityColor = () => {
    const pct = getCapacityPercentage()
    if (pct >= 90) return 'bg-red-500'
    if (pct >= 70) return 'bg-orange-500'
    return 'bg-indigo-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2 text-center">Event Not Found</h2>
          <p className="text-red-700 text-center">{error || 'This event may have been removed or is no longer available.'}</p>
          <button
            onClick={() => router.push('/events')}
            className="mt-4 w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    )
  }

  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={event.banner_image || event.cover_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Back Button */}
        <button
          onClick={() => router.push('/events')}
          className="absolute top-6 left-6 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        {/* Action Buttons */}
        <div className="absolute top-6 right-6 flex gap-3">
          <button
            onClick={handleShare}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
            title="Share event"
          >
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleLike}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
            title="Like event"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
          </button>
          <button
            onClick={handleSave}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
            title="Save event"
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-indigo-600 text-indigo-600' : 'text-gray-700'}`} />
          </button>
        </div>

        {/* Event Title */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {event.category && typeof event.category === 'object' && (
              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium">
                {event.category.icon} {event.category.name}
              </span>
            )}
            <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-medium">
              {getTimeUntilEvent()}
            </span>
            {getMinPrice() === 0 && (
              <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
                FREE
              </span>
            )}
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{event.title}</h1>
          <p className="text-lg text-white/90">{event.short_description || event.description?.substring(0, 150)}...</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date & Time */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-semibold text-gray-900">
                      {startDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {startDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      - {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    {event.event_mode === 'virtual' ? (
                      <>
                        <p className="font-semibold text-gray-900">Virtual Event</p>
                        {event.virtual_meeting_link && (
                          <a
                            href={event.virtual_meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Join link
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-gray-900">
                          {event.venue_name || event.location?.venue || 'TBD'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {(event as any).venue_address || event.location?.address || ''},{' '}
                          {event.venue_city || event.location?.city || 'TBD'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Attendance */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Attendance</p>
                    <p className="font-semibold text-gray-900">
                      {event._count?.registrations || 0} registered
                    </p>
                    <p className="text-sm text-gray-600">
                      {event.capacity ? `${event.capacity - (event._count?.registrations || 0)} spots left` : 'Open registration'}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    {getMinPrice() > 0 ? (
                      <>
                        <p className="font-semibold text-gray-900">From ₨{getMinPrice().toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Multiple ticket types available</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-green-600">Free Event</p>
                        <p className="text-sm text-gray-600">No cost to attend</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Capacity Bar */}
              {event.capacity && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Event Capacity</span>
                    <span className="font-medium text-gray-900">{getCapacityPercentage()}% full</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getCapacityColor()}`}
                      style={{ width: `${Math.min(getCapacityPercentage(), 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* About Event */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
              <div className="prose prose-gray max-w-none">
                {event.description ? (
                  event.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-600 mb-3">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-600">{event.short_description}</p>
                )}
              </div>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600 mb-3">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Organizer Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Organized By</h2>
              <div className="flex items-center gap-4">
                <img
                  src={event.organizer?.profile_image || `https://ui-avatars.com/api/?name=Organizer&background=6366f1&color=fff`}
                  alt={event.organizer?.full_name || 'Organizer'}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="font-semibold text-gray-900">{event.organizer?.full_name || 'Event Organizer'}</p>
                  <p className="text-sm text-gray-600">{event.organizer?.email || 'contact@example.com'}</p>
                  <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-700">
                    View Profile →
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Registrations */}
            {recentRegistrations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Registrations</h2>
                <div className="flex items-center gap-2">
                  {recentRegistrations.slice(0, 5).map((reg: any, index: number) => (
                    <div
                      key={index}
                      className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-sm"
                      title={reg.full_name || `User ${index + 1}`}
                    >
                      {(reg.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {(event._count?.registrations || 0) > 5 && (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-medium">
                      +{(event._count?.registrations || 0) - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Ticket Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Select Your Ticket</h3>

              {/* Ticket Options */}
              {tickets.length > 0 ? (
                <>
                  <div className="space-y-3 mb-6">
                    {tickets.map((ticket) => (
                      <label
                        key={ticket.id}
                        className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedTicket === ticket.id
                            ? 'border-indigo-600 bg-indigo-50'
                            : ticket.available === 0
                            ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="ticket"
                              value={ticket.id}
                              checked={selectedTicket === ticket.id}
                              onChange={(e) => setSelectedTicket(e.target.value)}
                              disabled={ticket.available === 0}
                              className="w-4 h-4 text-indigo-600 mt-1"
                            />
                            <div>
                              <p className="font-semibold text-gray-900">{ticket.name}</p>
                              <p className="text-sm text-gray-600">{ticket.quantity_available} tickets available</p>
                            </div>
                          </div>
                          <p className="font-bold text-gray-900 whitespace-nowrap ml-2">
                            {ticket.price > 0 ? `₨${ticket.price.toLocaleString()}` : 'Free'}
                          </p>
                        </div>

                        {ticket.available > 0 && ticket.available <= 10 && (
                          <p className="text-xs text-orange-600 flex items-center gap-1 mt-2">
                            <AlertCircle className="w-3 h-3" />
                            Only {ticket.available} left!
                          </p>
                        )}

                        {ticket.available === 0 && (
                          <p className="text-xs text-red-600 flex items-center gap-1 mt-2">
                            <AlertCircle className="w-3 h-3" />
                            Sold out
                          </p>
                        )}
                      </label>
                    ))}
                  </div>

                  {/* What's Included */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="font-medium text-gray-900 mb-3">What's Included:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        Access to all sessions
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        Conference materials
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        Networking opportunities
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        Certificate of attendance
                      </div>
                    </div>
                  </div>

                  {/* Register Button */}
                  <button
                    onClick={handleRegister}
                    disabled={!selectedTicket}
                    className="w-full py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg mb-3 flex items-center justify-center gap-2"
                  >
                    <Ticket className="w-5 h-5" />
                    Register Now
                  </button>

                  <p className="text-xs text-center text-gray-500">
                    By registering, you agree to our terms and conditions
                  </p>

                  {/* Trust Signals */}
                  <div className="mt-6 pt-6 border-t space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      Instant confirmation
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      Secure payment
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      Free cancellation
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No tickets available</p>
                  <button
                    onClick={() => router.push('/events')}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Browse Other Events
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
