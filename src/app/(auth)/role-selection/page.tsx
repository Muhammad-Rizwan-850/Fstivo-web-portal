import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Select Your Role - FSTIVO',
  description: 'Choose your role to get started',
}

export default function RoleSelectionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Welcome to FSTIVO
          </h1>
          <p className="text-lg text-gray-600">
            Select your role to personalize your experience
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Student */}
          <button className="rounded-lg border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-indigo-500 hover:shadow-lg">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold">Student</h2>
            <p className="text-sm text-gray-600">
              Discover and attend events at your university
            </p>
          </button>

          {/* Organizer */}
          <button className="rounded-lg border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-indigo-500 hover:shadow-lg">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold">Organizer</h2>
            <p className="text-sm text-gray-600">
              Create and manage events efficiently
            </p>
          </button>

          {/* Corporate Partner */}
          <button className="rounded-lg border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-indigo-500 hover:shadow-lg">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold">Corporate</h2>
            <p className="text-sm text-gray-600">
              Sponsor events and recruit talent
            </p>
          </button>

          {/* University */}
          <button className="rounded-lg border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-indigo-500 hover:shadow-lg">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold">University</h2>
            <p className="text-sm text-gray-600">
              Manage all university events in one place
            </p>
          </button>

          {/* Volunteer */}
          <button className="rounded-lg border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-indigo-500 hover:shadow-lg">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold">Volunteer</h2>
            <p className="text-sm text-gray-600">
              Support events and earn rewards
            </p>
          </button>

          {/* Administrator */}
          <button className="rounded-lg border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-indigo-500 hover:shadow-lg">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold">Administrator</h2>
            <p className="text-sm text-gray-600">
              Platform administration and management
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
