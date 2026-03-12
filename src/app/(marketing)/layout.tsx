import Link from 'next/link'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <Link href="/" className="flex flex-shrink-0 items-center">
                <span className="text-2xl font-bold text-indigo-600">FSTIVO</span>
              </Link>
              <div className="ml-6 flex space-x-8">
                <Link href="/about" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-900 hover:border-indigo-500">
                  About
                </Link>
                <Link href="/features" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-900 hover:border-indigo-500">
                  Features
                </Link>
                <Link href="/pricing" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-900 hover:border-indigo-500">
                  Pricing
                </Link>
                <Link href="/contact" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-900 hover:border-indigo-500">
                  Contact
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link
                href="/login"
                className="mr-4 rounded-md border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">FSTIVO</h3>
              <p className="mt-2 text-sm text-gray-600">
                Pakistan's leading university event management platform.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Product</h4>
              <ul className="mt-2 space-y-1">
                <li><Link href="/features" className="text-sm text-gray-600 hover:text-gray-900">Features</Link></li>
                <li><Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link></li>
                <li><Link href="/events" className="text-sm text-gray-600 hover:text-gray-900">Events</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Company</h4>
              <ul className="mt-2 space-y-1">
                <li><Link href="/about" className="text-sm text-gray-600 hover:text-gray-900">About</Link></li>
                <li><Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900">Contact</Link></li>
                <li><Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Legal</h4>
              <ul className="mt-2 space-y-1">
                <li><Link href="/legal/terms" className="text-sm text-gray-600 hover:text-gray-900">Terms</Link></li>
                <li><Link href="/legal/privacy" className="text-sm text-gray-600 hover:text-gray-900">Privacy</Link></li>
                <li><Link href="/legal/cookies" className="text-sm text-gray-600 hover:text-gray-900">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2026 FSTIVO. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
