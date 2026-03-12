'use client'

import React, { useState } from 'react'
import { Plus, Clock, Calendar, MapPin, Award, Save, X, Search, Filter, CheckCircle, AlertCircle, Edit2, Trash2, TrendingUp, Eye, FileText, Zap, Camera, Users, Settings, Mic, Star } from 'lucide-react'

interface Activity {
  id: string
  event_name: string
  event_date: string
  activity_type: string
  hours: number
  description: string
  points_earned: number
  amount_earned: number
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  supervisor_notes?: string
  rating?: number
  created_at: string
}

interface Event {
  id: string
  name: string
  date: string
  location: string
  organizer: string
}

const VolunteerActivityLogger: React.FC = () => {
  const [showForm, setShowForm] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      event_name: 'LUMS Tech Career Fair',
      event_date: '2024-12-15',
      activity_type: 'coordination',
      hours: 8,
      description: 'Led team of 5 volunteers, managed registration desk, coordinated with vendors',
      points_earned: 300,
      amount_earned: 1500,
      status: 'approved',
      supervisor_notes: 'Excellent leadership and coordination',
      rating: 5,
      created_at: '2024-12-15T10:30:00'
    },
    {
      id: '2',
      event_name: 'NUST Engineering Expo',
      event_date: '2024-12-10',
      activity_type: 'tech_support',
      hours: 5,
      description: 'Set up AV equipment, managed live streaming, technical assistance to speakers',
      points_earned: 200,
      amount_earned: 1000,
      status: 'approved',
      supervisor_notes: 'Great technical support throughout the event',
      rating: 4,
      created_at: '2024-12-10T14:20:00'
    },
    {
      id: '3',
      event_name: 'Pharmacy Symposium',
      event_date: '2024-12-20',
      activity_type: 'registration_desk',
      hours: 4,
      description: 'Managed registration desk, checked in attendees, distributed badges',
      points_earned: 150,
      amount_earned: 750,
      status: 'pending',
      created_at: '2024-12-20T09:00:00'
    }
  ])

  const [availableEvents] = useState<Event[]>([
    { id: '1', name: 'LUMS Tech Career Fair 2025', date: '2025-01-25', location: 'LUMS Campus, Lahore', organizer: 'Fstivo Team' },
    { id: '2', name: 'NUST Engineering Expo', date: '2025-02-15', location: 'NUST Campus, Islamabad', organizer: 'NUST Career Office' },
    { id: '3', name: 'Pharmacy Symposium', date: '2025-01-20', location: 'Aga Khan University, Karachi', organizer: 'Getz Pharma' },
    { id: '4', name: 'Business Leadership Summit', date: '2025-02-01', location: 'IBA Karachi', organizer: 'Unilever Pakistan' },
    { id: '5', name: 'Design Workshop', date: '2025-01-30', location: 'NCA Lahore', organizer: 'Fstivo Team' }
  ])

  const [formData, setFormData] = useState({
    event_id: '',
    event_name: '',
    event_date: '',
    activity_type: '',
    hours: '',
    description: ''
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const activityTypes = [
    { id: 'event_setup', name: 'Event Setup', basePoints: 100, icon: <Zap className="w-5 h-5" />, description: 'Setting up venues, decorations, equipment' },
    { id: 'registration_desk', name: 'Registration Desk', basePoints: 150, icon: <Calendar className="w-5 h-5" />, description: 'Managing check-in, badges, attendee inquiries' },
    { id: 'usher', name: 'Usher/Guide', basePoints: 120, icon: <Users className="w-5 h-5" />, description: 'Guiding attendees, seating management' },
    { id: 'social_media', name: 'Social Media', basePoints: 180, icon: <Camera className="w-5 h-5" />, description: 'Live coverage, posts, stories, engagement' },
    { id: 'photography', name: 'Photography/Videography', basePoints: 250, icon: <Camera className="w-5 h-5" />, description: 'Event photography, video recording' },
    { id: 'tech_support', name: 'Technical Support', basePoints: 200, icon: <Settings className="w-5 h-5" />, description: 'AV equipment, live streaming, IT support' },
    { id: 'coordination', name: 'Event Coordination', basePoints: 300, icon: <Award className="w-5 h-5" />, description: 'Overall coordination, team management' },
    { id: 'speaker_management', name: 'Speaker Management', basePoints: 200, icon: <Mic className="w-5 h-5" />, description: 'Speaker hospitality, scheduling, support' },
    { id: 'sponsor_relations', name: 'Sponsor Relations', basePoints: 350, icon: <Star className="w-5 h-5" />, description: 'Liaising with sponsors, booth management' },
    { id: 'team_lead', name: 'Team Lead', basePoints: 400, icon: '👑', description: 'Leading volunteer teams, training' }
  ]

  const calculatePoints = (activityType: string, hours: number) => {
    const type = activityTypes.find(t => t.id === activityType)
    if (!type) return 0
    return Math.round((type.basePoints / type.basePoints) * hours * 25) // Simplified calculation
  }

  const calculateEarnings = (points: number) => {
    return points * 5 // Rs 5 per point
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const activityType = activityTypes.find(t => t.id === formData.activity_type)
    if (!activityType) return

    const hours = parseFloat(formData.hours)
    const points = Math.round(activityType.basePoints * (hours / 4)) // Simplified: basePoints assumes 4 hours
    const earnings = calculateEarnings(points)

    const newActivity: Activity = {
      id: Date.now().toString(),
      event_name: formData.event_name,
      event_date: formData.event_date,
      activity_type: formData.activity_type,
      hours: hours,
      description: formData.description,
      points_earned: points,
      amount_earned: earnings,
      status: 'pending',
      created_at: new Date().toISOString()
    }

    setActivities([newActivity, ...activities])
    setShowForm(false)
    setFormData({
      event_id: '',
      event_name: '',
      event_date: '',
      activity_type: '',
      hours: '',
      description: ''
    })
  }

  const handleDelete = (activityId: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      setActivities(activities.filter(a => a.id !== activityId))
    }
  }

  const getActivityIcon = (activityType: string) => {
    const type = activityTypes.find(t => t.id === activityType)
    return type?.icon || <Star className="w-5 h-5" />
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-4 h-4" />, label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" />, label: 'Approved' },
      paid: { color: 'bg-blue-100 text-blue-700', icon: <Award className="w-4 h-4" />, label: 'Paid' },
      rejected: { color: 'bg-red-100 text-red-700', icon: <AlertCircle className="w-4 h-4" />, label: 'Rejected' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalStats = {
    totalActivities: activities.length,
    totalHours: activities.reduce((sum, a) => sum + a.hours, 0),
    totalPoints: activities.reduce((sum, a) => sum + a.points_earned, 0),
    totalEarnings: activities.reduce((sum, a) => sum + a.amount_earned, 0),
    pendingActivities: activities.filter(a => a.status === 'pending').length
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Volunteer Activity Logger</h1>
            <p className="text-gray-600">Log your volunteer hours and track your progress</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 shadow-sm"
          >
            {showForm ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Log New Activity
              </>
            )}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalStats.totalActivities}</p>
                <p className="text-xs text-gray-500">Total Activities</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalStats.totalHours}</p>
                <p className="text-xs text-gray-500">Total Hours</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-2 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalStats.totalPoints}</p>
                <p className="text-xs text-gray-500">Total Points</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-50 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">Rs{totalStats.totalEarnings.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Earnings</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-orange-50 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalStats.pendingActivities}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Log New Activity
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Event *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      event_id: event.id,
                      event_name: event.name,
                      event_date: event.date
                    })}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      formData.event_id === event.id
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{event.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {new Date(event.date).toLocaleDateString()}
                      <MapPin className="w-4 h-4 inline ml-2 mr-1" />
                      {event.location}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activityTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, activity_type: type.id })}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      formData.activity_type === type.id
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-indigo-600">
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{type.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                        <div className="text-xs text-indigo-600 font-medium mt-2">
                          {type.basePoints} base points
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hours & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hours Worked *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  required
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., 4"
                />
                <p className="text-sm text-gray-500 mt-1">Enter the number of hours you volunteered</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Describe what you did, your responsibilities, and any achievements..."
              />
              <p className="text-sm text-gray-500 mt-1">Be specific to help supervisors understand your contribution</p>
            </div>

            {/* Points Preview */}
            {formData.activity_type && formData.hours && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-indigo-900 font-medium">Estimated Points & Earnings</p>
                    <p className="text-xs text-indigo-700 mt-1">Based on your selected activity and hours</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-900">
                      {Math.round((activityTypes.find(t => t.id === formData.activity_type)?.basePoints || 0) * (parseFloat(formData.hours) / 4))} points
                    </p>
                    <p className="text-sm text-green-700 font-medium">
                      ≈ Rs{calculateEarnings(Math.round((activityTypes.find(t => t.id === formData.activity_type)?.basePoints || 0) * (parseFloat(formData.hours) / 4)))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!formData.event_id || !formData.activity_type || !formData.hours || !formData.description}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Submit Activity
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Activities List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Activity History</h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activities */}
        <div className="divide-y divide-gray-200">
          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start logging your volunteer activities'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Log Your First Activity
                </button>
              )}
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Activity Icon */}
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      {getActivityIcon(activity.activity_type)}
                    </div>

                    {/* Activity Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{activity.event_name}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(activity.event_date).toLocaleDateString()}
                            </span>
                            <span className="capitalize flex items-center gap-1">
                              {getActivityIcon(activity.activity_type)}
                              {activity.activity_type.replace('_', ' ')}
                            </span>
                          </p>
                        </div>
                        {getStatusBadge(activity.status)}
                      </div>

                      <p className="text-gray-700 mb-3">{activity.description}</p>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{activity.hours} hours</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-gray-400" />
                          <span className="text-indigo-600 font-semibold">+{activity.points_earned} points</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span className="text-green-600 font-semibold">Rs{activity.amount_earned.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Supervisor Notes */}
                      {activity.supervisor_notes && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-900">Supervisor Feedback</span>
                            {activity.rating && (
                              <span className="text-yellow-500 text-sm">
                                {'★'.repeat(activity.rating)}
                                {'☆'.repeat(5 - activity.rating)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-green-800">{activity.supervisor_notes}</p>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="mt-3 text-xs text-gray-500">
                        Logged on {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>

                    {/* Actions */}
                    {activity.status === 'pending' && (
                      <div className="ml-4 flex gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg" title="Edit">
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(activity.id)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Eye className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 mb-2">Tips for Getting Approved</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Be specific in your description - mention your responsibilities and achievements</li>
              <li>• Log activities within 24 hours for better accuracy</li>
              <li>• Include any challenges you overcame or creative solutions you provided</li>
              <li>• Higher impact activities (coordination, tech support) earn more points</li>
              <li>• Ask your supervisor to review your submission before submitting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VolunteerActivityLogger
