'use client'

import React, { useState } from 'react'
import { Award, Download, Share2, Eye, CheckCircle, FileText, QrCode, Linkedin, Globe, Shield, Calendar, Clock, User, Building, MapPin, ExternalLink, Star, Circle, XCircle } from 'lucide-react'

interface Certificate {
  id: string
  certificate_number: string
  title: string
  description: string
  skills_covered: string[]
  hours_completed: number
  events_completed: number
  issue_date: string
  expiry_date?: string
  qr_code: string
  verification_url: string
  pdf_url: string
  status: 'active' | 'expired' | 'revoked'
}

interface CertificateType {
  id: string
  name: string
  description: string
  tier: string
  min_hours: number
  min_events: number
  min_rating: number
  price: number
  validity_months?: number
}

const CertificateGenerator: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([
    {
      id: '1',
      certificate_number: 'FST-2024-VOL-A3F7D2C1',
      title: 'Event Volunteer Certificate',
      description: 'Recognizing outstanding volunteer service in event management and coordination',
      skills_covered: ['Event Coordination', 'Team Leadership', 'Communication', 'Problem Solving'],
      hours_completed: 87.5,
      events_completed: 12,
      issue_date: '2024-12-15',
      qr_code: 'https://fstivo.com/verify/FST-2024-VOL-A3F7D2C1',
      verification_url: 'https://fstivo.com/verify/FST-2024-VOL-A3F7D2C1',
      pdf_url: '/certificates/FST-2024-VOL-A3F7D2C1.pdf',
      status: 'active'
    },
    {
      id: '2',
      certificate_number: 'FST-2024-COORD-B4E8D3F2',
      title: 'Event Coordinator Certificate',
      description: 'Advanced certification for leadership in coordinating multiple successful events',
      skills_covered: ['Project Management', 'Team Leadership', 'Event Planning', 'Crisis Management', 'Vendor Relations'],
      hours_completed: 150,
      events_completed: 8,
      issue_date: '2024-10-20',
      expiry_date: '2027-10-20',
      qr_code: 'https://fstivo.com/verify/FST-2024-COORD-B4E8D3F2',
      verification_url: 'https://fstivo.com/verify/FST-2024-COORD-B4E8D3F2',
      pdf_url: '/certificates/FST-2024-COORD-B4E8D3F2.pdf',
      status: 'active'
    }
  ])

  const [certificateTypes] = useState<CertificateType[]>([
    {
      id: '1',
      name: 'Event Volunteer Certificate',
      description: 'Entry-level certificate for volunteers who have completed basic service',
      tier: 'Volunteer',
      min_hours: 20,
      min_events: 3,
      min_rating: 0,
      price: 500,
      validity_months: undefined
    },
    {
      id: '2',
      name: 'Event Coordinator Certificate',
      description: 'Advanced certification for experienced volunteer coordinators',
      tier: 'Coordinator',
      min_hours: 100,
      min_events: 5,
      min_rating: 4.5,
      price: 2000,
      validity_months: 36
    },
    {
      id: '3',
      name: 'Professional Event Manager',
      description: 'Professional credential for career event managers',
      tier: 'Manager',
      min_hours: 500,
      min_events: 20,
      min_rating: 4.7,
      price: 5000,
      validity_months: undefined
    }
  ])

  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  const handleDownload = (certificate: Certificate) => {
    // In production, this would trigger a PDF download
    alert(`Downloading certificate: ${certificate.certificate_number}`)
  }

  const handleShare = (certificate: Certificate) => {
    setSelectedCertificate(certificate)
    setShareModalOpen(true)
  }

  const handleLinkedInShare = (certificate: Certificate) => {
    const shareUrl = `https://www.linkedin.com/profile/add?_ed=0_33FpE3YE3YF3YE3YE3YE3YE3YE3YE3YE3YE3YE3YE3YE3YE3YE3YE3YE3YE3YE3YE3YE&pfCertificationName=${encodeURIComponent(certificate.title)}&pfCertificationUrl=${encodeURIComponent(certificate.verification_url)}&pfCertificationOrganization=Fstivo`
    window.open(shareUrl, '_blank')
  }

  const getEligibilityStatus = (certType: CertificateType, currentHours: number, currentEvents: number, currentRating: number) => {
    const hoursMet = currentHours >= certType.min_hours
    const eventsMet = currentEvents >= certType.min_events
    const ratingMet = currentRating >= certType.min_rating || certType.min_rating === 0

    return {
      eligible: hoursMet && eventsMet && ratingMet,
      hoursMet,
      eventsMet,
      ratingMet,
      progress: Math.min(
        Math.floor(
          (Math.min(currentHours / certType.min_hours, 1) * 40) +
          (Math.min(currentEvents / certType.min_events, 1) * 40) +
          (ratingMet ? 20 : 0)
        ),
        100
      )
    }
  }

  // Mock current user progress
  const userProgress = {
    hours: 87.5,
    events: 12,
    rating: 4.7
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Certification Program</h1>
        <p className="text-gray-600">Earn globally-recognized certifications for your volunteer work</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-50 p-3 rounded-lg">
              <Award className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Certificates Earned</p>
              <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{userProgress.hours}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Events Completed</p>
              <p className="text-2xl font-bold text-gray-900">{userProgress.events}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-50 p-3 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">{userProgress.rating}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Certifications */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Available Certifications</h2>
        <div className="space-y-6">
          {certificateTypes.map((certType) => {
            const eligibility = getEligibilityStatus(certType, userProgress.hours, userProgress.events, userProgress.rating)

            return (
              <div key={certType.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{certType.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        eligibility.eligible
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {eligibility.eligible ? 'Eligible' : `${eligibility.progress}% Complete`}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{certType.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm ${eligibility.hoursMet ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                          {certType.min_hours} hours required
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm ${eligibility.eventsMet ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                          {certType.min_events} events required
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm ${eligibility.ratingMet ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                          {certType.min_rating > 0 ? `${certType.min_rating}+ rating` : 'No rating req.'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Rs{certType.price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {!eligibility.eligible && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Your Progress</span>
                          <span className="font-semibold text-gray-900">{eligibility.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 rounded-full h-2 transition-all"
                            style={{ width: `${eligibility.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {eligibility.eligible ? (
                    <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                      Claim Certificate
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                    >
                      Not Eligible Yet
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Earned Certificates */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Your Certificates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {/* Certificate Preview */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{certificate.title}</h3>
                      <p className="text-sm text-indigo-200">{certificate.certificate_number}</p>
                    </div>
                  </div>
                  {certificate.status === 'active' && (
                    <span className="px-3 py-1 bg-green-500 rounded-full text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-200" />
                    <span>{certificate.hours_completed} Hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-200" />
                    <span>{certificate.events_completed} Events</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-200" />
                    <span>Issued {new Date(certificate.issue_date).toLocaleDateString()}</span>
                  </div>
                  {certificate.expiry_date && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-200" />
                      <span>Expires {new Date(certificate.expiry_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {certificate.skills_covered.slice(0, 3).map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-white/20 rounded-full text-xs">
                      {skill}
                    </span>
                  ))}
                  {certificate.skills_covered.length > 3 && (
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs">
                      +{certificate.skills_covered.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(certificate)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCertificate(certificate)
                        setShowPreview(true)
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLinkedInShare(certificate)}
                      className="px-4 py-2 bg-[#0077b5] text-white rounded-lg hover:bg-[#006396] text-sm font-medium flex items-center gap-2"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </button>
                    <button
                      onClick={() => handleShare(certificate)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedCertificate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Certificate Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-8">
              {/* Certificate Design */}
              <div className="border-8 border-double border-indigo-600 p-12 bg-gradient-to-br from-white to-indigo-50">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Award className="w-12 h-12 text-indigo-600" />
                    <h1 className="text-4xl font-bold text-gray-900">Fstivo</h1>
                  </div>
                  <p className="text-lg text-gray-600">Certificate of Achievement</p>
                </div>

                <div className="text-center mb-8">
                  <p className="text-gray-600 mb-2">This is to certify that</p>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">[Your Name]</h2>
                  <p className="text-gray-600 mb-6">has successfully completed the requirements for</p>
                  <h3 className="text-2xl font-bold text-indigo-600 mb-4">{selectedCertificate.title}</h3>
                  <p className="text-gray-700 max-w-2xl mx-auto">{selectedCertificate.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-8 mb-8">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Hours Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedCertificate.hours_completed}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Events Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedCertificate.events_completed}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Date Issued</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(selectedCertificate.issue_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <QrCode className="w-24 h-24" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-600 mb-1">Certificate Number</p>
                    <p className="font-mono text-sm font-semibold text-gray-900 mb-2">
                      {selectedCertificate.certificate_number}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">Verify at</p>
                    <a
                      href={selectedCertificate.verification_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      {selectedCertificate.verification_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Blockchain Verified • Globally Recognized</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(selectedCertificate!)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && selectedCertificate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Share Certificate</h2>
              <button
                onClick={() => setShareModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedCertificate.verification_url}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(selectedCertificate.verification_url)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleLinkedInShare(selectedCertificate)}
                  className="flex-1 px-4 py-3 bg-[#0077b5] text-white rounded-lg hover:bg-[#006396] font-medium flex items-center justify-center gap-2"
                >
                  <Linkedin className="w-5 h-5" />
                  Share on LinkedIn
                </button>
                <button
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just earned my ${selectedCertificate.title} from Fstivo! ${selectedCertificate.verification_url}`)}`, '_blank')}
                  className="flex-1 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium flex items-center justify-center gap-2"
                >
                  <Globe className="w-5 h-5" />
                  Share on Twitter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CertificateGenerator
