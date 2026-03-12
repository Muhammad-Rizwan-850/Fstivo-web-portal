'use client'

import React, { useState } from 'react'
import { Shield, CheckCircle, XCircle, Search, QrCode, Award, FileText, User, Calendar, Building, Link, ExternalLink, Download, Share2, Verified, AlertCircle, Info, Clock } from 'lucide-react'

interface CertificateDetails {
  certificate_number: string
  title: string
  recipient_name: string
  description: string
  skills_covered: string[]
  hours_completed: number
  events_completed: number
  issue_date: string
  expiry_date?: string
  status: 'active' | 'expired' | 'revoked'
  issuer: string
  co_issuers: string[]
  verification_count: number
  last_verified: string
  blockchain_verified: boolean
  blockchain_hash?: string
  blockchain_explorer_url?: string
  qr_code_url: string
  pdf_url: string
  recipient_photo?: string
  recipient_email?: string
  recipient_linkedin?: string
}

const CertificateVerification: React.FC = () => {
  const [searchMode, setSearchMode] = useState<'number' | 'qr'>('number')
  const [certificateNumber, setCertificateNumber] = useState('')
  const [searchResult, setSearchResult] = useState<CertificateDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVerificationHistory, setShowVerificationHistory] = useState(false)

  // Mock certificate data
  const mockCertificate: CertificateDetails = {
    certificate_number: 'FST-2024-VOL-A3F7D2C1',
    title: 'Event Volunteer Certificate',
    recipient_name: 'Ahmed Hassan',
    description: 'Recognizing outstanding volunteer service in event management and coordination. This individual has demonstrated exceptional dedication and leadership across multiple events.',
    skills_covered: ['Event Coordination', 'Team Leadership', 'Communication', 'Problem Solving', 'Time Management'],
    hours_completed: 87.5,
    events_completed: 12,
    issue_date: '2024-12-15',
    status: 'active',
    issuer: 'Fstivo',
    co_issuers: ['LUMS Career Services', 'NUST Student Affairs'],
    verification_count: 23,
    last_verified: new Date().toISOString(),
    blockchain_verified: true,
    blockchain_hash: '0x8f7d3b2a1c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
    blockchain_explorer_url: 'https://explorer.example.com/tx/0x8f7d3b2a1c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
    qr_code_url: 'https://fstivo.com/qr/FST-2024-VOL-A3F7D2C1',
    pdf_url: '/certificates/FST-2024-VOL-A3F7D2C1.pdf',
    recipient_photo: '/photos/ahmed-hassan.jpg',
    recipient_email: 'ahmed.hassan@example.com',
    recipient_linkedin: 'https://linkedin.com/in/ahmedhassan'
  }

  const handleVerify = async () => {
    if (!certificateNumber.trim()) {
      setError('Please enter a certificate number')
      return
    }

    setLoading(true)
    setError(null)
    setSearchResult(null)

    // Simulate API call
    setTimeout(() => {
      // Mock verification logic
      if (certificateNumber.toUpperCase() === mockCertificate.certificate_number) {
        setSearchResult(mockCertificate)
      } else if (certificateNumber.toUpperCase().startsWith('FST-')) {
        setError('Certificate not found. Please check the certificate number and try again.')
      } else {
        setError('Invalid certificate number format. Certificate numbers start with "FST-".')
      }
      setLoading(false)
    }, 1500)
  }

  const handleScanQR = () => {
    // In production, this would open a QR scanner
    alert('QR Scanner would open here. In production, this will use the device camera to scan certificate QR codes.')
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" />, label: 'Valid & Active' },
      expired: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4" />, label: 'Expired' },
      revoked: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4" />, label: 'Revoked' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Certificate Verification</h1>
          <p className="text-lg text-indigo-100 max-w-2xl mx-auto">
            Verify the authenticity of Fstivo certificates instantly. Enter the certificate number or scan the QR code to validate.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Verification Search */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Verify a Certificate</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSearchMode('number')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  searchMode === 'number'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Certificate Number
              </button>
              <button
                onClick={() => setSearchMode('qr')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  searchMode === 'qr'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <QrCode className="w-4 h-4 inline mr-2" />
                Scan QR Code
              </button>
            </div>
          </div>

          {searchMode === 'number' ? (
            <div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate Number
                </label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={certificateNumber}
                      onChange={(e) => setCertificateNumber(e.target.value)}
                      placeholder="e.g., FST-2024-VOL-A3F7D2C1"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                      onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                    />
                  </div>
                  <button
                    onClick={handleVerify}
                    disabled={loading}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Verify
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Example: FST-2024-VOL-A3F7D2C1 (Try this to see a sample certificate)
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Verification Failed</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <QrCode className="w-24 h-24 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-6">Point your camera at a certificate QR code to verify</p>
              <button
                onClick={handleScanQR}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Open Camera
              </button>
            </div>
          )}
        </div>

        {/* Verification Result */}
        {searchResult && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Verification Header */}
            <div className="bg-green-50 border-b border-green-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Certificate Verified</h2>
                    <p className="text-gray-600">This certificate is authentic and issued by Fstivo</p>
                  </div>
                </div>
                {getStatusBadge(searchResult.status)}
              </div>
            </div>

            <div className="p-8">
              {/* Certificate Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Certificate Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Award className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Certificate Title</p>
                          <p className="font-semibold text-gray-900">{searchResult.title}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Certificate Number</p>
                          <p className="font-mono text-sm font-semibold text-gray-900">{searchResult.certificate_number}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Issuing Organization</p>
                          <p className="font-semibold text-gray-900">{searchResult.issuer}</p>
                          {searchResult.co_issuers.length > 0 && (
                            <p className="text-sm text-gray-600">Co-issued by: {searchResult.co_issuers.join(', ')}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Issue Date</p>
                          <p className="font-semibold text-gray-900">{new Date(searchResult.issue_date).toLocaleDateString()}</p>
                          {searchResult.expiry_date && (
                            <p className="text-sm text-gray-600">Expires: {new Date(searchResult.expiry_date).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Skills Certified</h3>
                    <div className="flex flex-wrap gap-2">
                      {searchResult.skills_covered.map((skill, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Recipient Info */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Recipient Information</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-bold text-xl text-gray-900">{searchResult.recipient_name}</p>
                          <p className="text-sm text-gray-600">Certificate Holder</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Hours Completed</p>
                          <p className="font-semibold text-gray-900">{searchResult.hours_completed}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Events Completed</p>
                          <p className="font-semibold text-gray-900">{searchResult.events_completed}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Verification */}
                  {searchResult.blockchain_verified && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-3 mb-3">
                        <Verified className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-green-900">Blockchain Verified</p>
                          <p className="text-sm text-green-700">
                            This certificate is permanently recorded on the blockchain
                          </p>
                        </div>
                      </div>
                      {searchResult.blockchain_hash && (
                        <div className="mt-3">
                          <p className="text-xs text-green-700 mb-1">Blockchain Hash:</p>
                          <p className="font-mono text-xs bg-green-100 p-2 rounded break-all">
                            {searchResult.blockchain_hash}
                          </p>
                          {searchResult.blockchain_explorer_url && (
                            <a
                              href={searchResult.blockchain_explorer_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-green-700 hover:underline mt-2"
                            >
                              View on Blockchain Explorer
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verification Stats */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Verifications</span>
                      <span className="font-semibold text-gray-900">{searchResult.verification_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">Last Verified</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(searchResult.last_verified).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
                <button
                  onClick={() => setShowVerificationHistory(!showVerificationHistory)}
                  className="px-4 py-2 text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
                >
                  <Info className="w-4 h-4" />
                  {showVerificationHistory ? 'Hide' : 'Show'} Verification History
                </button>
              </div>

              {showVerificationHistory && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Recent Verifications</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Just now</span>
                      <span className="text-gray-900">IP: 192.168.1.xxx</span>
                      <span className="text-green-600">Manual Search</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">2 hours ago</span>
                      <span className="text-gray-900">IP: 203.xxx.xxx.xxx</span>
                      <span className="text-blue-600">QR Scan</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Yesterday</span>
                      <span className="text-gray-900">IP: 45.xxx.xxx.xxx</span>
                      <span className="text-green-600">Manual Search</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* How It Works */}
        {!searchResult && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How Certificate Verification Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">1. Enter Certificate Number</h3>
                <p className="text-gray-600 text-sm">
                  Locate the unique certificate number on the certificate or scan the QR code.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">2. Instant Verification</h3>
                <p className="text-gray-600 text-sm">
                  Our system verifies the certificate against our secure database and blockchain records.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">3. View Details</h3>
                <p className="text-gray-600 text-sm">
                  Access full certificate details including recipient info, skills, and verification history.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Security Notice</h3>
              <p className="text-sm text-blue-800">
                Fstivo certificates are secured with blockchain technology and cannot be forged. Each certificate has a unique
                identifier and QR code. Always verify certificates through this official portal to ensure authenticity.
                If you suspect a certificate is fraudulent, please report it immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CertificateVerification
