import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us - FSTIVO',
  description: 'Learn about FSTIVO - Pakistan\'s leading university event management platform',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-600 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold sm:text-5xl">About FSTIVO</h1>
          <p className="text-xl text-indigo-100">
            Empowering universities to create memorable event experiences
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Our Mission</h2>
            <p className="text-lg text-gray-600">
              FSTIVO is revolutionizing how universities manage and discover events.
              We're building a comprehensive platform that connects students, organizers,
              and opportunities in one seamless experience.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">100+</div>
              <div className="mt-2 text-gray-600">Target Universities</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">500K+</div>
              <div className="mt-2 text-gray-600">Annual Graduates</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">50+</div>
              <div className="mt-2 text-gray-600">Features</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">3</div>
              <div className="mt-2 text-gray-600">Payment Methods</div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">Our Values</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-3 text-xl font-semibold">Accessibility</h3>
              <p className="text-gray-600">
                Making events accessible to every student, regardless of their background
                or location.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-3 text-xl font-semibold">Innovation</h3>
              <p className="text-gray-600">
                Leveraging cutting-edge technology to create seamless event experiences.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-3 text-xl font-semibold">Community</h3>
              <p className="text-gray-600">
                Building a vibrant community of students, organizers, and institutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mb-8 text-xl text-indigo-100">
            Join thousands of students and organizers already using FSTIVO
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="rounded-md bg-white px-8 py-3 font-semibold text-indigo-600 transition-colors hover:bg-gray-100"
            >
              Sign Up Free
            </Link>
            <Link
              href="/contact"
              className="rounded-md border-2 border-white px-8 py-3 font-semibold transition-colors hover:bg-white/10"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
