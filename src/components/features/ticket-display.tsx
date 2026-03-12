/**
 * Ticket Display Component
 * Shows detailed ticket information with QR code for check-in
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Download,
  Share2,
  MapPin,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  QrCode,
  Printer,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/auth/client'
import { generateQRCodeDataURL } from '@/lib/qr/generate'
import type { EventCategory, TicketType } from '@/lib/types'
import { logger } from '@/lib/logger';

interface RegistrationAttendee {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  dietary_requirements?: string | null
}

interface TicketData {
  id: string
  registration_number: string
  status: string
  payment_status: string
  total_amount: number
  quantity: number
  qr_code_data: string
  checked_in_at: string | null
  created_at: string
  event: EventWithOrganizer
  ticket_type: TicketType
  attendees: RegistrationAttendee[]
}

interface EventWithOrganizer {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  category?: EventCategory;
  category_id?: string;
  event_type?: string;
  event_mode?: string;
  is_virtual?: boolean;
  start_date: string;
  end_date: string;
  location: any;
  venue_name?: string;
  venue_city?: string;
  virtual_meeting_link?: string;
  organizer_id: string;
  organizer?: {
    full_name: string;
    email: string;
    phone?: string;
  };
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  capacity: number;
  currency?: string;
  banner_url: string | null;
  banner_image?: string;
  cover_image_url?: string | null;
  is_featured: boolean;
  price?: number;
  ticket_types?: any[];
  required_skills?: string[];
  _count?: {
    registrations?: number;
  };
  venue_address?: string | null;
  banner_image_url?: string | null;
  created_at: string;
  updated_at: string;
}

// QR Code Display Component
function QRCodeDisplay({ data, checkedIn }: { data: string; checkedIn: boolean }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function generateQR() {
      try {
        setLoading(true)
        const dataUrl = await generateQRCodeDataURL(data, {
          width: 200,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        })
        setQrDataUrl(dataUrl)
      } catch (error) {
        logger.error('Failed to generate QR code:', error)
      } finally {
        setLoading(false)
      }
    }

    generateQR()
  }, [data])

  if (loading) {
    return (
      <div className="relative">
        <div className="w-48 h-48 bg-white p-4 rounded-lg border-4 border-gray-200 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="w-48 h-48 bg-white p-4 rounded-lg border-4 border-gray-200">
        {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-full h-full" />}
      </div>
      {checkedIn && (
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  )
}

export function TicketDisplay({ registrationId }: { registrationId: string }) {
  const router = useRouter()
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchTicketData()
  }, [registrationId])

  const fetchTicketData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      if (!supabase) {
        throw new Error('Database not configured')
      }

      // Fetch registration with all related data
      const { data: registration, error } = await supabase
        .from('registrations')
        .select(
          `
          *,
          event:events(
            *,
            category:event_categories(*)
          ),
          ticket_type:ticket_types(*)
        `
        )
        .eq('id', registrationId)
        .single()

      if (error) throw error
      if (!registration) {
        throw new Error('Ticket not found')
      }

      const reg = registration as any
      const eventData = reg.event as any

      // Fetch attendees for this registration
      const { data: attendees } = await supabase
        .from('registration_attendees')
        .select('*')
        .eq('registration_id', registrationId)

      // Fetch organizer info
      const { data: organizer } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', eventData.organizer_id)
        .single()

      // Construct ticket data
      const ticketData: TicketData = {
        id: reg.id,
        registration_number: reg.registration_number || `REG-${reg.id.slice(0, 8).toUpperCase()}`,
        status: reg.status,
        payment_status: reg.payment_status,
        total_amount: reg.payment_amount || 0,
        quantity: 1,
        qr_code_data: `FSTIVO-${reg.id}-${reg.registration_number || ''}`,
        checked_in_at: reg.checked_in_at,
        created_at: reg.registered_at || reg.created_at,
        event: {
          ...eventData,
          organizer: organizer || undefined,
        } as EventWithOrganizer,
        ticket_type: reg.ticket_type as TicketType,
        attendees: (attendees || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          email: a.email,
          phone: a.phone,
          dietary_requirements: a.dietary_requirements,
        })),
      }

      setTicket(ticketData)
    } catch (err) {
      logger.error('Error fetching ticket:', err)
      setError(err instanceof Error ? err.message : 'Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    // In production: Generate PDF with ticket details and QR code
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share && ticket) {
      try {
        await navigator.share({
          title: `Ticket - ${ticket.event.title}`,
          text: `My ticket for ${ticket.event.title}`,
          url: window.location.href,
        })
      } catch (error) {
        logger.error('Share failed:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Ticket link copied to clipboard!')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const getTimeUntilEvent = () => {
    if (!ticket?.event?.start_date) return ''
    const now = new Date()
    const eventDate = new Date(ticket.event.start_date)
    const diffTime = eventDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'Event has passed'
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 7) return `In ${diffDays} days`
    return `In ${Math.floor(diffDays / 7)} weeks`
  }

  const addToCalendar = () => {
    if (!ticket?.event) return

    const event = ticket.event
    const title = encodeURIComponent(event.title)
    const details = encodeURIComponent(event.short_description || event.description?.substring(0, 200) || '')
    const location = encodeURIComponent(`${event.venue_name || ''}, ${event.venue_city || ''}`.trim())
    const startDate = new Date(event.start_date).toISOString().replace(/-|:|\.\d+/g, '')
    const endDate = new Date(event.end_date || event.start_date).toISOString().replace(/-|:|\.\d+/g, '')

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`
    window.open(googleCalendarUrl, '_blank')
  }

  const getDirections = () => {
    if (!ticket?.event?.venue_address) return

    const address = encodeURIComponent(`${ticket.event.venue_name} ${ticket.event.venue_address} ${ticket.event.venue_city}`)
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${address}`
    window.open(mapsUrl, '_blank')
  }

  const contactOrganizer = () => {
    if (!ticket?.event?.organizer?.email) return

    const subject = encodeURIComponent(`Question about ${ticket.event.title}`)
    const body = encodeURIComponent(`Hi,\n\nI have a question about my ticket for ${ticket.event.title}.\n\nRegistration Number: ${ticket.registration_number}\n\nThank you.`)

    window.location.href = `mailto:${ticket.event.organizer.email}?subject=${subject}&body=${body}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your ticket...</p>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2 text-center">Ticket Not Found</h2>
          <p className="text-red-700 text-center mb-4">{error || 'This ticket may have been cancelled or is no longer valid.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const isCheckedIn = !!ticket.checked_in_at
  const eventWithOrganizer = ticket.event as EventWithOrganizer

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto print:max-w-none">
        {/* Back Button - Hidden in print */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors print:hidden"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Main Ticket Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6 print:shadow-none print:border print:border-gray-300">
          {/* Event Banner */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={eventWithOrganizer.banner_image_url || eventWithOrganizer.cover_image_url || '/api/placeholder/800'}
              alt={eventWithOrganizer.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium">
                  {eventWithOrganizer.category?.icon || '📅'} {eventWithOrganizer.category?.name || 'Event'}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isCheckedIn ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isCheckedIn ? 'Checked In' : getTimeUntilEvent()}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">{eventWithOrganizer.title}</h1>
            </div>
          </div>

          {/* Ticket Content */}
          <div className="p-6">
            {/* Status Banner */}
            {ticket.status === 'confirmed' && ticket.payment_status === 'paid' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">Ticket Confirmed</p>
                  <p className="text-sm text-green-700">Your payment has been processed successfully</p>
                </div>
              </div>
            )}

            {/* QR Code Section */}
            <div className="flex flex-col items-center mb-8 pb-8 border-b">
              <p className="text-sm text-gray-600 mb-4">Show this QR code at the entrance</p>
              <QRCodeDisplay data={ticket.qr_code_data} checkedIn={isCheckedIn} />
              <p className="text-xs text-gray-500 mt-4 font-mono">{ticket.registration_number}</p>
            </div>

            {/* Event Details */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(eventWithOrganizer.start_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(eventWithOrganizer.start_date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' - '}
                    {new Date(eventWithOrganizer.end_date || eventWithOrganizer.start_date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Venue</p>
                  <p className="font-semibold text-gray-900">{eventWithOrganizer.venue_name || 'TBD'}</p>
                  {eventWithOrganizer.venue_address && (
                    <p className="text-sm text-gray-600">{eventWithOrganizer.venue_address}</p>
                  )}
                  <p className="text-sm text-gray-600">{eventWithOrganizer.venue_city || ''}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ticket Type</p>
                  <p className="font-semibold text-gray-900">{ticket.ticket_type?.name || 'Standard'}</p>
                  <p className="text-sm text-gray-600">
                    Quantity: {ticket.quantity} • ₨{ticket.total_amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendee Information */}
            {ticket.attendees && ticket.attendees.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center justify-between w-full"
                >
                  <h3 className="font-semibold text-gray-900">Attendee Information</h3>
                  <ChevronRight
                    className={`w-5 h-5 text-gray-600 transition-transform ${showDetails ? 'rotate-90' : ''}`}
                  />
                </button>

                {showDetails && (
                  <div className="mt-4 space-y-3">
                    {ticket.attendees.map((attendee, index) => (
                      <div key={attendee.id} className="border-t pt-3">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Attendee {index + 1}
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            {attendee.name}
                          </div>
                          {attendee.email && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-4 h-4" />
                              {attendee.email}
                            </div>
                          )}
                          {attendee.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4" />
                              {attendee.phone}
                            </div>
                          )}
                          {attendee.dietary_requirements && (
                            <div className="text-gray-600">
                              <span className="font-medium">Dietary:</span> {attendee.dietary_requirements}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleDownload}
                className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors print:hidden"
              >
                <Download className="w-5 h-5 text-indigo-600 mb-1" />
                <span className="text-xs font-medium text-gray-900">Download</span>
              </button>
              <button
                onClick={handleShare}
                className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors print:hidden"
              >
                <Share2 className="w-5 h-5 text-indigo-600 mb-1" />
                <span className="text-xs font-medium text-gray-900">Share</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Printer className="w-5 h-5 text-indigo-600 mb-1" />
                <span className="text-xs font-medium text-gray-900">Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* Additional Actions - Hidden in print */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 print:hidden">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={addToCalendar}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-gray-900">Add to Calendar</span>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={getDirections}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-gray-900">Get Directions</span>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={contactOrganizer}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-gray-900">Contact Organizer</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Organizer Info - Hidden in print */}
        {eventWithOrganizer.organizer && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 print:hidden">
            <h3 className="font-semibold text-gray-900 mb-4">Event Organizer</h3>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{eventWithOrganizer.organizer.full_name}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                {eventWithOrganizer.organizer.email}
              </div>
              {eventWithOrganizer.organizer.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {eventWithOrganizer.organizer.phone}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Important Notice - Hidden in print */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg print:hidden">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Important Reminders:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Arrive 15 minutes early for smooth check-in</li>
                <li>Bring a valid ID for verification</li>
                <li>This ticket is non-transferable</li>
                <li>Screenshots of QR code are accepted</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
