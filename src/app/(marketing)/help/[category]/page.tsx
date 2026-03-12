import { Metadata } from 'next'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params
  return {
    title: `${category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - FSTIVO Help`,
    description: 'Help articles and guides',
  }
}

export default async function HelpCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const articles = [
    {
      title: 'How to create an account',
      description: 'Learn how to sign up and get started with FSTIVO',
    },
    {
      title: 'Profile setup guide',
      description: 'Customize your profile for the best experience',
    },
    {
      title: 'Finding and joining events',
      description: 'Discover events that match your interests',
    },
  ]

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Link
          href="/help"
          className="mb-8 inline-flex items-center text-indigo-600 hover:text-indigo-700"
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Help
        </Link>

        <h1 className="mb-8 text-4xl font-bold text-gray-900">
          {category.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
        </h1>

        <div className="space-y-4">
          {articles.map((article) => (
            <Link
              key={article.title}
              href="#"
              className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <h2 className="mb-2 text-xl font-semibold text-gray-900 hover:text-indigo-600">
                {article.title}
              </h2>
              <p className="text-gray-600">{article.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
