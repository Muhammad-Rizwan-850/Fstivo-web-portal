/**
 * Comprehensive Database Test Page
 * Test Supabase connection, queries, real-time subscriptions, and more
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, AlertCircle, Loader2, Database, Zap, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  getEvents,
  getEventCategories,
  getRegistrations,
  getAnalytics,
  getActivityPoints,
} from '@/lib/supabase/queries'
import { useConnectionStatus } from '@/lib/hooks/useRealtimeSubscription'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  message: string
  data?: any
  error?: string
  duration?: number
}

export default function DatabaseTestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [config, setConfig] = useState({
    url: '',
    hasKey: false,
  })

  // Test real-time connection
  const realtimeStatus = useConnectionStatus()

  useEffect(() => {
    // Check environment configuration
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    setConfig({
      url: url.includes('your-project-id') ? 'Not configured' : url,
      hasKey: !!key && !key.includes('your-anon-key'),
    })
  }, [])

  const runTest = async (
    name: string,
    testFn: () => Promise<any>
  ): Promise<TestResult> => {
    const startTime = Date.now()
    try {
      const data = await testFn()
      const duration = Date.now() - startTime
      return {
        name,
        status: 'success',
        message: `Success (${duration}ms)`,
        data,
        duration,
      }
    } catch (error: any) {
      const duration = Date.now() - startTime
      return {
        name,
        status: 'error',
        message: `Failed (${duration}ms)`,
        error: error.message || String(error),
        duration,
      }
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setResults([])

    const tests: Promise<TestResult>[] = []

    // Test 1: Basic Connection
    tests.push(
      runTest('Database Connection', async () => {
        const { data, error } = await supabase!.from('event_categories').select('id').limit(1)
        if (error) throw error
        return { connected: true, hasData: (data?.length || 0) > 0 }
      })
    )

    // Test 2: Get Categories
    tests.push(
      runTest('Event Categories', async () => {
        const result = await getEventCategories()
        if (result.error) throw result.error
        return { count: result.data?.length || 0, categories: result.data }
      })
    )

    // Test 3: Get Published Events
    tests.push(
      runTest('Published Events', async () => {
        const result = await getEvents({ is_published: true, limit: 10 })
        if (result.error) throw result.error
        return { count: result.data?.length || 0, events: result.data }
      })
    )

    // Test 4: Event by ID
    tests.push(
      runTest('Event Detail Query', async () => {
        const eventsResult = await getEvents({ limit: 1 })
        if (eventsResult.error) throw eventsResult.error
        if (!eventsResult.data || eventsResult.data.length === 0) {
          return { message: 'No events to test' }
        }
        const eventId = eventsResult.data[0].id
        const { data, error } = await supabase!
          .from('events')
          .select('*, organizer:profiles(id, full_name), category:event_categories(id, name)')
          .eq('id', eventId)
          .single()
        if (error) throw error
        return { event: data }
      })
    )

    // Test 5: Registrations Query
    tests.push(
      runTest('Registrations Query', async () => {
        const eventsResult = await getEvents({ limit: 1 })
        if (eventsResult.error) throw eventsResult.error
        if (!eventsResult.data || eventsResult.data.length === 0) {
          return { message: 'No events to test registrations' }
        }
        const result = await getRegistrations(eventsResult.data[0].id)
        if (result.error) throw result.error
        return { count: result.data?.length || 0 }
      })
    )

    // Test 6: Volunteer Data
    tests.push(
      runTest('Volunteer Profiles', async () => {
        const { data, error } = await supabase!.from('volunteers').select('*').limit(10)
        if (error) throw error
        return { count: data?.length || 0 }
      })
    )

    // Test 7: Activity Points
    tests.push(
      runTest('Activity Points Config', async () => {
        const result = await getActivityPoints()
        if (result.error) throw result.error
        return { count: result.data?.length || 0, activities: result.data }
      })
    )

    // Test 8: Certifications
    tests.push(
      runTest('Certifications', async () => {
        const { data, error } = await supabase!.from('certifications').select('*').limit(10)
        if (error) throw error
        return { count: data?.length || 0 }
      })
    )

    // Test 9: Corporate Partners
    tests.push(
      runTest('Corporate Partners', async () => {
        const { data, error } = await supabase!.from('corporate_partners').select('*').limit(10)
        if (error) throw error
        return { count: data?.length || 0 }
      })
    )

    // Test 10: Job Postings
    tests.push(
      runTest('Job Postings', async () => {
        const { data, error } = await supabase!.from('job_postings').select('*').limit(10)
        if (error) throw error
        return { count: data?.length || 0 }
      })
    )

    // Test 11: Analytics Query
    tests.push(
      runTest('Analytics Query', async () => {
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const result = await getAnalytics(
          thirtyDaysAgo.toISOString(),
          now.toISOString()
        )
        if (result.error) throw result.error
        return result.data
      })
    )

    // Test 12: Organizations
    tests.push(
      runTest('Organizations', async () => {
        const { data, error } = await supabase!.from('organizations').select('*').limit(10)
        if (error) throw error
        return { count: data?.length || 0 }
      })
    )

    // Test 13: View - Event Details
    tests.push(
      runTest('View: Event Details', async () => {
        const { data, error } = await supabase!.from('event_details').select('*').limit(5)
        if (error) throw error
        return { count: data?.length || 0 }
      })
    )

    // Test 14: Count Queries
    tests.push(
      runTest('Count Queries Performance', async () => {
        const start = Date.now()
        const { count: eventsCount } = await supabase!
          .from('events')
          .select('*', { count: 'exact', head: true })
        const { count: registrationsCount } = await supabase!
          .from('registrations')
          .select('*', { count: 'exact', head: true })
        const duration = Date.now() - start

        return {
          duration,
          events: eventsCount || 0,
          registrations: registrationsCount || 0,
        }
      })
    )

    const testResults = await Promise.all(tests)
    setResults(testResults)
    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5" />
      case 'error':
        return <XCircle className="w-5 h-5" />
      case 'running':
        return <Loader2 className="w-5 h-5 animate-spin" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'running':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getRealtimeColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-700'
      case 'connecting':
        return 'bg-yellow-100 text-yellow-700'
      case 'error':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const passedTests = results.filter((r) => r.status === 'success').length
  const failedTests = results.filter((r) => r.status === 'error').length
  const avgDuration = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-600 rounded-xl">
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Database Test Suite</h1>
              <p className="text-gray-600">
                Comprehensive testing for Supabase integration
              </p>
            </div>
          </div>
        </div>

        {/* Environment Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Environment Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Supabase URL</p>
              <p className={`text-sm font-mono ${config.url === 'Not configured' ? 'text-red-600' : 'text-green-600'}`}>
                {config.url || 'Not set'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Anon Key</p>
              <p className={`text-sm font-mono ${config.hasKey ? 'text-green-600' : 'text-red-600'}`}>
                {config.hasKey ? '✓ Configured' : '✗ Not set'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Real-time Status</p>
              <p className={`text-sm font-medium px-3 py-1 rounded-full inline-flex ${getRealtimeColor(realtimeStatus)}`}>
                {realtimeStatus.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Test Summary */}
        {results.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-600">{results.length}</p>
                <p className="text-sm text-gray-600">Total Tests</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{passedTests}</p>
                <p className="text-sm text-gray-600">Passed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{failedTests}</p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-700">{avgDuration}ms</p>
                <p className="text-sm text-gray-600">Avg Time</p>
              </div>
            </div>
          </div>
        )}

        {/* Run Tests Button */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={runAllTests}
            disabled={isRunning || !supabase}
            className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 ${
              isRunning || !supabase
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
            }`}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Run All Tests
              </>
            )}
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
            {results.map((result, index) => (
              <div
                key={index}
                className={`border rounded-xl p-4 ${getStatusColor(result.status)} transition-all`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <h3 className="font-semibold">{result.name}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {result.duration && (
                      <span className="text-sm opacity-75 bg-white/50 px-2 py-1 rounded">
                        {result.duration}ms
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm mb-2">{result.message}</p>
                {result.error && (
                  <pre className="text-xs bg-white/50 p-2 rounded overflow-auto">
                    {result.error}
                  </pre>
                )}
                {result.data && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer hover:underline">
                      View Response Data
                    </summary>
                    <pre className="text-xs bg-white/50 p-3 rounded mt-2 overflow-auto max-h-48">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Setup Instructions */}
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6">
          <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Setup Instructions
          </h3>
          <ol className="space-y-3 text-sm text-indigo-800">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>
                Create a new project at{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  supabase.com
                </a>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>
                Run the SQL schema from <code className="bg-indigo-100 px-2 py-1 rounded">supabase/schema.sql</code> in the SQL Editor
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>
                Copy your project URL and anon key from Settings → API
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>
                Update <code className="bg-indigo-100 px-2 py-1 rounded">.env.local</code> with your credentials
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                5
              </span>
              <span>
                Enable Realtime for tables in Settings → API → Enable Realtime for: events, registrations, volunteers
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
