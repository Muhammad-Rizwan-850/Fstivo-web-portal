'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Calendar, DollarSign, Users, Filter, X, ChevronDown, Loader, TrendingUp } from 'lucide-react'
import type { EventDiscoveryItem, EventCategory } from '@/lib/types'
import { fetchPublicEvents, fetchEventCategories } from '@/lib/actions/events'
import { EventCategoryFilter } from '@/components/features/event-category-filter'
import { EVENT_CATEGORIES, getCategoryById, getFieldById } from '@/lib/event-categories'
import { logger } from '@/lib/logger';

// Mock events data for testing
const getMockEvents = () => [
  {
    id: '1',
    title: 'Tech Summit 2024',
    description: 'Annual technology conference featuring the latest innovations',
    short_description: 'Annual tech conference',
    event_type: 'conference',
    category_id: 'technology',
    field_id: 'data-ai',
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    event_mode: 'in-person',
    venue_name: 'Convention Center',
    venue_city: 'Lahore',
    capacity: 500,
    price: 5000,
    currency: 'PKR',
    cover_image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    banner_image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
    organizer_id: 'org_1',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Startup Pitch Night',
    description: 'Show your startup to investors and industry experts',
    short_description: 'Pitch your startup',
    event_type: 'workshop',
    category_id: 'business',
    field_id: 'entrepreneurship',
    start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    event_mode: 'hybrid',
    venue_name: 'Tech Hub',
    venue_city: 'Karachi',
    capacity: 200,
    price: 1000,
    currency: 'PKR',
    cover_image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
    banner_image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200',
    organizer_id: 'org_2',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'AI Workshop Series',
    description: 'Learn about artificial intelligence and machine learning',
    short_description: 'AI/ML workshop',
    event_type: 'workshop',
    category_id: 'technology',
    field_id: 'data-ai',
    start_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    event_mode: 'virtual',
    venue_name: null,
    venue_city: null,
    virtual_meeting_link: 'https://zoom.us/meeting/123',
    capacity: 100,
    price: 2500,
    currency: 'PKR',
    cover_image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
    banner_image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200',
    organizer_id: 'org_3',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Digital Health Conference',
    description: 'Healthcare technology and medical innovations',
    short_description: 'Health tech event',
    event_type: 'conference',
    category_id: 'healthcare',
    field_id: 'health-tech',
    start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
    event_mode: 'in-person',
    venue_name: 'Medical Center',
    venue_city: 'Islamabad',
    capacity: 500,
    price: 4000,
    currency: 'PKR',
    cover_image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
    banner_image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200',
    organizer_id: 'org_4',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Engineering Expo',
    description: 'Showcase of engineering projects and innovations',
    short_description: 'Engineering exhibition',
    event_type: 'exhibition',
    category_id: 'engineering',
    field_id: 'mechanical-engineering',
    start_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    event_mode: 'in-person',
    venue_name: 'Engineering University',
    venue_city: 'Lahore',
    capacity: 800,
    price: 1500,
    currency: 'PKR',
    cover_image_url: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800',
    banner_image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=1200',
    organizer_id: 'org_5',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export function EventDiscovery() {
  const [events, setEvents] = useState<EventDiscoveryItem[]>([])
  const [categories, setCategories] = useState<EventCategory[]>(EVENT_CATEGORIES)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedField, setSelectedField] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedMode, setSelectedMode] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const itemsPerPage = 6
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'popularity'>('date')

  useEffect(() => {
    fetchEvents()
    fetchCategories()
  }, [page, selectedCategory, selectedField, selectedCity, selectedMode, sortBy])

  const fetchEvents = async () => {
    try {
      setLoading(true)

      const { events: data, count } = await fetchPublicEvents({
        category: selectedCategory,
        field: selectedField,
        event_mode: selectedMode,
        search: searchQuery,
        page,
        limit: itemsPerPage,
        sortBy
      })
      setEvents(data)
      setTotalCount(count)
    } catch (err) {
      logger.error('Error fetching events:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await fetchEventCategories()
      if (data.length > 0) {
        setCategories(data)
      }
    } catch (err) {
      logger.error('Error fetching categories:', err)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchEvents()
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setSelectedField('')
    setSelectedCity('')
    setSelectedMode('')
    setPriceRange({ min: '', max: '' })
    setDateRange({ start: '', end: '' })
    setSearchQuery('')
    setPage(1)
  }

  const getMinPrice = (event: EventDiscoveryItem) => {
    if (!event.ticket_types || event.ticket_types.length === 0) return event.price || 0
    return Math.min(...event.ticket_types.map(t => t.price))
  }

  const getCapacityPercentage = (event: EventDiscoveryItem) => {
    if (!event._count?.registrations || !event.capacity) return 0
    return Math.round((event._count.registrations / event.capacity) * 100)
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-700 text-center">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Amazing Events</h1>
          <p className="text-xl text-indigo-100 mb-8">Find conferences, workshops, and networking events near you</p>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-lg p-2 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400 ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search events, topics, or organizers..."
              className="flex-1 px-2 py-3 text-gray-900 focus:outline-none"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {categories.slice(0, 5).map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)
                  setSelectedField('') // Reset field when category changes
                  setPage(1)
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-white text-indigo-600'
                    : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar with Category Filter */}
          <div className="w-80 flex-shrink-0">
            <EventCategoryFilter
              selectedCategory={selectedCategory}
              selectedField={selectedField}
              onCategoryChange={(categoryId) => {
                setSelectedCategory(categoryId)
                setSelectedField('') // Reset field when category changes
                setPage(1)
              }}
              onFieldChange={(fieldId) => {
                setSelectedField(fieldId)
                setPage(1)
              }}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filter Events</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Cities</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Islamabad">Islamabad</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Mode</label>
                <select
                  value={selectedMode}
                  onChange={(e) => {
                    setSelectedMode(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Modes</option>
                  <option value="in-person">In-Person</option>
                  <option value="virtual">Virtual</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(selectedCategory || selectedField || selectedCity || selectedMode) && (
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-sm text-gray-600">Active filters:</span>
            {selectedCategory && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2">
                {getCategoryById(selectedCategory)?.icon} {getCategoryById(selectedCategory)?.name}
                <button onClick={() => {
                  setSelectedCategory('')
                  setSelectedField('')
                }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedField && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2">
                {getFieldById(selectedField)?.name}
                <button onClick={() => setSelectedField('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCity && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2">
                {selectedCity}
                <button onClick={() => setSelectedCity('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedMode && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2">
                {selectedMode}
                <button onClick={() => setSelectedMode('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${totalCount} events found`}
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'price' | 'popularity')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="date">Sort by Date</option>
            <option value="price">Sort by Price</option>
            <option value="popularity">Sort by Popularity</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
          </div>
        )}

        {/* Event Grid */}
        {!loading && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {events.map(event => (
              <a
                key={event.id}
                href={`/events/${event.id}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group block"
              >
                {/* Event Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={event.banner_image || event.cover_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium">
                    {typeof event.category === 'object' ? `${event.category.icon} ${event.category.name}` : `📅 ${event.event_type}`}
                  </div>
                  {getMinPrice(event) === 0 && (
                    <div className="absolute top-3 left-3 px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
                      FREE
                    </div>
                  )}
                </div>

                {/* Event Info */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {event.short_description || event.description}
                  </p>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      {new Date(event.start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      <span className="text-gray-400">•</span>
                      {new Date(event.start_date).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      {event.event_mode === 'virtual' ? 'Virtual Event' : `${event.venue_name || event.location?.venue || 'TBD'}, ${event.venue_city || event.location?.city || 'TBD'}`}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-indigo-600" />
                      {event._count?.registrations || 0} registered
                      <span className="text-gray-400">•</span>
                      {event.capacity || 'N/A'} capacity
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  {event.capacity && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>{getCapacityPercentage(event)}% full</span>
                        {getCapacityPercentage(event) >= 80 && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <TrendingUp className="w-3 h-3" />
                            Filling fast
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            getCapacityPercentage(event) >= 80
                              ? 'bg-orange-500'
                              : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(getCapacityPercentage(event), 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Price and CTA */}
                  <div className="flex items-center justify-between">
                    <div>
                      {getMinPrice(event) > 0 ? (
                        <>
                          <p className="text-xs text-gray-600">Starting from</p>
                          <p className="text-xl font-bold text-gray-900">
                            ₨{getMinPrice(event).toLocaleString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-xl font-bold text-green-600">Free Event</p>
                      )}
                    </div>
                    <div className="px-5 py-2 bg-indigo-600 text-white rounded-lg">
                      View Details
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && events.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && events.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  page === i + 1
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  )
}
