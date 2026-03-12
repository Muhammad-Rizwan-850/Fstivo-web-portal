import { Suspense } from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify Email - FSTIVO',
  description: 'Verify your email address',
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Suspense fallback={<div>Loading...</div>}>
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-4 text-2xl font-bold">Verify Your Email</h1>
          <p className="text-gray-600">
            Please check your email for a verification link.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
