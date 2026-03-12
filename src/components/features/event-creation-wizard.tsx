'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Image as ImageIcon,
  Tag,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  Loader2,
  Save,
  Eye,
  Globe,
  Building,
  AlertCircle,
} from 'lucide-react'
import type { EventCategory, EventMode, EventType } from '@/lib/types'
import { fetchEventCategories } from '@/lib/actions/events'
import { EVENT_CATEGORIES, EVENT_FIELDS, getFieldsByCategory, getCategoryById } from '@/lib/event-categories'
import { createEventWithTicketsAction, saveEventDraftAction, publishEventDraftAction, type EventWithTicketsFormData } from '@/lib/actions/event-creation-server'
import { logger } from '@/lib/logger';

// Use new category system
const getMockCategories = (): EventCategory[] => EVENT_CATEGORIES

// Form interfaces
interface TicketTypeInput {
  id: string
  name: string
  description: string
  price: number
  quantity_available: number
}

interface EventFormData {
  // Basic Info
  title: string
  description: string
  short_description: string
  event_type: EventType
  category_id: string
  field_id: string

  // Date & Time
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  registration_opens_at: string
  registration_closes_at: string
  timezone: string

  // Location
  event_mode: EventMode
  venue_name: string
  venue_city: string
  venue_address: string
  venue_country: string
  virtual_meeting_link: string

  // Capacity & Pricing
  capacity: number
  min_attendees: number
  base_price: number
  currency: string

  // Media
  banner_image: string
  cover_image_url: string

  // Additional Features
  tags: string[]
  waitlist_enabled: boolean

  // Settings
  is_published: boolean
}

const initialFormData: EventFormData = {
  title: '',
  description: '',
  short_description: '',
  event_type: 'conference',
  category_id: '',
  field_id: '',
  start_date: '',
  end_date: '',
  start_time: '09:00',
  end_time: '17:00',
  registration_opens_at: '',
  registration_closes_at: '',
  timezone: 'Asia/Karachi',
  event_mode: 'in-person',
  venue_name: '',
  venue_city: '',
  venue_address: '',
  venue_country: 'Pakistan',
  virtual_meeting_link: '',
  capacity: 100,
  min_attendees: 0,
  base_price: 0,
  currency: 'PKR',
  banner_image: '',
  cover_image_url: '',
  tags: [],
  waitlist_enabled: false,
  is_published: false,
}

const initialTicketType: TicketTypeInput = {
  id: crypto.randomUUID(),
  name: 'General Admission',
  description: '',
  price: 0,
  quantity_available: 100,
}

type Step = 'basic' | 'datetime' | 'location' | 'tickets' | 'media' | 'review'

const steps: { id: Step; title: string; icon: React.ElementType }[] = [
  { id: 'basic', title: 'Basic Info', icon: Tag },
  { id: 'datetime', title: 'Date & Time', icon: Calendar },
  { id: 'location', title: 'Location', icon: MapPin },
  { id: 'tickets', title: 'Tickets', icon: DollarSign },
  { id: 'media', title: 'Media', icon: ImageIcon },
  { id: 'review', title: 'Review', icon: Eye },
]

