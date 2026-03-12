import { Metadata } from 'next'
import Link from 'next/link'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Blog Post - FSTIVO`,
    description: 'Read the latest from FSTIVO',
  }
}

export default async function BlogPostPage() {
  return (
    <div className="min-h-screen">
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center text-indigo-600 hover:text-indigo-700"
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>

        <div className="mb-8">
          <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-600">
            Announcements
          </span>
        </div>

        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          Introducing FSTIVO: Revolutionizing University Events in Pakistan
        </h1>

        <div className="mb-8 flex items-center text-sm text-gray-600">
          <span className="mr-4">FSTIVO Team</span>
          <time dateTime="2026-01-05">January 5, 2026</time>
        </div>

        <div className="prose prose-lg max-w-none">
          <p className="mb-4 text-lg text-gray-600">
            We are thrilled to introduce FSTIVO, Pakistan's first comprehensive university event
            management platform designed specifically for students, universities, and organizers.
          </p>

          <h2 className="mt-8 mb-4 text-2xl font-bold">The Problem We're Solving</h2>
          <p className="mb-4">
            University events are the heart of student life, but managing them has always been
            challenging. Students struggle to discover relevant events, organizers face complex
            logistics, and universities lack a unified platform to showcase their activities.
          </p>

          <h2 className="mt-8 mb-4 text-2xl font-bold">What Makes FSTIVO Different</h2>
          <ul className="mb-4 list-disc space-y-2 pl-6">
            <li>Local payment integrations (JazzCash, Easypaisa)</li>
            <li>Volunteer compensation system</li>
            <li>Certificate generation and verification</li>
            <li>Built-in networking features</li>
            <li>Advanced analytics for organizers</li>
          </ul>

          <h2 className="mt-8 mb-4 text-2xl font-bold">Get Started Today</h2>
          <p className="mb-4">
            Join thousands of students and organizers already using FSTIVO to create memorable
            event experiences. Create your free account and start discovering events today!
          </p>

          <div className="mt-8 rounded-lg bg-indigo-50 p-6">
            <Link
              href="/register"
              className="inline-block rounded-md bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}
