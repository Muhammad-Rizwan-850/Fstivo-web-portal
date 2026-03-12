'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, CreditCard, Check, AlertCircle, Loader2 } from 'lucide-react'
import type { Event, PaymentMethod } from '@/lib/types'
import { fetchEventById, fetchEventTickets } from '@/lib/actions/events'
import { createEventRegistrationAction, type RegistrationFormData } from '@/lib/actions/registration-server'
import { logger } from '@/lib/logger';

interface EventRegistrationProps {
  eventId: string
}

export function EventRegistration({ eventId }: EventRegistrationProps) {
  const [step, setStep] = useState(1)
  const [event, setEvent] = useState<Event | null>(null)
  const [ticketTypes, setTicketTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [registrationData, setRegistrationData] = useState<any>(null)

  const [formData, setFormData] = useState({
    ticket_type_id: '',
    quantity: 1,
    attendees: [{
      full_name: '',
      email: '',
      phone: '',
      dietary_requirements: ''
    }],
    payment_method: 'stripe' as PaymentMethod,
    total_amount: 0
  })

  useEffect(() => {
    fetchEventData()
  }, [])

  useEffect(() => {
    calculateTotal()
  }, [formData.ticket_type_id, formData.quantity])

  const fetchEventData = async () => {
    try {
      setLoading(true)

      const eventData = await fetchEventById(eventId)

      if (!eventData) {
        throw new Error('Event not found')
      }

      setEvent(eventData)

      const ticketsData = await fetchEventTickets(eventId)
      setTicketTypes(ticketsData || [])

    } catch (err) {
      logger.error('Error fetching event:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch event details')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    const ticket = ticketTypes.find(t => t.id === formData.ticket_type_id)
    if (ticket) {
      const total = ticket.price * formData.quantity
      setFormData(prev => ({ ...prev, total_amount: total }))
    }
  }

  const updateAttendee = (index: number, field: string, value: string) => {
    const newAttendees = [...formData.attendees]
    newAttendees[index] = { ...newAttendees[index], [field]: value }
    setFormData(prev => ({ ...prev, attendees: newAttendees }))
  }

  const validateStep = () => {
    if (step === 1) {
      if (!formData.ticket_type_id || formData.quantity < 1) {
        setError('Please select a ticket type and quantity')
        return false
      }
    } else if (step === 2) {
      const requiredAttendees = formData.attendees.slice(0, formData.quantity)
      for (const attendee of requiredAttendees) {
        if (!attendee.full_name || !attendee.email) {
          setError('Please fill in all attendee information')
          return false
        }
      }
    }
    setError(null)
    return true
  }

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep()) return

    setSubmitting(true)
    setError(null)

    try {
      // Prepare registration data
      const registrationData: RegistrationFormData = {
        event_id: eventId,
        ticket_type_id: formData.ticket_type_id,
        quantity: formData.quantity,
        total_amount: formData.total_amount,
        payment_method: formData.payment_method,
        attendees: formData.attendees.slice(0, formData.quantity).map(a => ({
          full_name: a.full_name,
          email: a.email,
          phone: a.phone || undefined,
          dietary_requirements: a.dietary_requirements || undefined,
        })),
      }

      // Call server action
      const result = await createEventRegistrationAction(registrationData)

      if (result.error) {
        setError(result.error)
        setSubmitting(false)
        return
      }

      setRegistrationData(result.registration)
      setSuccess(true)

    } catch (err) {
      logger.error('Registration error:', err)
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSuccess(false)
    setStep(1)
    setFormData({
      ticket_type_id: '',
      quantity: 1,
      attendees: [{ full_name: '', email: '', phone: '', dietary_requirements: '' }],
      payment_method: 'stripe',
      total_amount: 0
    })
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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your registration number is: <span className="font-bold text-indigo-600">{registrationData?.registration_number}</span>
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-2">Registration Details:</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tickets:</span>
                <span className="font-medium">{formData.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">₨{formData.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-yellow-600">Pending Payment</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            A confirmation email has been sent to your registered email address.
          </p>
          <button
            onClick={() => alert('Redirecting to payment...')}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 mb-3 transition-colors"
          >
            Proceed to Payment
          </button>
          <button
            onClick={resetForm}
            className="text-indigo-600 hover:text-indigo-700 text-sm"
          >
            Register Another Ticket
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Event Header */}
        {event && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <img
              src={event.banner_image || event.cover_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
              alt={event.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
              <p className="text-gray-600 mb-4">{event.short_description || event.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.start_date).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {event.venue_name || event.location?.venue || 'TBD'}, {event.venue_city || event.location?.city || 'TBD'}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {event.capacity || 'N/A'} capacity
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between overflow-x-auto">
            {['Select Tickets', 'Attendee Info', 'Payment'].map((label, index) => (
              <div key={index} className="flex items-center flex-shrink-0">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step > index + 1 ? 'bg-green-600 text-white' :
                  step === index + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > index + 1 ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step >= index + 1 ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {label}
                </span>
                {index < 2 && (
                  <div className={`w-16 h-1 mx-4 ${
                    step > index + 1 ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: Select Tickets */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Select Your Tickets</h2>

              <div className="space-y-4">
                {ticketTypes.map(ticket => (
                  <label
                    key={ticket.id}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.ticket_type_id === ticket.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="ticket"
                        value={ticket.id}
                        checked={formData.ticket_type_id === ticket.id}
                        onChange={(e) => setFormData(prev => ({ ...prev, ticket_type_id: e.target.value }))}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{ticket.name}</p>
                        <p className="text-sm text-gray-600">
                          {ticket.available !== undefined ? `${ticket.available} tickets available` : `${ticket.quantity_available} tickets available`}
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {ticket.price === 0 ? 'Free' : `₨${ticket.price.toLocaleString()}`}
                    </p>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Tickets
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.quantity}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value) || 1
                    setFormData(prev => ({
                      ...prev,
                      quantity: qty,
                      attendees: Array.from({ length: qty }, (_, i) => prev.attendees[i] || {
                        full_name: '', email: '', phone: '', dietary_requirements: ''
                      })
                    }))
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {formData.ticket_type_id && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ₨{formData.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Attendee Information */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Attendee Information</h2>

              {formData.attendees.slice(0, formData.quantity).map((attendee, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Attendee {index + 1}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={attendee.full_name}
                        onChange={(e) => updateAttendee(index, 'full_name', e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={attendee.email}
                        onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={attendee.phone}
                        onChange={(e) => updateAttendee(index, 'phone', e.target.value)}
                        placeholder="+92 300 1234567"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dietary Requirements
                      </label>
                      <input
                        type="text"
                        value={attendee.dietary_requirements}
                        onChange={(e) => updateAttendee(index, 'dietary_requirements', e.target.value)}
                        placeholder="e.g., Vegetarian"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>

              <div className="space-y-3">
                {['stripe', 'jazzcash', 'easypaisa', 'bank_transfer'].map(method => (
                  <label
                    key={method}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.payment_method === method
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={formData.payment_method === method}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as PaymentMethod }))}
                      className="w-4 h-4 text-indigo-600 mr-3"
                    />
                    <CreditCard className="w-5 h-5 text-gray-600 mr-3" />
                    <span className="font-medium text-gray-900 capitalize">
                      {method.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ticket Type:</span>
                    <span className="font-medium">
                      {ticketTypes.find(t => t.id === formData.ticket_type_id)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{formData.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price per ticket:</span>
                    <span className="font-medium">
                      ₨{(ticketTypes.find(t => t.id === formData.ticket_type_id)?.price || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      ₨{formData.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <button
              onClick={() => setStep(prev => Math.max(1, prev - 1))}
              disabled={step === 1}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Complete Registration
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