export function EventCreationWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('basic')
  const [formData, setFormData] = useState<EventFormData>(initialFormData)
  const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([initialTicketType])
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdEventId, setCreatedEventId] = useState<string | null>(null)

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await fetchEventCategories()
        setCategories(cats)
      } catch (err) {
        logger.error('Error fetching categories:', err)
        setCategories(getMockCategories())
      }
    }
    fetchCategories()
  }, [])

  const updateFormData = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 'basic':
        return !!(
          formData.title.trim() &&
          formData.description.trim() &&
          formData.short_description.trim() &&
          formData.category_id
        )
      case 'datetime':
        return !!(
          formData.start_date &&
          formData.end_date &&
          formData.registration_opens_at &&
          formData.registration_closes_at
        )
      case 'location':
        if (formData.event_mode === 'in-person') {
          return !!(formData.venue_name && formData.venue_city)
        }
        if (formData.event_mode === 'virtual') {
          return !!formData.virtual_meeting_link
        }
        return true
      case 'tickets':
        return ticketTypes.length > 0 && ticketTypes.every(t => t.name.trim() && t.price >= 0)
      case 'media':
        return true // Optional
      case 'review':
        return true
      default:
        return false
    }
  }

  const goToStep = (step: Step) => {
    if (validateCurrentStep()) {
      setCurrentStep(step)
      setError(null)
    } else {
      setError('Please fill in all required fields before proceeding')
    }
  }

  const goToNextStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    if (currentIndex < steps.length - 1) {
      goToStep(steps[currentIndex + 1].id)
    }
  }

  const goToPreviousStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    }
    setError(null)
  }

  const addTicketType = () => {
    setTicketTypes(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `Ticket Type ${prev.length + 1}`,
        description: '',
        price: 0,
        quantity_available: 100,
      },
    ])
  }

  const removeTicketType = (id: string) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(prev => prev.filter(t => t.id !== id))
    }
  }

  const updateTicketType = (id: string, field: keyof TicketTypeInput, value: any) => {
    setTicketTypes(prev =>
      prev.map(t => (t.id === id ? { ...t, [field]: value } : t))
    )
  }

  const handleSubmit = async (publish: boolean = false) => {
    if (!validateCurrentStep()) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Prepare data for server action
      const eventData: EventWithTicketsFormData = {
        title: formData.title,
        short_description: formData.short_description,
        description: formData.description,
        event_type: formData.event_type,
        category_id: formData.category_id,
        field_id: formData.field_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        registration_opens_at: formData.registration_opens_at,
        registration_closes_at: formData.registration_closes_at,
        timezone: formData.timezone,
        event_mode: formData.event_mode,
        venue_name: formData.venue_name,
        venue_city: formData.venue_city,
        venue_address: formData.venue_address,
        venue_country: formData.venue_country,
        virtual_meeting_link: formData.virtual_meeting_link,
        capacity: formData.capacity,
        min_attendees: formData.min_attendees,
        base_price: formData.base_price,
        currency: formData.currency,
        banner_image: formData.banner_image,
        cover_image_url: formData.cover_image_url,
        tags: formData.tags,
        waitlist_enabled: formData.waitlist_enabled,
        is_published: publish,
        ticket_types: ticketTypes.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          price: t.price,
          quantity_available: t.quantity_available,
        })),
      }

      // Call server action
      const result = await createEventWithTicketsAction(eventData)

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      if (result.event) {
        setCreatedEventId(result.event.id)
        // Redirect to event management page
        router.push(`/dashboard/events/${result.event.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
      setIsLoading(false)
    }
  }

  const saveDraft = async () => {
    setIsSavingDraft(true)
    setError(null)

    try {
      // Prepare data for server action
      const eventData: EventWithTicketsFormData = {
        title: formData.title,
        short_description: formData.short_description,
        description: formData.description,
        event_type: formData.event_type,
        category_id: formData.category_id,
        field_id: formData.field_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        registration_opens_at: formData.registration_opens_at,
        registration_closes_at: formData.registration_closes_at,
        timezone: formData.timezone,
        event_mode: formData.event_mode,
        venue_name: formData.venue_name,
        venue_city: formData.venue_city,
        venue_address: formData.venue_address,
        venue_country: formData.venue_country,
        virtual_meeting_link: formData.virtual_meeting_link,
        capacity: formData.capacity,
        min_attendees: formData.min_attendees,
        base_price: formData.base_price,
        currency: formData.currency,
        banner_image: formData.banner_image,
        cover_image_url: formData.cover_image_url,
        tags: formData.tags,
        waitlist_enabled: formData.waitlist_enabled,
        is_published: false,
        ticket_types: ticketTypes.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          price: t.price,
          quantity_available: t.quantity_available,
        })),
      }

      // Call server action
      const result = await saveEventDraftAction(eventData)

      if (result.error) {
        setError(result.error)
        setIsSavingDraft(false)
        return
      }

      if (result.event) {
        setCreatedEventId(result.event.id)
        setIsSavingDraft(false)
        // Show success message (could use a toast here)
        alert('Draft saved successfully!')
      }
    } catch (err) {
      logger.error('Failed to save draft:', err)
      setError(err instanceof Error ? err.message : 'Failed to save draft')
      setIsSavingDraft(false)
    }
  }

  const getCurrentStepIndex = () => steps.findIndex(s => s.id === currentStep)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
            </div>
            <button
              onClick={saveDraft}
              disabled={isSavingDraft}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isSavingDraft ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Draft</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isCompleted = getCurrentStepIndex() > index

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : isCompleted
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 bg-white text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`text-sm mt-2 text-center ${
                        isActive ? 'font-semibold text-indigo-600' : 'text-gray-600'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        getCurrentStepIndex() > index ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          {currentStep === 'basic' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
                <p className="text-gray-600">Tell us about your event</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="e.g., Tech Conference 2025"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => updateFormData('short_description', e.target.value)}
                  placeholder="A brief one-line description (shown in event cards)"
                  maxLength={150}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.short_description.length}/150 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Describe your event in detail..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => updateFormData('event_type', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="conference">Conference</option>
                    <option value="workshop">Workshop</option>
                    <option value="seminar">Seminar</option>
                    <option value="competition">Competition</option>
                    <option value="networking">Networking</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => {
                      updateFormData('category_id', e.target.value)
                      updateFormData('field_id', '') // Reset field when category changes
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Cards - Visual Selection */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Or select a category visually
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        updateFormData('category_id', cat.id)
                        updateFormData('field_id', '')
                      }}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        formData.category_id === cat.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className="text-xs font-medium text-gray-900">{cat.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Field/Subcategory Selection */}
              {formData.category_id && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Field/Subcategory <span className="text-gray-500">(Optional)</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => updateFormData('field_id', '')}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        formData.field_id === ''
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-medium">All Fields</div>
                    </button>
                    {getFieldsByCategory(formData.category_id).map((field) => (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => updateFormData('field_id', field.id)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          formData.field_id === field.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-sm font-medium">{field.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'datetime' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Date & Time</h2>
                <p className="text-gray-600">When is your event happening?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => updateFormData('start_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => updateFormData('start_time', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => updateFormData('end_date', e.target.value)}
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => updateFormData('end_time', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Period</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Opens <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.registration_opens_at}
                      onChange={(e) => updateFormData('registration_opens_at', e.target.value)}
                      max={formData.start_date}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Closes <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.registration_closes_at}
                      onChange={(e) => updateFormData('registration_closes_at', e.target.value)}
                      min={formData.registration_opens_at}
                      max={formData.start_date}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timezone</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => updateFormData('timezone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Asia/Karachi">Pakistan Time (PKT)</option>
                    <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
                    <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                    <option value="Australia/Sydney">Australian Eastern Time (AET)</option>
                    <option value="UTC">UTC</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    All event times will be displayed in this timezone
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'location' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Location</h2>
                <p className="text-gray-600">Where is your event taking place?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Mode <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(
                    [
                      { value: 'in-person', icon: Building, label: 'In-Person' },
                      { value: 'virtual', icon: Globe, label: 'Virtual' },
                      { value: 'hybrid', icon: Users, label: 'Hybrid' },
                    ] as const
                  ).map((mode) => {
                    const Icon = mode.icon
                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => updateFormData('event_mode', mode.value)}
                        className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all ${
                          formData.event_mode === mode.value
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="font-medium">{mode.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {(formData.event_mode === 'in-person' || formData.event_mode === 'hybrid') && (
                <div className="space-y-6 border-t border-gray-200 pt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.venue_name}
                      onChange={(e) => updateFormData('venue_name', e.target.value)}
                      placeholder="e.g., Convention Center"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.venue_city}
                      onChange={(e) => updateFormData('venue_city', e.target.value)}
                      placeholder="e.g., Karachi"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.venue_country}
                      onChange={(e) => updateFormData('venue_country', e.target.value)}
                      placeholder="e.g., Pakistan"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Address
                    </label>
                    <textarea
                      value={formData.venue_address}
                      onChange={(e) => updateFormData('venue_address', e.target.value)}
                      placeholder="Complete venue address..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {(formData.event_mode === 'virtual' || formData.event_mode === 'hybrid') && (
                <div className="space-y-6 border-t border-gray-200 pt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Virtual Meeting Link <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={formData.virtual_meeting_link}
                      onChange={(e) => updateFormData('virtual_meeting_link', e.target.value)}
                      placeholder="https://zoom.us/meeting/..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'tickets' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Types</h2>
                <p className="text-gray-600">Create different ticket options for your event</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => updateFormData('capacity', parseInt(e.target.value) || 0)}
                    min={1}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Attendees
                  </label>
                  <input
                    type="number"
                    value={formData.min_attendees}
                    onChange={(e) => updateFormData('min_attendees', parseInt(e.target.value) || 0)}
                    min={0}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum required for event to proceed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => updateFormData('currency', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="PKR">PKR (Pakistani Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="waitlist_enabled"
                  checked={formData.waitlist_enabled}
                  onChange={(e) => updateFormData('waitlist_enabled', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="waitlist_enabled" className="text-sm font-medium text-gray-700">
                  Enable waitlist when event is full
                </label>
              </div>

              <div className="space-y-4">
                {ticketTypes.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Ticket Type {index + 1}</h4>
                      {ticketTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicketType(ticket.id)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={ticket.name}
                          onChange={(e) => updateTicketType(ticket.id, 'name', e.target.value)}
                          placeholder="e.g., General Admission"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price ({formData.currency}) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={ticket.price}
                          onChange={(e) =>
                            updateTicketType(ticket.id, 'price', parseFloat(e.target.value) || 0)
                          }
                          min={0}
                          step={0.01}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity Available
                        </label>
                        <input
                          type="number"
                          value={ticket.quantity_available}
                          onChange={(e) =>
                            updateTicketType(
                              ticket.id,
                              'quantity_available',
                              parseInt(e.target.value) || 0
                            )
                          }
                          min={1}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          value={ticket.description}
                          onChange={(e) =>
                            updateTicketType(ticket.id, 'description', e.target.value)
                          }
                          placeholder="Optional description"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addTicketType}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-600 hover:text-indigo-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Another Ticket Type</span>
                </button>
              </div>
            </div>
          )}

          {currentStep === 'media' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Media & Images</h2>
                <p className="text-gray-600">Add visuals to make your event stand out</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Image URL
                </label>
                <input
                  type="url"
                  value={formData.banner_image}
                  onChange={(e) => updateFormData('banner_image', e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {formData.banner_image && (
                  <div className="mt-4">
                    <img
                      src={formData.banner_image}
                      alt="Banner preview"
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23ddd" width="400" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage not available%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={formData.cover_image_url}
                  onChange={(e) => updateFormData('cover_image_url', e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Type a tag and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const value = (e.target as HTMLInputElement).value.trim()
                      if (value && !formData.tags.includes(value)) {
                        updateFormData('tags', [...formData.tags, value])
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const newTags = formData.tags.filter((_, i) => i !== index)
                            updateFormData('tags', newTags)
                          }}
                          className="hover:text-indigo-900 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Add tags to help users discover your event (e.g., &quot;technology&quot;, &quot;networking&quot;, &quot;free&quot;)
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Use high-quality images (1200x630px recommended) for best results.
                  You can also upload images later from the event dashboard.
                </p>
              </div>
            </div>
          )}

          {currentStep === 'review' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Publish</h2>
                <p className="text-gray-600">Review your event details before publishing</p>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Title:</span>
                      <p className="font-medium text-gray-900">{formData.title || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <p className="font-medium text-gray-900 capitalize">{formData.event_type}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Short Description:</span>
                      <p className="font-medium text-gray-900">
                        {formData.short_description || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Date & Time</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Start:</span>
                      <p className="font-medium text-gray-900">
                        {formData.start_date} at {formData.start_time}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">End:</span>
                      <p className="font-medium text-gray-900">
                        {formData.end_date} at {formData.end_time}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Registration Opens:</span>
                      <p className="font-medium text-gray-900">{formData.registration_opens_at}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Registration Closes:</span>
                      <p className="font-medium text-gray-900">{formData.registration_closes_at}</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Mode:</span>
                      <p className="font-medium text-gray-900 capitalize">{formData.event_mode}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Timezone:</span>
                      <p className="font-medium text-gray-900">{formData.timezone}</p>
                    </div>
                    {(formData.event_mode === 'in-person' || formData.event_mode === 'hybrid') && (
                      <>
                        {formData.venue_name && (
                          <div>
                            <span className="text-gray-600">Venue:</span>
                            <p className="font-medium text-gray-900">{formData.venue_name}</p>
                          </div>
                        )}
                        {formData.venue_city && (
                          <div>
                            <span className="text-gray-600">City:</span>
                            <p className="font-medium text-gray-900">{formData.venue_city}</p>
                          </div>
                        )}
                        {formData.venue_country && (
                          <div>
                            <span className="text-gray-600">Country:</span>
                            <p className="font-medium text-gray-900">{formData.venue_country}</p>
                          </div>
                        )}
                      </>
                    )}
                    {(formData.event_mode === 'virtual' || formData.event_mode === 'hybrid') &&
                      formData.virtual_meeting_link && (
                        <div className="md:col-span-2">
                          <span className="text-gray-600">Virtual Link:</span>
                          <p className="font-medium text-gray-900 break-all">
                            {formData.virtual_meeting_link}
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                {/* Tickets */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Types & Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-600">Capacity:</span>
                      <p className="font-medium text-gray-900">{formData.capacity}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Minimum Attendees:</span>
                      <p className="font-medium text-gray-900">{formData.min_attendees || 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Waitlist:</span>
                      <p className="font-medium text-gray-900">
                        {formData.waitlist_enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {ticketTypes.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{ticket.name}</p>
                          <p className="text-sm text-gray-600">
                            {ticket.quantity_available || 'Unlimited'} available
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {ticket.price === 0 ? 'Free' : `${formData.currency} ${ticket.price}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                {formData.tags.length > 0 && (
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Banner Preview */}
                {formData.banner_image && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Banner Image</h3>
                    <img
                      src={formData.banner_image}
                      alt="Event banner"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={goToPreviousStep}
              disabled={currentStep === 'basic'}
              className="flex items-center space-x-2 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>

            {currentStep !== 'review' ? (
              <button
                type="button"
                onClick={goToNextStep}
                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>Save as Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  <span>Publish Event</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
