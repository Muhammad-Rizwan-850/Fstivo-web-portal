'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  QrCode,
  Search,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Camera,
  CameraOff,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import { QrReader } from 'react-qr-reader'
import type { Event } from '@/lib/types'
import type { AttendeeWithRegistration } from '@/lib/database/queries/registrations'
import { logger } from '@/lib/logger';
import {
  fetchEventById,
  fetchCheckInStats,
  performCheckIn,
  searchEventAttendees,
  fetchEventAttendeesList,
} from '@/lib/actions/events'

// Mock data for testing
const getMockEvent = (eventId: string): Event => ({
  id: eventId,
  title: 'Tech Summit 2024',
  description: 'Annual technology conference',
  short_description: 'Tech conference',
  category: 'Technology',
  event_type: 'conference',
  status: 'published',
  category_id: 'cat_1',
  start_date: new Date().toISOString(),
  end_date: new Date().toISOString(),
  location: { city: 'Lahore', address: 'Convention Center' },
  event_mode: 'in-person',
  is_virtual: false,
  venue_name: 'Convention Center',
  venue_city: 'Lahore',
  capacity: 500,
  banner_url: null,
  is_featured: false,
  price: 5000,
  currency: 'PKR',
  organizer_id: 'org_1',
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

const getMockStats = () => ({ total: 245, checkedIn: 189, pending: 56 })

const getMockAttendees = (): AttendeeWithRegistration[] => [
  {
    id: 'att_1',
    registration_id: 'reg_1',
    full_name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    dietary_requirements: '',
    checked_in_at: undefined,
    created_at: new Date().toISOString(),
    registration: {
      id: 'reg_1',
      registration_number: 'REG-1734567890123',
      status: 'confirmed',
      payment_status: 'paid',
      registered_at: new Date().toISOString(),
    },
    event: {
      id: '1',
      title: 'Tech Summit 2024',
    },
  },
  {
    id: 'att_2',
    registration_id: 'reg_2',
    full_name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+0987654321',
    dietary_requirements: '',
    checked_in_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    registration: {
      id: 'reg_2',
      registration_number: 'REG-1734567890124',
      status: 'confirmed',
      payment_status: 'paid',
      registered_at: new Date().toISOString(),
    },
    event: {
      id: '1',
      title: 'Tech Summit 2024',
    },
  },
]

type ScannerMode = 'qr' | 'search' | 'list'
type CheckInStatus = 'idle' | 'scanning' | 'success' | 'error' | 'already_checked_in'

export function CheckInScanner() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [scannerMode, setScannerMode] = useState<ScannerMode>('qr')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [scannedAttendee, setScannedAttendee] = useState<AttendeeWithRegistration | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AttendeeWithRegistration[]>([])
  const [attendeeList, setAttendeeList] = useState<AttendeeWithRegistration[]>([])
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, pending: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [qrResult, setQrResult] = useState<string | null>(null)

  // Fetch event data and stats
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [eventData, statsData] = await Promise.all([
          fetchEventById(eventId),
          fetchCheckInStats(eventId),
        ])
        setEvent(eventData)
        setStats(statsData)
      } catch (error) {
        logger.error('Error fetching data:', error)
      }
      setIsLoading(false)
    }
    fetchData()
  }, [eventId])

  // Handle QR scan result
  useEffect(() => {
    if (qrResult && isCameraActive) {
      handleCheckIn(qrResult)
      setQrResult(null)
    }
  }, [qrResult, isCameraActive])

  // Handle check-in
  const handleCheckIn = async (registrationNumber: string) => {
    setIsLoading(true)
    setCheckInStatus('scanning')
    setStatusMessage('Verifying registration...')

    try {
      const result = await performCheckIn(registrationNumber)

      if (result.success) {
        setCheckInStatus('success')
        setStatusMessage(result.message)
        setScannedAttendee(result.attendee || null)
        setShowSuccessModal(true)

        // Refresh stats
        const newStats = await fetchCheckInStats(eventId)
        setStats(newStats)

        if (scannerMode === 'list') {
          const attendees = await fetchEventAttendeesList(eventId)
          setAttendeeList(attendees)
        }
      } else {
        setCheckInStatus('error')
        setStatusMessage(result.message)
      }
    } catch (error) {
      setCheckInStatus('error')
      setStatusMessage('An error occurred during check-in')
      setShowSuccessModal(true)
    } finally {
      setIsLoading(false)
    }

    // Stop camera after successful scan
    if (isCameraActive) {
      setIsCameraActive(false)
    }
  }

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    try {
      const results = await searchEventAttendees(eventId, searchQuery)
      setSearchResults(results)
      setScannerMode('search')
    } catch (error) {
      logger.error('Error searching attendees:', error)
    }
    setIsLoading(false)
  }

  // Load attendee list
  const loadAttendeeList = async () => {
    setIsLoading(true)
    try {
      const attendees = await fetchEventAttendeesList(eventId)
      setAttendeeList(attendees)
      setScannerMode('list')
    } catch (error) {
      logger.error('Error loading attendees:', error)
    }
    setIsLoading(false)
  }

  // Manual check-in from list/search
  const manualCheckIn = async (registrationNumber: string) => {
    await handleCheckIn(registrationNumber)
  }

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive)
    setCheckInStatus('idle')
    setStatusMessage('')
  }

  const getCheckInPercentage = () => {
    if (stats.total === 0) return 0
    return Math.round((stats.checkedIn / stats.total) * 100)
  }

  if (isLoading && !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/dashboard/events/${eventId}`}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Check-in Scanner</h1>
                {event && (
                  <p className="text-sm text-gray-600 truncate max-w-md">{event.title}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Registrations</h3>
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500 mt-2">Confirmed attendees</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Checked In</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.checkedIn}</p>
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium text-gray-900">{getCheckInPercentage()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${getCheckInPercentage()}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Pending</h3>
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
            <p className="text-sm text-gray-500 mt-2">Awaiting check-in</p>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setScannerMode('qr')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  scannerMode === 'qr'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <QrCode className="w-5 h-5" />
                  <span>QR Scanner</span>
                </div>
              </button>
              <button
                onClick={() => setScannerMode('search')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  scannerMode === 'search'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </div>
              </button>
              <button
                onClick={loadAttendeeList}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  scannerMode === 'list'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>All Attendees</span>
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* QR Scanner Mode */}
            {scannerMode === 'qr' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Scan QR Code</h2>
                  <p className="text-gray-600">
                    Point camera at attendee's QR code to check them in
                  </p>
                </div>

                {!isCameraActive ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                      <QrCode className="w-24 h-24 text-gray-400" />
                    </div>
                    <button
                      onClick={toggleCamera}
                      className="flex items-center space-x-2 px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Start Camera</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* QR Scanner */}
                    <div className="max-w-md mx-auto">
                      <QrReader
                        onResult={(result: any) => {
                          if (result?.text && isCameraActive) {
                            setQrResult(result.text)
                          }
                        }}
                        constraints={{ facingMode: 'environment' }}
                        className="w-full rounded-lg overflow-hidden"
                        containerStyle={{ borderRadius: '12px', overflow: 'hidden' }}
                        videoContainerStyle={{ paddingTop: '100%' }}
                        videoStyle={{ objectFit: 'cover' }}
                      />
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={toggleCamera}
                        className="flex items-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        <CameraOff className="w-5 h-5" />
                        <span>Stop Camera</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Manual Entry */}
                <div className="border-t border-gray-200 pt-6">
                  <p className="text-center text-gray-600 mb-4">Or enter registration number manually</p>
                  <div className="max-w-md mx-auto flex space-x-3">
                    <input
                      type="text"
                      placeholder="Enter registration number"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCheckIn((e.target as HTMLInputElement).value)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = document.querySelector('input') as HTMLInputElement
                        if (input?.value) {
                          handleCheckIn(input.value)
                          input.value = ''
                        }
                      }}
                      disabled={isLoading}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Check In'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Search Mode */}
            {scannerMode === 'search' && (
              <div className="space-y-6">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch()
                      }
                    }}
                    placeholder="Search by name or email..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    </h3>
                    {searchResults.map((attendee) => (
                      <div
                        key={attendee.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{attendee.full_name}</p>
                            <p className="text-sm text-gray-600">{attendee.email}</p>
                            <p className="text-xs text-gray-500">
                              Reg: {attendee.registration.registration_number || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => manualCheckIn(attendee.registration.registration_number || '')}
                          disabled={attendee.registration.status === 'attended'}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            attendee.registration.status === 'attended'
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {attendee.registration.status === 'attended' ? 'Checked In' : 'Check In'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery && searchResults.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No attendees found</p>
                  </div>
                )}
              </div>
            )}

            {/* List Mode */}
            {scannerMode === 'list' && (
              <div className="space-y-4">
                {attendeeList.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700">
                        All Attendees ({attendeeList.length})
                      </h3>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {attendeeList.map((attendee) => (
                        <div
                          key={attendee.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                attendee.registration.status === 'attended'
                                  ? 'bg-green-100'
                                  : 'bg-gray-200'
                              }`}
                            >
                              <User
                                className={`w-6 h-6 ${
                                  attendee.registration.status === 'attended'
                                    ? 'text-green-600'
                                    : 'text-gray-600'
                                }`}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{attendee.full_name}</p>
                              <p className="text-sm text-gray-600">{attendee.email}</p>
                              <p className="text-xs text-gray-500">
                                {attendee.registration.registration_number || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {attendee.registration.status === 'attended' && (
                              <span className="flex items-center space-x-1 text-sm text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>Checked In</span>
                              </span>
                            )}
                            <button
                              onClick={() =>
                                manualCheckIn(attendee.registration.registration_number || '')
                              }
                              disabled={attendee.registration.status === 'attended'}
                              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                                attendee.registration.status === 'attended'
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              }`}
                            >
                              {attendee.registration.status === 'attended' ? 'Done' : 'Check In'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No attendees registered yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success/Error Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all">
            {checkInStatus === 'success' && scannedAttendee && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Check-in Successful!</h3>
                  <p className="text-gray-600">{statusMessage}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{scannedAttendee.full_name}</p>
                      <p className="text-sm text-gray-600">{scannedAttendee.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Registration</p>
                      <p className="font-medium text-gray-900">
                        {scannedAttendee.registration.registration_number || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Event</p>
                      <p className="font-medium text-gray-900 truncate">{scannedAttendee.event.title}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {checkInStatus === 'error' && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Check-in Failed</h3>
                  <p className="text-gray-600">{statusMessage}</p>
                </div>
              </>
            )}

            {checkInStatus === 'already_checked_in' && scannedAttendee && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Already Checked In</h3>
                  <p className="text-gray-600">{statusMessage}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{scannedAttendee.full_name}</p>
                      <p className="text-sm text-gray-600">{scannedAttendee.email}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              onClick={() => {
                setShowSuccessModal(false)
                setCheckInStatus('idle')
                setScannedAttendee(null)
              }}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
