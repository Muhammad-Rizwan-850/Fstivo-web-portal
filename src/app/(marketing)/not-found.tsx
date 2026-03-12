import Link from 'next/link'

export default function MarketingNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-indigo-600">404</h1>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Page Not Found</h2>
        <p className="mt-2 text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/"
            className="rounded-md bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Go Home
          </Link>
          <Link
            href="/events"
            className="rounded-md border-2 border-indigo-600 px-6 py-3 font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            Browse Events
          </Link>
        </div>
      </div>
    </div>
  )
}
