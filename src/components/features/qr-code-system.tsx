'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getErrorMessage } from '@/lib/utils/errors'
import {
  QrCode,
  Camera,
  Ticket,
  Download,
  Share2,
  Calendar,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  Copy,
  CalendarPlus
} from 'lucide-react'
import { QrReader } from 'react-qr-reader'
import { toast } from 'sonner'
import { logger } from '@/lib/logger';
import {
  generateRegistrationQRCodeAction,
  verifyQRCodeAction,
  downloadQRCodeAction
} from '@/lib/actions/qr-server'

// -----------------------------------------------------------------------------

export interface TicketData {
  id: string
  registration_number: string
  event_title: string
  event_date: string
  event_time: string
  event_venue: string
  event_city: string
  ticket_type: string
  attendee_name: string
  attendee_email: string
  status: string
  checked_in_at?: string
  qr_code_url?: string
}

export interface QRCodeSystemProps {
  registrationId?: string
  eventId?: string
  initialTab?: 'ticket' | 'scanner' | 'manual'
  onCheckInComplete?: (registrationId: string, result: any) => void
  className?: string
}

export function QRCodeSystem({
  registrationId,
  eventId,
  initialTab = 'ticket',
  onCheckInComplete,
  className = ''
}: QRCodeSystemProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Scanner state
  const [scanning, setScanning] = useState(true)
  const [scanResult, setScanResult] = useState<any>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)

  // Manual entry state
  const [manualCode, setManualCode] = useState('')
  const [manualResult, setManualResult] = useState<any>(null)
  const [verifying, setVerifying] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch ticket data on mount
  useEffect(() => {
    if (registrationId && activeTab === 'ticket') {
      fetchTicketData()
    }
  }, [registrationId, activeTab])

  // -----------------------------------------------------------------------------
  // TICKET TAB FUNCTIONS
  // -----------------------------------------------------------------------------

  const fetchTicketData = async () => {
    if (!registrationId) return

    setLoading(true)
    setError(null)

    try {
      const result = await generateRegistrationQRCodeAction({
        registration_id: registrationId,
        format: 'dataurl',
        size: 300,
        style: 'styled'
      })

      if (!result.success) {
        setError(result.error || 'Failed to load ticket')
        return
      }

      setQrCodeData(result.data)

      // Fetch full registration details
      const { supabase } = await import('@/lib/supabase/client')

      if (!supabase) {
        logger.error('Supabase client not available')
        return
      }

      const { data: registration, error } = await (supabase.from('registrations') as any)
        .select(`
          *,
          user:user_id(id, full_name, email, avatar_url),
          event:event_id(id, title, start_date, end_date, venue_name, venue_city, address, organizer_id),
          ticket_type:ticket_type_id(id, name, price)
        `)
        .eq('id', registrationId)
        .single()

      if (error || !registration) {
        setError('Registration not found')
        return
      }

      const eventStart = new Date(registration.event.start_date)
      const eventEnd = new Date(registration.event.end_date)

      setTicketData({
        id: registration.id,
        registration_number: registration.registration_number,
        event_title: registration.event.title,
        event_date: eventStart.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        event_time: `${eventStart.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })} - ${eventEnd.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        event_venue: registration.event.venue_name,
        event_city: registration.event.venue_city,
        ticket_type: registration.ticket_type.name,
        attendee_name: registration.user.full_name,
        attendee_email: registration.user.email,
        status: registration.status,
        checked_in_at: registration.checked_in_at,
        qr_code_url: result.data
      })
    } catch (err: unknown) {
      logger.error('Failed to fetch ticket data:', err)
      setError(getErrorMessage(err) || 'Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTicket = async () => {
    if (!registrationId) return

    try {
      const result = await downloadQRCodeAction(registrationId)

      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : 'Failed to download ticket'
        toast.error(errorMessage || 'Failed to download ticket')
        return
      }

      // Type guard to ensure we have the success response
      if ('downloadUrl' in result && 'filename' in result) {
        // Create download link
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = result.filename
        link.click()

        toast.success('Ticket downloaded successfully')
      }
    } catch (err) {
      logger.error('Failed to download ticket:', err)
      toast.error('Failed to download ticket')
    }
  }

  const handleShareTicket = async () => {
    if (!ticketData || !qrCodeData) return

    if (navigator.share) {
      try {
        // Convert data URL to blob
        const response = await fetch(qrCodeData)
        const blob = await response.blob()
        const file = new File([blob], 'ticket.png', { type: 'image/png' })

        await navigator.share({
          title: `${ticketData.event_title} Ticket`,
          text: `My ticket for ${ticketData.event_title}`,
          files: [file]
        })

        toast.success('Ticket shared successfully')
      } catch (err) {
        logger.error('Failed to share ticket:', err)
        toast.error('Failed to share ticket')
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(qrCodeData)
      toast.success('QR code copied to clipboard')
    }
  }

  const handleAddToCalendar = () => {
    if (!ticketData) return

    // Create calendar event
    const event = {
      title: ticketData.event_title,
      location: `${ticketData.event_venue}, ${ticketData.event_city}`,
      description: `Ticket: ${ticketData.registration_number}\nTicket Type: ${ticketData.ticket_type}`,
      // Would need proper date parsing here
      url: window.location.href
    }

    // Create Google Calendar link
    const calendarUrl = new URL('https://calendar.google.com/calendar/render')
    calendarUrl.searchParams.append('action', 'TEMPLATE')
    calendarUrl.searchParams.append('text', event.title)
    calendarUrl.searchParams.append('location', event.location)
    calendarUrl.searchParams.append('details', event.description)

    window.open(calendarUrl.toString(), '_blank')
    toast.success('Opening calendar...')
  }

  const handleCopyQRCode = () => {
    if (!qrCodeData) return

    navigator.clipboard.writeText(qrCodeData)
    toast.success('QR code copied to clipboard')
  }

  // -----------------------------------------------------------------------------
  // SCANNER TAB FUNCTIONS
  // -----------------------------------------------------------------------------

  const handleScan = async (result: string | null) => {
    if (!result || !scanning) return

    setScanning(false)
    setScanError(null)

    await verifyAndCheckIn(result)
  }

  const handleError = (err: any) => {
    logger.error('QR scan error:', err)
    setScanError('Camera access denied or unavailable')
  }

  const verifyAndCheckIn = async (qrData: string) => {
    setCheckingIn(true)
    setScanResult(null)
    setScanError(null)

    try {
      const result = await verifyQRCodeAction(qrData)

      if (!result.success) {
        setScanError(result.error || 'Invalid QR code')
        return
      }

      setScanResult(result)

      // Auto-check-in if allowed
      if (result.canCheckIn) {
        await performCheckIn(result.registration.id)
      }

      toast.success('QR code verified successfully')
    } catch (err: unknown) {
      logger.error('Failed to verify QR code:', err)
      setScanError(getErrorMessage(err) || 'Failed to verify QR code')
    } finally {
      setCheckingIn(false)
    }
  }

  const performCheckIn = async (registrationId: string) => {
    try {
      const { supabase } = await import('@/lib/supabase/client')

      if (!supabase) {
        logger.error('Supabase client not available')
        return
      }

      const { error } = await (supabase.from('registrations') as any)
        .update({
          status: 'attended',
          checked_in_at: new Date().toISOString()
        })
        .eq('id', registrationId)

      if (error) throw error

      // Update result
      if (scanResult) {
        setScanResult({
          ...scanResult,
          registration: {
            ...scanResult.registration,
            status: 'attended',
            checked_in_at: new Date().toISOString()
          },
          canCheckIn: false,
          isCheckedIn: true
        })
      }

      toast.success('Check-in successful!')

      // Notify parent
      onCheckInComplete?.(registrationId, { success: true })
    } catch (err: unknown) {
      logger.error('Failed to check in:', err)
      toast.error('Failed to check in attendee')
    }
  }

  const resetScanner = () => {
    setScanning(true)
    setScanResult(null)
    setScanError(null)
  }

  // -----------------------------------------------------------------------------
  // MANUAL ENTRY TAB FUNCTIONS
  // -----------------------------------------------------------------------------

  const handleManualVerify = async () => {
    if (!manualCode.trim()) {
      toast.error('Please enter a code')
      return
    }

    setVerifying(true)
    setManualResult(null)

    try {
      const result = await verifyQRCodeAction(manualCode.trim())

      if (!result.success) {
        toast.error(result.error || 'Invalid code')
        return
      }

      setManualResult(result)
      toast.success('Code verified successfully')
    } catch (err: unknown) {
      logger.error('Failed to verify code:', err)
      toast.error('Failed to verify code')
    } finally {
      setVerifying(false)
    }
  }

  const handleManualCheckIn = async () => {
    if (!manualResult?.registration?.id) return

    await performCheckIn(manualResult.registration.id)

    // Update manual result
    if (manualResult) {
      setManualResult({
        ...manualResult,
        registration: {
          ...manualResult.registration,
          status: 'attended'
        },
        canCheckIn: false,
        isCheckedIn: true
      })
    }
  }

  const resetManualEntry = () => {
    setManualCode('')
    setManualResult(null)
  }

  // -----------------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------------

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ticket" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            My Ticket
          </TabsTrigger>
          <TabsTrigger value="scanner" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Scanner
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Manual
          </TabsTrigger>
        </TabsList>

        {/* TICKET TAB */}
        <TabsContent value="ticket" className="space-y-4">
          {loading ? (
            <Card className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading ticket...</p>
            </Card>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : ticketData && qrCodeData ? (
            <div className="space-y-4">
              {/* Ticket Card */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary/60 text-primary-foreground p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{ticketData.event_title}</h2>
                      <p className="text-sm opacity-90 mt-1">{ticketData.registration_number}</p>
                    </div>
                    <Badge
                      variant={ticketData.status === 'confirmed' ? 'default' : ticketData.status === 'attended' ? 'secondary' : 'destructive'}
                      className="bg-white text-primary"
                    >
                      {ticketData.status}
                    </Badge>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="relative bg-white p-4 rounded-lg shadow-inner border">
                      <img src={qrCodeData} alt="Ticket QR Code" className="w-64 h-64" />
                      {ticketData.checked_in_at && (
                        <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg">
                          <div className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            Checked In
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-semibold">{ticketData.event_date}</p>
                        <p className="text-muted-foreground">{ticketData.event_time}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-semibold">{ticketData.event_venue}</p>
                        <p className="text-muted-foreground">{ticketData.event_city}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-semibold">{ticketData.attendee_name}</p>
                        <p className="text-muted-foreground">{ticketData.attendee_email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Ticket className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-semibold">{ticketData.ticket_type}</p>
                        <p className="text-muted-foreground">Ticket Type</p>
                      </div>
                    </div>

                    {ticketData.checked_in_at && (
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-semibold text-green-500">Checked In</p>
                          <p className="text-muted-foreground text-xs">
                            {new Date(ticketData.checked_in_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button onClick={handleDownloadTicket} variant="outline" className="flex flex-col gap-1 h-auto py-3">
                  <Download className="h-5 w-5" />
                  <span className="text-xs">Download</span>
                </Button>

                <Button onClick={handleShareTicket} variant="outline" className="flex flex-col gap-1 h-auto py-3">
                  <Share2 className="h-5 w-5" />
                  <span className="text-xs">Share</span>
                </Button>

                <Button onClick={handleCopyQRCode} variant="outline" className="flex flex-col gap-1 h-auto py-3">
                  <Copy className="h-5 w-5" />
                  <span className="text-xs">Copy QR</span>
                </Button>

                <Button onClick={handleAddToCalendar} variant="outline" className="flex flex-col gap-1 h-auto py-3">
                  <CalendarPlus className="h-5 w-5" />
                  <span className="text-xs">Calendar</span>
                </Button>
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No ticket found</p>
            </Card>
          )}
        </TabsContent>

        {/* SCANNER TAB */}
        <TabsContent value="scanner" className="space-y-4">
          <Card className="overflow-hidden">
            {!scanResult ? (
              <div className="space-y-4">
                {/* Scanner View */}
                {scanning ? (
                  <div className="relative aspect-square bg-black">
                    <QrReader
                      onResult={(result, error) => {
                        if (result) {
                          handleScan(result.getText())
                        }
                        if (error) {
                          handleError(error)
                        }
                      }}
                      constraints={{ facingMode: 'environment' }}
                      className="w-full h-full"
                    />

                    {/* Scanning overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 border-4 border-primary rounded-lg relative">
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-0 right-0 text-center">
                        <p className="text-white text-sm bg-black/50 px-4 py-2 rounded-full inline-block">
                          Point camera at QR code
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {checkingIn ? (
                      <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Verifying ticket...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">QR code captured</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {scanError && (
                  <Alert variant="destructive" className="m-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{scanError}</AlertDescription>
                  </Alert>
                )}

                {/* Reset Button */}
                {!scanning && !checkingIn && (
                  <div className="p-4">
                    <Button onClick={resetScanner} className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Scan Another
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              // Scan Result
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Scan Result</h3>
                  <Button onClick={resetScanner} variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <Alert className={scanResult.isCheckedIn ? "border-green-500" : ""}>
                  <CheckCircle2 className={`h-4 w-4 ${scanResult.isCheckedIn ? 'text-green-500' : ''}`} />
                  <AlertDescription>
                    {scanResult.isCheckedIn
                      ? 'Attendee already checked in'
                      : 'Valid ticket found'}
                  </AlertDescription>
                </Alert>

                <Card className="p-4 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Attendee</p>
                    <p className="font-semibold">{scanResult.registration.attendee.name}</p>
                    <p className="text-sm text-muted-foreground">{scanResult.registration.attendee.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Event</p>
                    <p className="font-semibold">{scanResult.registration.event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(scanResult.registration.event.start_date).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Ticket</p>
                    <p className="font-semibold">{scanResult.registration.ticket_type.name}</p>
                    <p className="text-sm text-muted-foreground">{scanResult.registration.registration_number}</p>
                  </div>
                </Card>

                {scanResult.canCheckIn && (
                  <Button
                    onClick={() => performCheckIn(scanResult.registration.id)}
                    className="w-full"
                    disabled={checkingIn}
                  >
                    {checkingIn ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Checking In...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirm Check-In
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* MANUAL ENTRY TAB */}
        <TabsContent value="manual" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Manual Code Entry</h3>
              <p className="text-sm text-muted-foreground">
                Enter the registration QR code manually to verify and check-in attendees
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="FSTIVO-XXX-XXX"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualVerify()}
                disabled={verifying || !!manualResult}
              />
              <Button
                onClick={handleManualVerify}
                disabled={verifying || !!manualResult}
              >
                {verifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Verify'
                )}
              </Button>
            </div>

            {manualResult && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Verification Result</h4>
                  <Button onClick={resetManualEntry} variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <Alert className={manualResult.isCheckedIn ? "border-green-500" : ""}>
                  <CheckCircle2 className={`h-4 w-4 ${manualResult.isCheckedIn ? 'text-green-500' : ''}`} />
                  <AlertDescription>
                    {manualResult.isCheckedIn
                      ? 'Already checked in'
                      : 'Valid ticket'}
                  </AlertDescription>
                </Alert>

                <Card className="p-4 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Attendee</p>
                    <p className="font-semibold">{manualResult.registration.attendee.name}</p>
                    <p className="text-sm text-muted-foreground">{manualResult.registration.attendee.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Event</p>
                    <p className="font-semibold">{manualResult.registration.event.title}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Ticket</p>
                    <p className="font-semibold">{manualResult.registration.ticket_type.name}</p>
                  </div>
                </Card>

                {manualResult.canCheckIn && (
                  <Button
                    onClick={handleManualCheckIn}
                    className="w-full"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm Check-In
                  </Button>
                )}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Standalone export
export default QRCodeSystem
