/**
 * Tickets Section Component
 * Display QR code tickets for confirmed registrations
 */

'use client'

import { useState } from 'react'
import { Download, Printer, Share2, QrCode } from 'lucide-react'
import type { RegistrationWithEvent } from '@/lib/types'
import { generateTicketQR } from '@/lib/actions/attendees'
import { logger } from '@/lib/logger';

interface TicketsSectionProps {
  registrations: RegistrationWithEvent[]
}

export function TicketsSection({ registrations }: TicketsSectionProps) {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({})

  // Get confirmed registrations (have valid tickets)
  const tickets = registrations.filter(
    (r) => r.status === 'confirmed' || r.status === 'attended'
  )

  // Generate QR code for a registration
  async function handleGenerateQR(registrationId: string) {
    if (qrCodes[registrationId]) {
      setSelectedTicket(registrationId)
      return
    }

    try {
      const ticket = await generateTicketQR(registrationId)
      if (ticket) {
        setQrCodes((prev) => ({ ...prev, [registrationId]: ticket.qrCodeDataURL }))
        setSelectedTicket(registrationId)
      }
    } catch (error) {
      logger.error('[Tickets] Failed to generate QR:', error)
    }
  }

  // Download ticket as image
  async function handleDownload(registration: RegistrationWithEvent) {
    const qrData = qrCodes[registration.id]
    if (!qrData) return

    // Create a temporary link to download
    const link = document.createElement('a')
    link.href = qrData
    link.download = `ticket-${registration.registration_number || registration.id}.png`
    link.click()
  }

  // Print ticket
  function handlePrint(registration: RegistrationWithEvent) {
    window.print()
  }

  // Share ticket
  async function handleShare(registration: RegistrationWithEvent) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: registration.event?.title || 'Event Ticket',
          text: `My ticket for ${registration.event?.title}`,
          url: window.location.href,
        })
      } catch (error) {
        logger.error('[Tickets] Failed to share:', error)
      }
    }
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets yet</h3>
        <p className="text-gray-500 mb-6">
          You'll see your tickets here after registering for events
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">My Tickets</h2>
        <p className="text-sm text-gray-500">{tickets.length} tickets</p>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tickets.map((registration) => {
          const eventDate = new Date(registration.event?.start_date || '')
          const hasQR = qrCodes[registration.id]
          const isSelected = selectedTicket === registration.id

          return (
            <div
              key={registration.id}
              className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all ${
                isSelected ? 'border-indigo-500' : 'border-gray-200'
              }`}
            >
              {/* Event Header */}
              <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-600">
                {registration.event?.cover_image_url && (
                  <img
                    src={registration.event.cover_image_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
                  />
                )}
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        registration.status === 'attended'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {registration.status === 'attended' ? 'Attended' : 'Valid'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {registration.event?.title}
                  </h3>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date</span>
                    <span className="font-medium text-gray-900">
                      {eventDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {registration.event?.venue_city && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location</span>
                      <span className="font-medium text-gray-900">
                        {registration.event.venue_city}
                      </span>
                    </div>
                  )}
                  {registration.ticket_type && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ticket</span>
                      <span className="font-medium text-gray-900">
                        {registration.ticket_type.name}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ticket #</span>
                    <span className="font-medium text-gray-900 font-mono text-xs">
                      {registration.registration_number || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {hasQR ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={qrCodes[registration.id]}
                        alt="QR Code"
                        className="w-40 h-40"
                      />
                      <p className="text-xs text-gray-500 text-center">
                        Show this QR code at the event entrance
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(registration)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                        <button
                          onClick={() => handlePrint(registration)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                        >
                          <Printer className="h-4 w-4" />
                          Print
                        </button>
                        <button
                          onClick={() => handleShare(registration)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                        >
                          <Share2 className="h-4 w-4" />
                          Share
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleGenerateQR(registration.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      <QrCode className="h-5 w-5" />
                      Generate QR Code
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
