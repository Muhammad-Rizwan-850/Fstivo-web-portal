'use client'

import React, { useState } from 'react'
import { Building2, Users, Briefcase, Calendar, DollarSign, TrendingUp, CheckCircle, Clock, XCircle, Eye, Plus, Edit2, Trash2, BarChart3, FileText, Settings, LogOut, Bell, Search, Filter, Star, MapPin } from 'lucide-react'

interface JobPosting {
  id: string
  title: string
  applicants_count: number
  views_count: number
  status: 'active' | 'closed' | 'filled'
  posted_date: string
  application_deadline: string
}

interface Application {
  id: string
  job_title: string
  applicant_name: string
  applied_date: string
  status: 'applied' | 'under_review' | 'shortlisted' | 'interviewed' | 'offered' | 'hired' | 'rejected'
  rating?: number
  skills: string[]
  experience: string
}

interface BoothBooking {
  id: string
  event_name: string
  event_date: string
  booth_size: string
  cost: number
  status: 'pending' | 'confirmed' | 'completed'
  location: string
}

const CorporateDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'applications' | 'booths'>('overview')

  const [jobs] = useState<JobPosting[]>([
    {
      id: '1',
      title: 'Software Engineer - Full Stack',
      applicants_count: 45,
      views_count: 523,
      status: 'active',
      posted_date: '2024-12-15',
      application_deadline: '2025-01-31'
    },
    {
      id: '2',
      title: 'Product Manager',
      applicants_count: 67,
      views_count: 892,
      status: 'active',
      posted_date: '2024-12-01',
      application_deadline: '2025-02-15'
    },
    {
      id: '3',
      title: 'Data Analyst Intern',
      applicants_count: 128,
      views_count: 1234,
      status: 'filled',
      posted_date: '2024-11-15',
      application_deadline: '2024-12-31'
    }
  ])

  const [applications, setApplications] = useState<Application[]>([
    {
      id: '1',
      job_title: 'Software Engineer - Full Stack',
      applicant_name: 'Ahmed Hassan',
      applied_date: '2024-12-18',
      status: 'shortlisted',
      rating: 4,
      skills: ['React', 'TypeScript', 'Node.js', 'Python'],
      experience: '3 years'
    },
    {
      id: '2',
      job_title: 'Software Engineer - Full Stack',
      applicant_name: 'Fatima Ali',
      applied_date: '2024-12-17',
      status: 'interviewed',
      rating: 5,
      skills: ['React', 'TypeScript', 'AWS', 'Docker'],
      experience: '4 years'
    },
    {
      id: '3',
      job_title: 'Product Manager',
      applicant_name: 'Usman Khan',
      applied_date: '2024-12-16',
      status: 'under_review',
      skills: ['Product Strategy', 'Data Analysis', 'Agile'],
      experience: '5 years'
    },
    {
      id: '4',
      job_title: 'Product Manager',
      applicant_name: 'Aisha Malik',
      applied_date: '2024-12-15',
      status: 'shortlisted',
      rating: 4,
      skills: ['Product Strategy', 'SQL', 'UX Design'],
      experience: '2 years'
    }
  ])

  const [boothBookings] = useState<BoothBooking[]>([
    {
      id: '1',
      event_name: 'LUMS Tech Career Fair 2025',
      event_date: '2025-01-25',
      booth_size: 'premium',
      cost: 100000,
      status: 'confirmed',
      location: 'LUMS Campus, Lahore'
    },
    {
      id: '2',
      event_name: 'NUST Engineering Expo',
      event_date: '2025-02-15',
      booth_size: 'large',
      cost: 75000,
      status: 'pending',
      location: 'NUST Campus, Islamabad'
    }
  ])

  const companyInfo = {
    name: 'Systems Limited',
    logo: '🏢',
    industry: 'Technology',
    tier: 'gold',
    partnership_start: '2024-06-01',
    total_spent: 450000,
    active_jobs: 2,
    total_applications: 240,
    total_hires: 15
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" />, label: 'Active' },
      closed: { color: 'bg-gray-100 text-gray-700', icon: <XCircle className="w-4 h-4" />, label: 'Closed' },
      filled: { color: 'bg-blue-100 text-blue-700', icon: <CheckCircle className="w-4 h-4" />, label: 'Filled' },
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-4 h-4" />, label: 'Pending' },
      confirmed: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" />, label: 'Confirmed' },
      completed: { color: 'bg-indigo-100 text-indigo-700', icon: <CheckCircle className="w-4 h-4" />, label: 'Completed' },
      applied: { color: 'bg-gray-100 text-gray-700', icon: <Clock className="w-4 h-4" />, label: 'Applied' },
      under_review: { color: 'bg-blue-100 text-blue-700', icon: <Eye className="w-4 h-4" />, label: 'Under Review' },
      shortlisted: { color: 'bg-purple-100 text-purple-700', icon: <Star className="w-4 h-4" />, label: 'Shortlisted' },
      interviewed: { color: 'bg-cyan-100 text-cyan-700', icon: <CheckCircle className="w-4 h-4" />, label: 'Interviewed' },
      offered: { color: 'bg-green-100 text-green-700', icon: <DollarSign className="w-4 h-4" />, label: 'Offered' },
      hired: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" />, label: 'Hired' },
      rejected: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4" />, label: 'Rejected' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.applied
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  const updateApplicationStatus = (applicationId: string, newStatus: Application['status']) => {
    setApplications(apps =>
      apps.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      )
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-2xl">
                {companyInfo.logo}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{companyInfo.name}</h1>
                <p className="text-sm text-gray-600">{companyInfo.industry} • Gold Partner</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'jobs'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Job Postings
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'applications'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Applications
              {applications.filter(a => !['hired', 'rejected'].includes(a.status)).length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                  {applications.filter(a => !['hired', 'rejected'].includes(a.status)).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('booths')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'booths'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Booth Bookings
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <Briefcase className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="text-green-600 text-sm font-medium">+2</span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Active Jobs</h3>
                <p className="text-3xl font-bold text-gray-900">{companyInfo.active_jobs}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-green-600 text-sm font-medium">+45</span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Total Applications</h3>
                <p className="text-3xl font-bold text-gray-900">{companyInfo.total_applications}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Hires Made</h3>
                <p className="text-3xl font-bold text-gray-900">{companyInfo.total_hires}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Total Spent</h3>
                <p className="text-3xl font-bold text-gray-900">Rs{(companyInfo.total_spent / 1000).toFixed(0)}k</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <button className="bg-indigo-600 text-white rounded-xl p-6 hover:bg-indigo-700 transition-colors text-left">
                <Plus className="w-8 h-8 mb-3" />
                <h3 className="font-bold text-lg mb-2">Post New Job</h3>
                <p className="text-sm text-indigo-200">Create a new job posting and reach thousands of talented students</p>
              </button>

              <button className="bg-white border border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-colors text-left">
                <Calendar className="w-8 h-8 mb-3 text-gray-600" />
                <h3 className="font-bold text-lg mb-2 text-gray-900">Book Event Booth</h3>
                <p className="text-sm text-gray-600">Reserve booth space at upcoming career fairs and events</p>
              </button>

              <button className="bg-white border border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-colors text-left">
                <BarChart3 className="w-8 h-8 mb-3 text-gray-600" />
                <h3 className="font-bold text-lg mb-2 text-gray-900">View Reports</h3>
                <p className="text-sm text-gray-600">Analyze your recruitment performance and ROI</p>
              </button>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Applications</h2>
              <div className="space-y-4">
                {applications.slice(0, 5).map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{application.applicant_name}</h3>
                        <p className="text-sm text-gray-600">{application.job_title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(application.status)}
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Eye className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Job Postings</h2>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Post New Job
              </button>
            </div>

            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h3>
                          <p className="text-sm text-gray-600">
                            Posted on {new Date(job.posted_date).toLocaleDateString()} •
                            Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(job.status)}
                      </div>

                      <div className="grid grid-cols-3 gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{job.applicants_count} Applicants</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{job.views_count} Views</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span className="text-green-600 font-medium">
                            {job.views_count > 0 ? ((job.applicants_count / job.views_count) * 100).toFixed(1) : 0}% Conversion
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Eye className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Edit2 className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Trash2 className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Applications</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search applicants..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Users className="w-7 h-7 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{application.applicant_name}</h3>
                              <p className="text-sm text-gray-600">{application.job_title}</p>
                            </div>
                            {getStatusBadge(application.status)}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-gray-500">Applied:</span>
                              <span className="ml-2 text-gray-900">{new Date(application.applied_date).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Experience:</span>
                              <span className="ml-2 text-gray-900">{application.experience}</span>
                            </div>
                            {application.rating && (
                              <div>
                                <span className="text-gray-500">Rating:</span>
                                <span className="ml-2 text-yellow-500">
                                  {'★'.repeat(application.rating)}
                                  {'☆'.repeat(5 - application.rating)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {application.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                          View Profile
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                          Download Resume
                        </button>
                      </div>
                    </div>

                    {/* Status Actions */}
                    <div className="ml-4 flex flex-col gap-2">
                      <select
                        value={application.status}
                        onChange={(e) => updateApplicationStatus(application.id, e.target.value as Application['status'])}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="applied">Applied</option>
                        <option value="under_review">Under Review</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interviewed">Interviewed</option>
                        <option value="offered">Offered</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Schedule Interview
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'booths' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Booth Bookings</h2>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Book New Booth
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {boothBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{booking.event_name}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(booking.event_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {booking.location}
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Booth Size</p>
                      <p className="font-semibold text-gray-900 capitalize">{booking.booth_size}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Cost</p>
                      <p className="font-semibold text-gray-900">Rs{booking.cost.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                      View Details
                    </button>
                    {booking.status === 'pending' && (
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CorporateDashboard
