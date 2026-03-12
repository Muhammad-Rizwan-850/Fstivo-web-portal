import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Help Center - FSTIVO',
  description: 'Find answers to common questions and get help',
}

export default function HelpPage() {
  const categories = [
    {
      title: 'Getting Started',
      icon: '🚀',
      articles: [
        'How to create an account',
        'Profile setup guide',
        'Finding and joining events',
        'Creating your first event',
      ]
    },
    {
      title: 'Event Management',
      icon: '📅',
      articles: [
        'Creating events',
        'Customizing registration forms',
        'Managing attendees',
        'Event analytics',
      ]
    },
    {
      title: 'Tickets & Payments',
      icon: '🎫',
      articles: [
        'Setting up ticket types',
        'Payment options explained',
        'Refund policies',
        'Check-in procedures',
      ]
    },
    {
      title: 'Account & Settings',
      icon: '⚙️',
      articles: [
        'Updating your profile',
        'Notification preferences',
        'Privacy settings',
        'Deleting your account',
      ]
    },
    {
      title: 'For Organizers',
      icon: '🎯',
      articles: [
        'Organizer dashboard guide',
        'Promoting your event',
        'Managing volunteers',
        'Post-event analytics',
      ]
    },
    {
      title: 'Technical Support',
      icon: '🔧',
      articles: [
        'Troubleshooting login issues',
        'Payment problems',
        'App not working',
        'Report a bug',
      ]
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-600 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold sm:text-5xl">How can we help?</h1>
          <p className="text-xl text-indigo-100">
            Search our knowledge base or browse categories below
          </p>
          <div className="mt-8 max-w-2xl">
            <input
              type="search"
              placeholder="Search for help articles..."
              className="w-full rounded-lg px-6 py-3 text-gray-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Browse by Category
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={`/help/${category.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="group rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-indigo-500 hover:shadow-lg"
              >
                <div className="mb-4 text-4xl">{category.icon}</div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900 group-hover:text-indigo-600">
                  {category.title}
                </h3>
                <ul className="space-y-2">
                  {category.articles.slice(0, 3).map((article) => (
                    <li key={article} className="text-sm text-gray-600">
                      {article}
                    </li>
                  ))}
                  {category.articles.length > 3 && (
                    <li className="text-sm text-indigo-600">
                      +{category.articles.length - 3} more articles
                    </li>
                  )}
                </ul>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Quick Links
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Link
              href="/contact"
              className="rounded-lg bg-white p-6 text-center shadow-md transition-all hover:shadow-lg"
            >
              <h3 className="mb-2 font-semibold">Contact Support</h3>
              <p className="text-sm text-gray-600">Get personalized help from our team</p>
            </Link>
            <Link
              href="/features"
              className="rounded-lg bg-white p-6 text-center shadow-md transition-all hover:shadow-lg"
            >
              <h3 className="mb-2 font-semibold">Feature Guides</h3>
              <p className="text-sm text-gray-600">Learn how to use FSTIVO features</p>
            </Link>
            <Link
              href="/legal/privacy"
              className="rounded-lg bg-white p-6 text-center shadow-md transition-all hover:shadow-lg"
            >
              <h3 className="mb-2 font-semibold">Privacy & Security</h3>
              <p className="text-sm text-gray-600">How we protect your data</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
