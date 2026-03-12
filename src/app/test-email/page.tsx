'use client'

import { useState } from 'react'
import { Mail, Send, Loader2, CheckCircle, AlertCircle, TestTube } from 'lucide-react'
import { emailClient } from '@/lib/emailClient'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSendTest = async () => {
    if (!email.trim()) {
      setResult({ success: false, message: 'Please enter an email address' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await emailClient.sendTest(email)

      if (response.success) {
        setResult({ success: true, message: 'Test email sent successfully! Check your inbox.' })
      } else {
        setResult({ success: false, message: (response.error as any)?.message || 'Failed to send test email' })
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TestTube className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Service Test</h1>
          <p className="text-gray-600">Send a test email to verify your Resend configuration</p>
        </div>

        {/* Test Email Card */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Send Test Email</h3>
              <p className="text-sm text-gray-600">Test your email service configuration</p>
            </div>
          </div>

          {result && (
            <div
              className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
                result.success ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}
              <p className="font-medium">{result.message}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Test Recipient Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleSendTest}
              disabled={loading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Test Email...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Test Email
                </>
              )}
            </button>
          </div>

          {/* Info Section */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">About This Test</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Sends a registration confirmation email template</li>
              <li>• Tests if Resend API is properly configured</li>
              <li>• Verifies email delivery to your inbox</li>
              <li>• Check console for mock mode indicator</li>
            </ul>
          </div>
        </div>

        {/* Configuration Info */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">RESEND_API_KEY</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                process.env.NEXT_PUBLIC_RESEND_API_KEY ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {process.env.NEXT_PUBLIC_RESEND_API_KEY ? 'Set' : 'Not Set'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">RESEND_FROM_EMAIL</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL ? 'Set' : 'Not Set'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Service Mode</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                process.env.NEXT_PUBLIC_RESEND_API_KEY ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {process.env.NEXT_PUBLIC_RESEND_API_KEY ? 'Live Mode' : 'Mock Mode'}
              </span>
            </div>
          </div>

          {!process.env.NEXT_PUBLIC_RESEND_API_KEY && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Mock Mode Active:</strong> Emails will not be actually sent. Add your RESEND_API_KEY to .env.local to enable live mode.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
