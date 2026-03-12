'use client'

import React, { useState } from 'react'
import { Briefcase, MapPin, DollarSign, Clock, Building, Users, Filter, Search, Bookmark, ExternalLink, ChevronRight, TrendingUp, Award, Calendar, CheckCircle, X } from 'lucide-react'

interface JobPosting {
  id: string
  title: string
  company: {
    name: string
    logo: string
    industry: string
    slug: string
  }
  description: string
  location: string
  location_type: 'on-site' | 'remote' | 'hybrid'
  job_type: 'full-time' | 'part-time' | 'internship' | 'contract' | 'freelance'
  experience_level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
  salary_min?: number
  salary_max?: number
  salary_currency: string
  requirements: string[]
  benefits: string[]
  required_skills: string[]
  preferred_skills: string[]
  application_deadline: string
  applicants_count: number
  views_count: number
  posted_date: string
  is_featured: boolean
  status: 'active' | 'closed' | 'filled'
}

const JobBoard: React.FC = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([
    {
      id: '1',
      title: 'Software Engineer - Full Stack',
      company: {
        name: 'Systems Limited',
        logo: '🏢',
        industry: 'Technology',
        slug: 'systems-limited'
      },
      description: 'We are looking for a talented Full Stack Engineer to join our growing team. You will work on cutting-edge projects using React, Node.js, and cloud technologies.',
      location: 'Lahore, Pakistan',
      location_type: 'on-site',
      job_type: 'full-time',
      experience_level: 'mid',
      salary_min: 150000,
      salary_max: 250000,
      salary_currency: 'PKR',
      requirements: ['3+ years of experience', 'Strong React and TypeScript skills', 'Experience with Node.js', 'Knowledge of cloud platforms'],
      benefits: ['Health insurance', 'Flexible hours', 'Remote work options', 'Professional development'],
      required_skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      preferred_skills: ['AWS', 'Docker', 'Kubernetes'],
      application_deadline: '2025-01-31',
      applicants_count: 45,
      views_count: 523,
      posted_date: '2024-12-15',
      is_featured: true,
      status: 'active'
    },
    {
      id: '2',
      title: 'Product Management Intern',
      company: {
        name: 'Unilever Pakistan',
        logo: '🧴',
        industry: 'FMCG',
        slug: 'unilever-pakistan'
      },
      description: 'Join our world-class product team and learn from industry leaders. You will work on real products and gain hands-on experience in product strategy and execution.',
      location: 'Karachi, Pakistan',
      location_type: 'hybrid',
      job_type: 'internship',
      experience_level: 'entry',
      salary_min: 50000,
      salary_max: 75000,
      salary_currency: 'PKR',
      requirements: ['Currently enrolled in MBA program', 'Strong analytical skills', 'Excellent communication', 'Passion for products'],
      benefits: ['Stipend provided', 'Mentorship program', 'Full-time offer potential', 'Networking opportunities'],
      required_skills: ['Product Strategy', 'Data Analysis', 'Communication'],
      preferred_skills: ['Agile', 'SQL', 'Design Thinking'],
      application_deadline: '2025-02-15',
      applicants_count: 128,
      views_count: 892,
      posted_date: '2024-12-10',
      is_featured: true,
      status: 'active'
    },
    {
      id: '3',
      title: 'Pharmaceutical Sales Representative',
      company: {
        name: 'Getz Pharma',
        logo: '💊',
        industry: 'Healthcare',
        slug: 'getz-pharma'
      },
      description: 'Join our dynamic sales team and promote life-changing medicines to healthcare professionals. Excellent commission structure and growth opportunities.',
      location: 'Multiple Cities, Pakistan',
      location_type: 'on-site',
      job_type: 'full-time',
      experience_level: 'entry',
      salary_min: 80000,
      salary_max: 120000,
      salary_currency: 'PKR',
      requirements: ['Bachelor degree in Pharmacy or related field', 'Strong communication skills', 'Willingness to travel', 'Valid driving license'],
      benefits: ['Base salary + commission', 'Company car', 'Health insurance', 'Training programs'],
      required_skills: ['Sales', 'Communication', 'Pharmaceutical Knowledge'],
      preferred_skills: ['Previous sales experience', 'Medical background'],
      application_deadline: '2025-01-20',
      applicants_count: 67,
      views_count: 445,
      posted_date: '2024-12-12',
      is_featured: false,
      status: 'active'
    },
    {
      id: '4',
      title: 'Data Analyst - Healthcare Analytics',
      company: {
        name: 'Searle Company',
        logo: '🏥',
        industry: 'Healthcare',
        slug: 'searle-company'
      },
      description: 'Transform healthcare data into actionable insights. Work with our analytics team to drive data-driven decision making across the organization.',
      location: 'Karachi, Pakistan',
      location_type: 'remote',
      job_type: 'full-time',
      experience_level: 'mid',
      salary_min: 120000,
      salary_max: 180000,
      salary_currency: 'PKR',
      requirements: ['2+ years of data analysis experience', 'Strong SQL skills', 'Experience with visualization tools', 'Healthcare industry knowledge preferred'],
      benefits: ['Remote work', 'Health insurance', 'Learning budget', 'Flexible schedule'],
      required_skills: ['SQL', 'Python', 'Tableau', 'Statistics'],
      preferred_skills: ['Healthcare Analytics', 'Machine Learning', 'R'],
      application_deadline: '2025-02-28',
      applicants_count: 34,
      views_count: 278,
      posted_date: '2024-12-18',
      is_featured: false,
      status: 'active'
    },
    {
      id: '5',
      title: 'Event Coordinator - Volunteer to Paid',
      company: {
        name: 'Fstivo',
        logo: '🎯',
        industry: 'Event Management',
        slug: 'fstivo'
      },
      description: 'Top Fstivo volunteers get priority! Join our team as a full-time Event Coordinator. Plan and execute amazing events for universities and corporate partners.',
      location: 'Lahore, Pakistan',
      location_type: 'hybrid',
      job_type: 'full-time',
      experience_level: 'entry',
      salary_min: 75000,
      salary_max: 100000,
      salary_currency: 'PKR',
      requirements: ['Fstivo volunteer certification preferred', 'Experience organizing 5+ events', 'Strong organizational skills', 'Available to work weekends'],
      benefits: ['Competitive salary', 'Performance bonuses', 'Event industry exposure', 'Career growth'],
      required_skills: ['Event Planning', 'Team Coordination', 'Vendor Management'],
      preferred_skills: ['Volunteer Management', 'Budgeting', 'Marketing'],
      application_deadline: '2025-01-25',
      applicants_count: 18,
      views_count: 234,
      posted_date: '2024-12-20',
      is_featured: true,
      status: 'active'
    }
  ])

  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    job_type: '',
    location_type: '',
    experience_level: '',
    industry: ''
  })

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !filters.job_type || job.job_type === filters.job_type
    const matchesLocation = !filters.location_type || job.location_type === filters.location_type
    const matchesExperience = !filters.experience_level || job.experience_level === filters.experience_level
    const matchesIndustry = !filters.industry || job.company.industry === filters.industry

    return matchesSearch && matchesType && matchesLocation && matchesExperience && matchesIndustry
  })

  const featuredJobs = filteredJobs.filter(job => job.is_featured)
  const regularJobs = filteredJobs.filter(job => !job.is_featured)

  const handleApply = (job: JobPosting) => {
    // In production, this would open an application form
    alert(`Applying for: ${job.title} at ${job.company.name}`)
  }

  const handleSaveJob = (jobId: string) => {
    // In production, this would save the job to user's favorites
    alert(`Job saved: ${jobId}`)
  }

  const getLocationTypeBadge = (type: string) => {
    const badges = {
      'on-site': { label: 'On-site', color: 'bg-blue-100 text-blue-700' },
      'remote': { label: 'Remote', color: 'bg-green-100 text-green-700' },
      'hybrid': { label: 'Hybrid', color: 'bg-purple-100 text-purple-700' }
    }
    const badge = badges[type as keyof typeof badges] || badges['on-site']
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const getExperienceLevelBadge = (level: string) => {
    const badges = {
      'entry': { label: 'Entry Level', color: 'bg-gray-100 text-gray-700' },
      'mid': { label: 'Mid Level', color: 'bg-yellow-100 text-yellow-700' },
      'senior': { label: 'Senior Level', color: 'bg-orange-100 text-orange-700' },
      'lead': { label: 'Lead', color: 'bg-red-100 text-red-700' },
      'executive': { label: 'Executive', color: 'bg-purple-100 text-purple-700' }
    }
    const badge = badges[level as keyof typeof badges] || badges['entry']
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const getJobTypeBadge = (type: string) => {
    const badges = {
      'full-time': { label: 'Full-time', color: 'bg-indigo-100 text-indigo-700' },
      'part-time': { label: 'Part-time', color: 'bg-pink-100 text-pink-700' },
      'internship': { label: 'Internship', color: 'bg-cyan-100 text-cyan-700' },
      'contract': { label: 'Contract', color: 'bg-amber-100 text-amber-700' },
      'freelance': { label: 'Freelance', color: 'bg-teal-100 text-teal-700' }
    }
    const badge = badges[type as keyof typeof badges] || badges['full-time']
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Board</h1>
            <p className="text-gray-600">Discover opportunities from top employers</p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Post a Job
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 text-sm">Active Jobs</p>
            <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 text-sm">Companies Hiring</p>
            <p className="text-2xl font-bold text-gray-900">{new Set(jobs.map(j => j.company.slug)).size}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 text-sm">Total Applications</p>
            <p className="text-2xl font-bold text-gray-900">{jobs.reduce((sum, j) => sum + j.applicants_count, 0)}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 text-sm">Remote Jobs</p>
            <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => j.location_type === 'remote').length}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs or companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filters.job_type}
            onChange={(e) => setFilters({ ...filters, job_type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Job Types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
            <option value="freelance">Freelance</option>
          </select>

          <select
            value={filters.location_type}
            onChange={(e) => setFilters({ ...filters, location_type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Locations</option>
            <option value="on-site">On-site</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>

          <select
            value={filters.experience_level}
            onChange={(e) => setFilters({ ...filters, experience_level: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Levels</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="lead">Lead</option>
            <option value="executive">Executive</option>
          </select>
        </div>
      </div>

      {/* Featured Jobs */}
      {featuredJobs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Featured Opportunities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedJob(job)
                  setShowDetailModal(true)
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                      {job.company.logo}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{job.title}</h3>
                      <p className="text-sm text-indigo-200">{job.company.name}</p>
                    </div>
                  </div>
                  <Bookmark className="w-5 h-5 text-white/60 hover:text-white" />
                </div>

                <p className="text-sm text-indigo-100 mb-4 line-clamp-2">
                  {job.description}
                </p>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {getJobTypeBadge(job.job_type)}
                  {getLocationTypeBadge(job.location_type)}
                  {getExperienceLevelBadge(job.experience_level)}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                  {job.salary_min && job.salary_max && (
                    <span className="font-semibold">
                      Rs{(job.salary_min / 1000).toFixed(0)}k - {(job.salary_max / 1000).toFixed(0)}k
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {job.applicants_count} applicants
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Posted {new Date(job.posted_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Jobs */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Positions</h2>
        <div className="space-y-4">
          {regularJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedJob(job)
                setShowDetailModal(true)
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                    {job.company.logo}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{job.title}</h3>
                        <p className="text-gray-600 flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {job.company.name}
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-500">{job.company.industry}</span>
                        </p>
                      </div>
                      <Bookmark className="w-5 h-5 text-gray-400 hover:text-indigo-600" />
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {job.description}
                    </p>

                    <div className="flex items-center gap-3 flex-wrap">
                      {getJobTypeBadge(job.job_type)}
                      {getLocationTypeBadge(job.location_type)}
                      {getExperienceLevelBadge(job.experience_level)}
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      {job.salary_min && job.salary_max && (
                        <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                          <DollarSign className="w-4 h-4" />
                          Rs{(job.salary_min / 1000).toFixed(0)}k - {(job.salary_max / 1000).toFixed(0)}k
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {job.applicants_count} applicants
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <ChevronRight className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {regularJobs.length === 0 && featuredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {showDetailModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
            <div className="p-6 border-b border-gray-200 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                  {selectedJob.company.logo}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedJob.title}</h2>
                  <p className="text-gray-600 mb-2">{selectedJob.company.name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getJobTypeBadge(selectedJob.job_type)}
                    {getLocationTypeBadge(selectedJob.location_type)}
                    {getExperienceLevelBadge(selectedJob.experience_level)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{selectedJob.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <span>
                    {selectedJob.salary_min && selectedJob.salary_max
                      ? `Rs${(selectedJob.salary_min / 1000).toFixed(0)}k - ${(selectedJob.salary_max / 1000).toFixed(0)}k`
                      : 'Competitive'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span>Deadline: {new Date(selectedJob.application_deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span>{selectedJob.applicants_count} applicants</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700">{selectedJob.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Requirements</h3>
                <ul className="space-y-2">
                  {selectedJob.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.required_skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {selectedJob.preferred_skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3">Preferred Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.preferred_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Benefits</h3>
                <ul className="space-y-2">
                  {selectedJob.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Award className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  handleApply(selectedJob)
                  setShowDetailModal(false)
                }}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2"
              >
                Apply Now
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSaveJob(selectedJob.id)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
              >
                <Bookmark className="w-4 h-4" />
                Save Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobBoard
