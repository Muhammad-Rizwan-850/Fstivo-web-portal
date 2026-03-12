import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Features - FSTIVO',
  description: 'Explore all the powerful features FSTIVO has to offer',
}

export default function FeaturesPage() {
  const features = [
    {
      category: 'Event Management',
      items: [
        { title: 'Event Creation Wizard', desc: 'Create events in minutes with our intuitive wizard' },
        { title: 'Custom Registration Forms', desc: 'Collect the information you need with custom forms' },
        { title: 'Multi-day Events', desc: 'Support for conferences and multi-day programs' },
        { title: 'Session Management', desc: 'Organize sessions, tracks, and schedules' },
        { title: 'Speaker Management', desc: 'Manage speakers, bios, and presentations' },
        { title: 'Event Templates', desc: 'Reuse successful event formats' },
      ]
    },
    {
      category: 'Ticketing & Registration',
      items: [
        { title: 'Digital Tickets', desc: 'QR-based digital tickets with verification' },
        { title: 'Multiple Ticket Types', desc: 'General admission, VIP, early bird, and more' },
        { title: 'Tiered Pricing', desc: 'Set different prices for different attendee types' },
        { title: 'Discount Codes', desc: 'Create promo codes and special offers' },
        { title: 'Waitlist Management', desc: 'Automated waitlist when events sell out' },
        { title: 'Check-in App', desc: 'Fast QR scanning for event check-in' },
      ]
    },
    {
      category: 'Payment Processing',
      items: [
        { title: 'Stripe Integration', desc: 'Accept credit and debit cards globally' },
        { title: 'JazzCash', desc: 'Pakistan\'s most popular mobile wallet' },
        { title: 'Easypaisa', desc: 'Another leading Pakistani payment method' },
        { title: 'Bank Transfer', desc: 'Traditional bank transfer option' },
        { title: 'Instant Payouts', desc: 'Receive payments quickly and securely' },
        { title: 'Payment Analytics', desc: 'Track revenue and payment trends' },
      ]
    },
    {
      category: 'Marketing & Growth',
      items: [
        { title: 'Email Campaigns', desc: 'Design and send targeted email campaigns' },
        { title: 'Referral Program', desc: 'Grow attendance through word-of-mouth' },
        { title: 'Social Sharing', desc: 'Easy sharing to social media platforms' },
        { title: 'Landing Pages', desc: 'Beautiful event pages with custom URLs' },
        { title: 'SEO Optimization', desc: 'Events appear in search results' },
        { title: 'Analytics Dashboard', desc: 'Track attendance, engagement, and more' },
      ]
    },
    {
      category: 'Networking',
      items: [
        { title: 'Attendee Directory', desc: 'Connect with other attendees' },
        { title: 'Messaging System', desc: 'In-app messaging for networking' },
        { title: 'Interest Groups', desc: 'Join groups based on interests' },
        { title: 'Job Board', desc: 'Discover career opportunities' },
        { title: 'Corporate Partners', desc: 'Connect with sponsoring companies' },
        { title: 'Volunteer Opportunities', desc: 'Find and apply for volunteer roles' },
      ]
    },
    {
      category: 'For Volunteers',
      items: [
        { title: 'Volunteer Dashboard', desc: 'Track your volunteer activities' },
        { title: 'Activity Logger', desc: 'Log hours and contributions' },
        { title: 'Points System', desc: 'Earn points for your contributions' },
        { title: 'Monetary Compensation', desc: 'Get paid for your volunteer work' },
        { title: 'Certificates', desc: 'Receive volunteer certificates' },
        { title: 'Leaderboard', desc: 'See top contributors' },
      ]
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-600 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Powerful Features</h1>
          <p className="text-xl text-indigo-100">
            Everything you need to create, manage, and attend amazing events
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {features.map((category) => (
            <div key={category.category} className="mb-16">
              <h2 className="mb-8 border-b-2 border-indigo-600 pb-2 text-3xl font-bold text-gray-900">
                {category.category}
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {category.items.map((feature) => (
                  <div key={feature.title} className="rounded-lg bg-white p-6 shadow-md">
                    <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                    <p className="text-gray-600">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mb-8 text-xl text-indigo-100">
            Join thousands of users already leveraging FSTIVO's powerful features
          </p>
          <Link
            href="/register"
            className="inline-block rounded-md bg-white px-8 py-3 font-semibold text-indigo-600 transition-colors hover:bg-gray-100"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  )
}
