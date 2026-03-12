'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Globe,
  MapPin,
  Calendar,
  Users,
  Building2,
  Mail,
  Phone,
  ExternalLink,
  Plus,
  Edit2,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Award,
  Handshake,
  FileText,
  Activity,
  ChevronDown,
  ChevronUp,
  Star,
  Target,
  Video,
  UserCheck,
  DollarSign,
  Briefcase,
  MessageSquare,
  Bookmark,
  Loader,
} from 'lucide-react'
import { format } from 'date-fns'
import { EVENT_CATEGORIES, getFieldsByCategory, getCategoryById, getFieldById } from '@/lib/event-categories'

// Types
interface InternationalConference {
  id: string
  name: string
  acronym: string
  description: string
  organizing_body: string
  website_url: string
  contact_email: string
  contact_person: string | null
  conference_type: 'academic' | 'professional' | 'exhibition' | 'summit'
  field_id: string
  category_id: string
  country: string
  city: string
  venue: string | null
  is_virtual: boolean
  virtual_platform: string | null
  typical_month: number | null
  frequency: string
  next_conf_date: string
  next_conf_deadline: string
  typical_attendees: number
  typical_countries: number
  is_global: boolean
  has_student_volunteers: boolean
  has_call_for_papers: boolean
  has_sponsorship: boolean
  has_exhibitions: boolean
  has_satellite_opportunities: boolean
  partnership_status: 'none' | 'contacted' | 'in_discussion' | 'partnered' | 'rejected' | 'satellite_confirmed'
  partnership_tier: string | null
  partnership_date: string | null
  partnership_notes: string | null
  fstivo_contact_id: string | null
  last_contact_date: string | null
  next_follow_up: string | null
  contact_count: number
  satellite_events_hosted: number
  total_satellite_attendees: number
  logo_url: string | null
  banner_image_url: string | null
  established_year: number
  social_media: any
  created_at: string
}

interface ActivityLog {
  id: string
  activity_type: string
  activity_date: string
  title: string
  description: string
  outcome: string
  requires_follow_up: boolean
  follow_up_date: string
  follow_up_task: string
}

