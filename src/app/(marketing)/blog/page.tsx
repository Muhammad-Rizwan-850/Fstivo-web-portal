import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog - FSTIVO',
  description: 'Latest news, updates, and articles from FSTIVO',
}

export default function BlogPage() {
  const posts = [
    {
      id: 1,
      title: 'Introducing FSTIVO: Revolutionizing University Events in Pakistan',
      excerpt: 'Learn how FSTIVO is transforming the way universities manage and discover events.',
      date: '2026-01-05',
      author: 'FSTIVO Team',
      category: 'Announcements',
      slug: 'introducing-fstivo'
    },
    {
      id: 2,
      title: '5 Tips for Creating Successful University Events',
      excerpt: 'Expert tips on organizing memorable and engaging university events.',
      date: '2026-01-03',
      author: 'Sarah Ahmed',
      category: 'Event Tips',
      slug: '5-tips-successful-university-events'
    },
    {
      id: 3,
      title: 'New Payment Integration: JazzCash and Easypaisa',
      excerpt: 'We\'re excited to announce local payment gateway integrations for easier ticket purchases.',
      date: '2026-01-01',
      author: 'FSTIVO Team',
      category: 'Features',
      slug: 'new-payment-integration'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-600 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Blog</h1>
          <p className="text-xl text-indigo-100">
            Latest news, updates, and insights
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="flex flex-col rounded-lg bg-white shadow-md">
                <div className="h-48 rounded-t-lg bg-gradient-to-br from-indigo-400 to-purple-400"></div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-2 text-sm text-indigo-600">{post.category}</div>
                  <h2 className="mb-2 text-xl font-bold">
                    <Link href={`/blog/${post.slug}`} className="hover:text-indigo-600">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mb-4 flex-1 text-gray-600">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{post.author}</span>
                    <time dateTime={post.date}>{new Date(post.date).toLocaleDateString()}</time>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
