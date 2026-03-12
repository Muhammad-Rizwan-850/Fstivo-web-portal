'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import {
  Calendar, Users, MapPin, Star, TrendingUp, Award,
  Heart, Camera, Play, Quote, ChevronRight,
  Filter, Search, X, ZoomIn, Loader2
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  year: number;
  location: string;
  category: string;
  attendees_count: number;
  rating: number;
  featured_image: string;
  video_url?: string;
  highlights: string[];
  gallery: Array<{
    id: string;
    image_url: string;
    caption?: string;
  }>;
  testimonials: Array<{
    id: string;
    name: string;
    role: string;
    text: string;
    rating: number;
  }>;
}

interface Stats {
  total_events: number;
  total_attendees: number;
  average_rating: number;
  total_testimonials: number;
}

export default function PastEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_events: 0,
    total_attendees: 0,
    average_rating: 0,
    total_testimonials: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const years = ['all', '2024', '2023', '2022'];
  const categories = ['all', 'Technology', 'Arts & Culture', 'Sports', 'Business'];

  useEffect(() => {
    fetchEvents();
  }, [selectedYear, selectedCategory, searchQuery]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear !== 'all') params.append('year', selectedYear);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/showcase/past-events?${params}`);
      const data = await response.json();

      if (response.ok) {
        setEvents(data.events || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      logger.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (image: string) => {
    setSelectedImage(image);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedImage(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="bg-brand-gradient text-white py-20 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Our Event Journey</h1>
          <p className="text-xl opacity-90 mb-8">
            Celebrating memories, moments, and milestones
          </p>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold mb-2">{stats.total_events}+</div>
              <div className="text-sm opacity-90">Events Hosted</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold mb-2">{stats.total_attendees.toLocaleString()}+</div>
              <div className="text-sm opacity-90">Happy Attendees</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold mb-2">{(stats.total_attendees * 3).toLocaleString()}+</div>
              <div className="text-sm opacity-90">Smiles Created</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold mb-2">{stats.average_rating}/5</div>
              <div className="text-sm opacity-90">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Year Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year === 'all' ? 'All Years' : year}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          {/* Active Filters */}
          {(selectedYear !== 'all' || selectedCategory !== 'all' || searchQuery) && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedYear !== 'all' && (
                <button
                  onClick={() => setSelectedYear('all')}
                  className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200"
                >
                  {selectedYear} <X className="w-4 h-4" />
                </button>
              )}
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                >
                  {selectedCategory} <X className="w-4 h-4" />
                </button>
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                >
                  Search: {searchQuery} <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        )}

        {/* Results Count */}
        {!loading && (
          <div className="mb-6">
            <p className="text-gray-600">
              Showing <span className="font-semibold text-gray-900">{events.length}</span> events
            </p>
          </div>
        )}

        {/* Events Grid */}
        {!loading && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group">
                {/* Event Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={event.featured_image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{event.rating}</span>
                  </div>
                  {event.video_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>

                {/* Event Info */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                      {event.category}
                    </span>
                    <span className="text-gray-500 text-sm">{formatDate(event.date)}</span>
                  </div>

                  <h3 className="text-xl font-bold mb-3 group-hover:text-purple-600 transition-colors">
                    {event.title}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{event.attendees_count} Attendees</span>
                    </div>
                  </div>

                  {/* Highlights */}
                  {event.highlights && event.highlights.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-500 mb-2">HIGHLIGHTS</div>
                      <div className="flex flex-wrap gap-2">
                        {event.highlights.map((highlight, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gallery Preview */}
                  {event.gallery && event.gallery.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-gray-500">PHOTO GALLERY</div>
                        <Camera className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {event.gallery.slice(0, 3).map((photo, idx) => (
                          <div
                            key={photo.id}
                            onClick={() => openLightbox(photo.image_url)}
                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group/img"
                          >
                            <img
                              src={photo.image_url}
                              alt={photo.caption || `Gallery ${idx + 1}`}
                              className="w-full h-full object-cover group-hover/img:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Testimonial */}
                  {event.testimonials && event.testimonials.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <Quote className="w-5 h-5 text-purple-400 mb-2" />
                      <p className="text-sm text-gray-700 italic mb-2">
                        {event.testimonials[0].text}
                      </p>
                      <div className="text-xs text-gray-500">
                        <div className="font-semibold">{event.testimonials[0].name}</div>
                        <div>{event.testimonials[0].role}</div>
                      </div>
                    </div>
                  )}

                  {/* View More Button */}
                  <button className="w-full bg-brand-gradient text-white py-2 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 group/btn">
                    <span>View Full Story</span>
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && events.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No events found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters</p>
            <button
              onClick={() => {
                setSelectedYear('all');
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Success Stories Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 py-16 px-8 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Award className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Impact Stories</h2>
            <p className="text-gray-600">Real stories from our community</p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <TrendingUp className="w-8 h-8 text-green-600 mb-4" />
              <div className="text-3xl font-bold text-green-600 mb-2">150+</div>
              <div className="text-gray-700 font-semibold mb-2">Job Placements</div>
              <p className="text-sm text-gray-600">Students secured jobs through our networking events</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <Heart className="w-8 h-8 text-pink-600 mb-4" />
              <div className="text-3xl font-bold text-pink-600 mb-2">50+</div>
              <div className="text-gray-700 font-semibold mb-2">Startups Funded</div>
              <p className="text-sm text-gray-600">Total funding raised: Rs 25M+</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <Users className="w-8 h-8 text-blue-600 mb-4" />
              <div className="text-3xl font-bold text-blue-600 mb-2">5K+</div>
              <div className="text-gray-700 font-semibold mb-2">Connections Made</div>
              <p className="text-sm text-gray-600">Professional relationships formed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedImage}
            alt="Gallery"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