// Mock data
const getMockConferences = (): InternationalConference[] => [
  {
    id: '1',
    name: 'American Society of Health-System Pharmacists',
    acronym: 'ASHP',
    description: 'Premier conference for pharmacy professionals, featuring cutting-edge research, networking, and educational sessions.',
    organizing_body: 'ASHP',
    website_url: 'https://www.ashp.org',
    contact_email: 'conferences@ashp.org',
    contact_person: 'Dr. Sarah Johnson',
    conference_type: 'professional',
    field_id: 'pharmacy',
    category_id: 'healthcare',
    country: 'United States',
    city: 'Various',
    venue: 'Convention Centers',
    is_virtual: false,
    virtual_platform: null,
    typical_month: 12,
    frequency: 'annual',
    next_conf_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    next_conf_deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    typical_attendees: 25000,
    typical_countries: 50,
    is_global: true,
    has_student_volunteers: true,
    has_call_for_papers: true,
    has_sponsorship: true,
    has_exhibitions: true,
    has_satellite_opportunities: true,
    partnership_status: 'contacted',
    partnership_tier: null,
    partnership_date: null,
    partnership_notes: 'Initial contact made. Interested in satellite model.',
    fstivo_contact_id: null,
    last_contact_date: new Date().toISOString().split('T')[0],
    next_follow_up: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    contact_count: 2,
    satellite_events_hosted: 0,
    total_satellite_attendees: 0,
    logo_url: null,
    banner_image_url: null,
    established_year: 1942,
    social_media: { twitter: '@ASHPOfficial', linkedin: 'ashp' },
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'AWS re:Invent',
    acronym: 're:Invent',
    description: "Amazon Web Services' premier cloud computing conference, featuring technical sessions, workshops, and certification opportunities.",
    organizing_body: 'Amazon Web Services',
    website_url: 'https://reinvent.awsevents.com',
    contact_email: 'reinvent@aws.amazon.com',
    contact_person: 'AWS Events Team',
    conference_type: 'professional',
    field_id: 'cloud-devops',
    category_id: 'technology',
    country: 'United States',
    city: 'Las Vegas',
    venue: 'The Venetian & MGM Grand',
    is_virtual: false,
    virtual_platform: 'AWS Online',
    typical_month: 12,
    frequency: 'annual',
    next_conf_date: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    next_conf_deadline: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    typical_attendees: 60000,
    typical_countries: 150,
    is_global: true,
    has_student_volunteers: true,
    has_call_for_papers: true,
    has_sponsorship: true,
    has_exhibitions: true,
    has_satellite_opportunities: true,
    partnership_status: 'none',
    partnership_tier: null,
    partnership_date: null,
    partnership_notes: null,
    fstivo_contact_id: null,
    last_contact_date: null,
    next_follow_up: null,
    contact_count: 0,
    satellite_events_hosted: 0,
    total_satellite_attendees: 0,
    logo_url: null,
    banner_image_url: null,
    established_year: 2012,
    social_media: { twitter: '@awsreinvent', linkedin: 'aws-reinvent' },
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'International Pharmaceutical Federation',
    acronym: 'FIP',
    description: 'Global pharmacy federation promoting pharmaceutical practice and sciences worldwide.',
    organizing_body: 'FIP',
    website_url: 'https://www.fip.org',
    contact_email: 'congress@fip.org',
    contact_person: 'Dr. Catherine Duggan',
    conference_type: 'professional',
    field_id: 'pharmacy',
    category_id: 'healthcare',
    country: 'Netherlands',
    city: 'Various',
    venue: 'International Venues',
    is_virtual: false,
    virtual_platform: 'FIP Virtual',
    typical_month: 9,
    frequency: 'annual',
    next_conf_date: new Date(Date.now() + 250 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    next_conf_deadline: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    typical_attendees: 3000,
    typical_countries: 120,
    is_global: true,
    has_student_volunteers: true,
    has_call_for_papers: true,
    has_sponsorship: true,
    has_exhibitions: true,
    has_satellite_opportunities: true,
    partnership_status: 'in_discussion',
    partnership_tier: null,
    partnership_date: null,
    partnership_notes: 'Discussions ongoing for 3 satellite events in South Asia.',
    fstivo_contact_id: null,
    last_contact_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    next_follow_up: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    contact_count: 5,
    satellite_events_hosted: 0,
    total_satellite_attendees: 0,
    logo_url: null,
    banner_image_url: null,
    established_year: 1912,
    social_media: { twitter: '@FIP_PHARMACEUTICAL', linkedin: 'internationalpharmaceuticalfederation' },
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'World Economic Forum',
    acronym: 'WEF',
    description: 'Annual meeting bringing together world leaders, business executives, and intellectuals to shape global agendas.',
    organizing_body: 'WEF',
    website_url: 'https://www.weforum.org',
    contact_email: 'contact@weforum.org',
    contact_person: 'WEF Events Team',
    conference_type: 'summit',
    field_id: 'management',
    category_id: 'business',
    country: 'Switzerland',
    city: 'Davos',
    venue: 'Davos Congress Centre',
    is_virtual: false,
    virtual_platform: 'Virtual Davos',
    typical_month: 1,
    frequency: 'annual',
    next_conf_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    next_conf_deadline: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    typical_attendees: 3000,
    typical_countries: 150,
    is_global: true,
    has_student_volunteers: false,
    has_call_for_papers: false,
    has_sponsorship: true,
    has_exhibitions: false,
    has_satellite_opportunities: true,
    partnership_status: 'none',
    partnership_tier: null,
    partnership_date: null,
    partnership_notes: null,
    fstivo_contact_id: null,
    last_contact_date: null,
    next_follow_up: null,
    contact_count: 0,
    satellite_events_hosted: 0,
    total_satellite_attendees: 0,
    logo_url: null,
    banner_image_url: null,
    established_year: 1971,
    social_media: { twitter: '@wef', linkedin: 'world-economic-forum' },
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Google I/O',
    acronym: 'I/O',
    description: "Google's annual developer conference featuring announcements, sessions, and hands-on learning.",
    organizing_body: 'Google',
    website_url: 'https://io.google',
    contact_email: 'io@google.com',
    contact_person: 'Google Developer Team',
    conference_type: 'professional',
    field_id: 'software-dev',
    category_id: 'technology',
    country: 'United States',
    city: 'Mountain View',
    venue: 'Shoreline Amphitheatre',
    is_virtual: true,
    virtual_platform: 'Google I/O Adventure',
    typical_month: 5,
    frequency: 'annual',
    next_conf_date: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    next_conf_deadline: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    typical_attendees: 10000,
    typical_countries: 100,
    is_global: true,
    has_student_volunteers: true,
    has_call_for_papers: true,
    has_sponsorship: true,
    has_exhibitions: true,
    has_satellite_opportunities: true,
    partnership_status: 'partnered',
    partnership_tier: 'silver',
    partnership_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    partnership_notes: 'Partnered for developer community satellite events. First event successful.',
    fstivo_contact_id: null,
    last_contact_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    next_follow_up: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    contact_count: 8,
    satellite_events_hosted: 3,
    total_satellite_attendees: 450,
    logo_url: null,
    banner_image_url: null,
    established_year: 2008,
    social_media: { twitter: '@googledevs', linkedin: 'google-for-developers' },
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Healthcare Information and Management Systems Society',
    acronym: 'HIMSS',
    description: 'Leading conference for health information and technology, featuring innovations and networking.',
    organizing_body: 'HIMSS',
    website_url: 'https://www.himss.org',
    contact_email: 'events@himss.org',
    contact_person: 'HIMSS Events Team',
    conference_type: 'professional',
    field_id: 'health-tech',
    category_id: 'healthcare',
    country: 'United States',
    city: 'Various',
    venue: 'Convention Centers',
    is_virtual: false,
    virtual_platform: 'HIMSS Digital',
    typical_month: 3,
    frequency: 'annual',
    next_conf_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    next_conf_deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    typical_attendees: 45000,
    typical_countries: 80,
    is_global: true,
    has_student_volunteers: true,
    has_call_for_papers: true,
    has_sponsorship: true,
    has_exhibitions: true,
    has_satellite_opportunities: true,
    partnership_status: 'satellite_confirmed',
    partnership_tier: 'gold',
    partnership_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    partnership_notes: 'Satellite event confirmed for March. 500 expected attendees.',
    fstivo_contact_id: null,
    last_contact_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    next_follow_up: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    contact_count: 12,
    satellite_events_hosted: 1,
    total_satellite_attendees: 320,
    logo_url: null,
    banner_image_url: null,
    established_year: 1961,
    social_media: { twitter: '@HIMSS', linkedin: 'himss' },
    created_at: new Date().toISOString(),
  },
]

const regions = [
  { name: 'All Regions', code: '' },
  { name: 'North America', countries: ['United States', 'Canada', 'Mexico'] },
  { name: 'Europe', countries: ['United Kingdom', 'Germany', 'France', 'Netherlands', 'Switzerland', 'Italy', 'Spain'] },
  { name: 'Asia Pacific', countries: ['China', 'Japan', 'India', 'Singapore', 'Australia', 'South Korea'] },
  { name: 'Middle East', countries: ['UAE', 'Saudi Arabia', 'Qatar', 'Israel'] },
  { name: 'South Asia', countries: ['Pakistan', 'India', 'Bangladesh', 'Sri Lanka', 'Nepal'] },
]

export function InternationalConferenceDirectory() {
  const [conferences, setConferences] = useState<InternationalConference[]>([])
  const [selectedConference, setSelectedConference] = useState<InternationalConference | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedField, setSelectedField] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showOnlySatelliteOpportunities, setShowOnlySatelliteOpportunities] = useState(false)

  // UI State
  const [activeTab, setActiveTab] = useState<'directory' | 'pipeline' | 'partnerships'>('directory')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadConferences()
  }, [])

  const loadConferences = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    setConferences(getMockConferences())
    setLoading(false)
  }

  // Filter conferences
  const filteredConferences = conferences.filter(conf => {
    const matchesSearch = searchTerm === '' ||
      conf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conf.acronym.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conf.organizing_body.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = !selectedCategory || conf.category_id === selectedCategory
    const matchesField = !selectedField || conf.field_id === selectedField
    const matchesCountry = !selectedCountry || conf.country === selectedCountry
    const matchesRegion = !selectedRegion ||
      regions.find(r => r.name === selectedRegion)?.countries?.includes(conf.country) === true
    const matchesStatus = !selectedStatus || conf.partnership_status === selectedStatus
    const matchesSatellite = !showOnlySatelliteOpportunities || conf.has_satellite_opportunities

    return matchesSearch && matchesCategory && matchesField && matchesCountry && matchesRegion && matchesStatus && matchesSatellite
  })

  // Get unique countries
  const countries = [...new Set(conferences.map(c => c.country))].sort()

  // Stats calculations
  const stats = {
    total: conferences.length,
    partnered: conferences.filter(c => c.partnership_status === 'partnered' || c.partnership_status === 'satellite_confirmed').length,
    inDiscussion: conferences.filter(c => c.partnership_status === 'in_discussion' || c.partnership_status === 'contacted').length,
    opportunities: conferences.filter(c => c.has_satellite_opportunities && !['partnered', 'satellite_confirmed', 'rejected'].includes(c.partnership_status)).length,
    totalSatellites: conferences.reduce((sum, c) => sum + c.satellite_events_hosted, 0),
    totalSatelliteAttendees: conferences.reduce((sum, c) => sum + c.total_satellite_attendees, 0),
  }

  const getPartnershipStatusBadge = (status: string) => {
    const badges = {
      none: { color: 'bg-gray-100 text-gray-700', icon: Clock, label: 'Not Contacted' },
      contacted: { color: 'bg-blue-100 text-blue-700', icon: Mail, label: 'Contacted' },
      in_discussion: { color: 'bg-yellow-100 text-yellow-700', icon: MessageSquare, label: 'In Discussion' },
      partnered: { color: 'bg-green-100 text-green-700', icon: Handshake, label: 'Partnered' },
      satellite_confirmed: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Satellite Confirmed' },
      rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Not Interested' },
    }
    const badge = badges[status as keyof typeof badges] || badges.none
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    )
  }

  const getPartnershipTierBadge = (tier: string | null) => {
    if (!tier) return null
    const tiers = {
      bronze: { color: 'bg-orange-100 text-orange-700', icon: '🥉' },
      silver: { color: 'bg-gray-100 text-gray-700', icon: '🥈' },
      gold: { color: 'bg-yellow-100 text-yellow-700', icon: '🥇' },
      platinum: { color: 'bg-purple-100 text-purple-700', icon: '💎' },
    }
    const tierInfo = tiers[tier as keyof typeof tiers]
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${tierInfo.color}`}>
        {tierInfo.icon} {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-gradient text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">International Conference Directory</h1>
              <p className="text-purple-100">Discover, track, and partner with global conferences</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors">
              <Plus className="w-5 h-5" />
              Add Conference
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="text-purple-100 text-sm">Total Conferences</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">{stats.partnered}</div>
              <div className="text-purple-100 text-sm">Active Partnerships</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">{stats.inDiscussion}</div>
              <div className="text-purple-100 text-sm">In Discussion</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">{stats.opportunities}</div>
              <div className="text-purple-100 text-sm">Opportunities</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">{stats.totalSatellites}</div>
              <div className="text-purple-100 text-sm">Satellites Hosted</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'directory'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-2" />
            Directory
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'pipeline'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Pipeline
          </button>
          <button
            onClick={() => setActiveTab('partnerships')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'partnerships'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Handshake className="w-4 h-4 inline mr-2" />
            Active Partnerships
          </button>
        </div>

        {/* Directory Tab */}
        {activeTab === 'directory' && (
          <>
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search conferences, organizations, or acronyms..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-5 h-5" />
                  Filters
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">All Categories</option>
                      {EVENT_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Field</label>
                    <select
                      value={selectedField}
                      onChange={(e) => setSelectedField(e.target.value)}
                      disabled={!selectedCategory}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">All Fields</option>
                      {selectedCategory && getFieldsByCategory(selectedCategory).map(field => (
                        <option key={field.id} value={field.id}>{field.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">All Regions</option>
                      {regions.map(r => (
                        <option key={r.name} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Partnership Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">All Statuses</option>
                      <option value="none">Not Contacted</option>
                      <option value="contacted">Contacted</option>
                      <option value="in_discussion">In Discussion</option>
                      <option value="partnered">Partnered</option>
                      <option value="satellite_confirmed">Satellite Confirmed</option>
                    </select>
                  </div>

                  <div className="md:col-span-4 flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showOnlySatelliteOpportunities}
                        onChange={(e) => setShowOnlySatelliteOpportunities(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Show only satellite opportunities</span>
                    </label>
                    <button
                      onClick={() => {
                        setSelectedCategory('')
                        setSelectedField('')
                        setSelectedCountry('')
                        setSelectedRegion('')
                        setSelectedStatus('')
                        setShowOnlySatelliteOpportunities(false)
                        setSearchTerm('')
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-700 ml-auto"
                    >
                      Clear all filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
                {filteredConferences.length} {filteredConferences.length === 1 ? 'conference' : 'conferences'} found
              </p>
            </div>

            {/* Conference Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredConferences.map(conf => (
                <div
                  key={conf.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedConference(conf)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {conf.is_virtual && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              <Video className="w-3 h-3" />
                              Virtual
                            </span>
                          )}
                          {conf.is_global && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              <Globe className="w-3 h-3" />
                              Global
                            </span>
                          )}
                          {conf.has_satellite_opportunities && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <Target className="w-3 h-3" />
                              Satellite Opportunity
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{conf.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{conf.acronym} • {conf.conference_type}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{conf.description}</p>
                      </div>
                      {conf.logo_url ? (
                        <img src={conf.logo_url} alt={conf.acronym} className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                          {conf.acronym?.substring(0, 2)}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        {conf.city}, {conf.country}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-indigo-600" />
                        {conf.typical_attendees?.toLocaleString()} attendees
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Globe className="w-4 h-4 text-indigo-600" />
                        {conf.typical_countries} countries
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        {conf.next_conf_date ? format(new Date(conf.next_conf_date), 'MMM yyyy') : 'TBD'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        {getPartnershipStatusBadge(conf.partnership_status)}
                        {getPartnershipTierBadge(conf.partnership_tier)}
                      </div>
                      <div className="flex items-center gap-2">
                        {conf.contact_count > 0 && (
                          <span className="text-xs text-gray-500">{conf.contact_count} contacts</span>
                        )}
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredConferences.length === 0 && (
              <div className="text-center py-20">
                <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No conferences found</h3>
                <p className="text-gray-600">Try adjusting your filters or search terms</p>
              </div>
            )}
          </>
        )}

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Partnership Pipeline</h2>
              <p className="text-gray-600">Track partnership opportunities through the funnel</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Pipeline stages */}
                {[
                  { status: 'contacted', label: 'Contacted', count: conferences.filter(c => c.partnership_status === 'contacted').length, color: 'bg-blue-50 border-blue-200' },
                  { status: 'in_discussion', label: 'In Discussion', count: conferences.filter(c => c.partnership_status === 'in_discussion').length, color: 'bg-yellow-50 border-yellow-200' },
                  { status: 'partnered', label: 'Partnered', count: conferences.filter(c => c.partnership_status === 'partnered').length, color: 'bg-green-50 border-green-200' },
                  { status: 'satellite_confirmed', label: 'Satellite Confirmed', count: conferences.filter(c => c.partnership_status === 'satellite_confirmed').length, color: 'bg-emerald-50 border-emerald-200' },
                ].map(stage => (
                  <div key={stage.status} className={`rounded-lg border-2 ${stage.color} p-4`}>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{stage.count}</div>
                    <div className="text-sm text-gray-600">{stage.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Details</h3>
                <div className="space-y-4">
                  {conferences
                    .filter(c => ['contacted', 'in_discussion', 'partnered', 'satellite_confirmed'].includes(c.partnership_status))
                    .sort((a, b) => {
                      const statusOrder = { 'contacted': 1, 'in_discussion': 2, 'partnered': 3, 'satellite_confirmed': 4 }
                      return statusOrder[a.partnership_status as keyof typeof statusOrder] - statusOrder[b.partnership_status as keyof typeof statusOrder]
                    })
                    .map(conf => (
                      <div key={conf.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-gray-900">{conf.name}</h4>
                            {getPartnershipStatusBadge(conf.partnership_status)}
                          </div>
                          <p className="text-sm text-gray-600">{conf.city}, {conf.country}</p>
                        </div>
                        <div className="text-right">
                          {conf.next_follow_up && (
                            <div className="text-sm text-gray-600">Follow-up: {format(new Date(conf.next_follow_up), 'MMM dd')}</div>
                          )}
                          {conf.contact_count > 0 && (
                            <div className="text-xs text-gray-500">{conf.contact_count} contacts</div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Partnerships Tab */}
        {activeTab === 'partnerships' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Active Partnerships</h2>
              <p className="text-gray-600">Manage and track confirmed partnerships</p>
            </div>

            <div className="divide-y divide-gray-200">
              {conferences
                .filter(c => ['partnered', 'satellite_confirmed'].includes(c.partnership_status))
                .map(conf => (
                  <div key={conf.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{conf.name}</h3>
                          {getPartnershipTierBadge(conf.partnership_tier)}
                          {getPartnershipStatusBadge(conf.partnership_status)}
                        </div>
                        <p className="text-sm text-gray-600">{conf.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">Partnered since</div>
                        <div className="font-semibold text-gray-900">
                          {conf.partnership_date ? format(new Date(conf.partnership_date), 'MMM yyyy') : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-indigo-600">{conf.satellite_events_hosted}</div>
                        <div className="text-sm text-gray-600">Satellites Hosted</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-green-600">{conf.total_satellite_attendees}</div>
                        <div className="text-sm text-gray-600">Total Attendees</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-purple-600">{conf.contact_count}</div>
                        <div className="text-sm text-gray-600">Interactions</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm font-semibold text-gray-900 mb-1">Next Conference</div>
                        <div className="text-sm text-gray-600">
                          {conf.next_conf_date ? format(new Date(conf.next_conf_date), 'MMM yyyy') : 'TBD'}
                        </div>
                      </div>
                    </div>

                    {conf.partnership_notes && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <div className="text-sm text-gray-700">{conf.partnership_notes}</div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button className="text-sm text-indigo-600 hover:text-indigo-700">View Details</button>
                        <span className="text-gray-400">•</span>
                        <button className="text-sm text-indigo-600 hover:text-indigo-700">Manage Partnership</button>
                        <span className="text-gray-400">•</span>
                        <button className="text-sm text-indigo-600 hover:text-indigo-700">Activity Log</button>
                      </div>
                      <a
                        href={conf.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                      >
                        Visit Website <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
            </div>

            {conferences.filter(c => ['partnered', 'satellite_confirmed'].includes(c.partnership_status)).length === 0 && (
              <div className="p-12 text-center">
                <Handshake className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No active partnerships yet</h3>
                <p className="text-gray-600">Start reaching out to conferences from the directory</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conference Detail Modal */}
      {selectedConference && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedConference(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{selectedConference.name}</h2>
              <button onClick={() => setSelectedConference(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Acronym</label>
                  <p className="text-gray-900">{selectedConference.acronym}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Organizing Body</label>
                  <p className="text-gray-900">{selectedConference.organizing_body}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <p className="text-gray-900 capitalize">{selectedConference.conference_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Frequency</label>
                  <p className="text-gray-900 capitalize">{selectedConference.frequency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Country</label>
                  <p className="text-gray-900">{selectedConference.country}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">City</label>
                  <p className="text-gray-900">{selectedConference.city}</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900 mt-1">{selectedConference.description}</p>
              </div>

              {/* Conference Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <Users className="w-5 h-5 text-indigo-600 mb-2" />
                  <div className="text-xl font-bold text-gray-900">{selectedConference.typical_attendees?.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Typical Attendees</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <Globe className="w-5 h-5 text-indigo-600 mb-2" />
                  <div className="text-xl font-bold text-gray-900">{selectedConference.typical_countries}</div>
                  <div className="text-sm text-gray-600">Countries</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <Calendar className="w-5 h-5 text-indigo-600 mb-2" />
                  <div className="text-xl font-bold text-gray-900">
                    {selectedConference.next_conf_date ? format(new Date(selectedConference.next_conf_date), 'MMM yyyy') : 'TBD'}
                  </div>
                  <div className="text-sm text-gray-600">Next Conference</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <Building2 className="w-5 h-5 text-indigo-600 mb-2" />
                  <div className="text-xl font-bold text-gray-900">{selectedConference.established_year}</div>
                  <div className="text-sm text-gray-600">Established</div>
                </div>
              </div>

              {/* Opportunities */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-3 block">Opportunities Available</label>
                <div className="flex flex-wrap gap-2">
                  {selectedConference.has_student_volunteers && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      <UserCheck className="w-4 h-4" />
                      Student Volunteers
                    </span>
                  )}
                  {selectedConference.has_call_for_papers && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      <FileText className="w-4 h-4" />
                      Call for Papers
                    </span>
                  )}
                  {selectedConference.has_sponsorship && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      <DollarSign className="w-4 h-4" />
                      Sponsorship
                    </span>
                  )}
                  {selectedConference.has_exhibitions && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      <Award className="w-4 h-4" />
                      Exhibitions
                    </span>
                  )}
                  {selectedConference.has_satellite_opportunities && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                      <Target className="w-4 h-4" />
                      Satellite Events
                    </span>
                  )}
                </div>
              </div>

              {/* Partnership Status */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Partnership Status</label>
                  <div className="flex items-center gap-2">
                    {getPartnershipStatusBadge(selectedConference.partnership_status)}
                    {getPartnershipTierBadge(selectedConference.partnership_tier)}
                  </div>
                </div>
                {selectedConference.partnership_notes && (
                  <div className="text-sm text-gray-700 mb-3">{selectedConference.partnership_notes}</div>
                )}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Contacts:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedConference.contact_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Contact:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedConference.last_contact_date ? format(new Date(selectedConference.last_contact_date), 'MMM dd') : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Next Follow-up:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedConference.next_follow_up ? format(new Date(selectedConference.next_follow_up), 'MMM dd') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Satellite Events */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-3 block">Satellite Events Hosted</label>
                {selectedConference.satellite_events_hosted > 0 ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-emerald-700">{selectedConference.satellite_events_hosted}</div>
                        <div className="text-sm text-emerald-600">Events hosted</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-700">{selectedConference.total_satellite_attendees}</div>
                        <div className="text-sm text-emerald-600">Total attendees</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">No satellite events hosted yet</div>
                )}
              </div>

              {/* Contact Info */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-3 block">Contact Information</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${selectedConference.contact_email}`} className="text-indigo-600 hover:underline">
                      {selectedConference.contact_email}
                    </a>
                  </div>
                  {selectedConference.contact_person && (
                    <div className="flex items-center gap-3 text-sm">
                      <UserCheck className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{selectedConference.contact_person}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                    <a
                      href={selectedConference.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <Mail className="w-4 h-4" />
                  Send Email
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Activity className="w-4 h-4" />
                  Log Activity
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Edit2 className="w-4 h-4" />
                  Update Status
                </button>
                {selectedConference.has_satellite_opportunities && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Plus className="w-4 h-4" />
                    Propose Satellite
                  </button>
                )}
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Bookmark className="w-4 h-4" />
                  Save for Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
