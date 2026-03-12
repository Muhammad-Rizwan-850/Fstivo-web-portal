'use client'

import { useState } from 'react'
import { Mail, Send, Users, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { emailClient } from '@/lib/emailClient'

interface EmailCampaignManagerProps {
  eventId: string
  eventName: string
  organizerName?: string
}

export function EmailCampaignManager({ eventId, eventName, organizerName }: EmailCampaignManagerProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; recipientCount?: number } | null>(null)

  const handleSendEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      setResult({ success: false, message: 'Please provide both subject and message' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await emailClient.sendBulkEmail({
        eventId,
        subject,
        message,
      })

      if (response.success) {
        setResult({
          success: true,
          message: 'Email sent successfully!',
          recipientCount: (response.result as any)?.recipientCount,
        })
        // Clear form on success
        setSubject('')
        setMessage('')
      } else {
        setResult({ success: false, message: (response.error as any)?.message || 'Failed to send email' })
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Mail className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Send Email to Registrants</h3>
          <p className="text-sm text-gray-600">Send updates to all confirmed registrants of {eventName}</p>
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
          <div>
            <p className="font-medium">{result.message}</p>
            {result.recipientCount && (
              <p className="text-sm mt-1 opacity-75">Sent to {result.recipientCount} recipients</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Important Update: Schedule Change"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            This message will be sent to all confirmed registrants.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>All confirmed registrants will receive this email</span>
          </div>

          <button
            onClick={handleSendEmail}
            disabled={loading || !subject.trim() || !message.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
