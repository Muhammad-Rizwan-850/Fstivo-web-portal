'use client'

import { useEffect } from 'react'
import { Metadata } from 'next'
import { logger } from '@/lib/logger';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Auth error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Authentication Error</h1>
        <p className="mb-4 text-gray-600">
          {error.message || 'An error occurred during authentication.'}
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
          >
            Try Again
          </button>
          <a
            href="/login"
            className="block w-full rounded-md border border-gray-300 px-4 py-2 text-center text-gray-700 transition-colors hover:bg-gray-50"
          >
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  )
}
