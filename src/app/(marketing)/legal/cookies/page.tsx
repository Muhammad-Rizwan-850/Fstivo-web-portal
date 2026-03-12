import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy - FSTIVO',
  description: 'How we use cookies and similar technologies',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">Cookie Policy</h1>

        <div className="space-y-8 rounded-lg bg-white p-8 shadow-md">
          <section>
            <h2 className="mb-4 text-2xl font-semibold">1. What Are Cookies</h2>
            <p className="text-gray-600">
              Cookies are small text files stored on your device when you visit websites. They help provide functionality and improve your experience.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">2. How We Use Cookies</h2>
            <p className="mb-2 text-gray-600">We use cookies for:</p>
            <ul className="list-disc space-y-1 pl-6 text-gray-600">
              <li><strong>Essential cookies:</strong> Required for the platform to function</li>
              <li><strong>Authentication:</strong> Keeping you logged in</li>
              <li><strong>Preferences:</strong> Remembering your settings</li>
              <li><strong>Analytics:</strong> Understanding how the platform is used</li>
              <li><strong>Marketing:</strong> Delivering relevant advertisements</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">3. Types of Cookies</h2>

            <h3 className="mb-2 text-xl font-semibold">Essential Cookies</h3>
            <p className="mb-4 text-gray-600">
              Required for core functionality such as security, authentication, and accessibility.
            </p>

            <h3 className="mb-2 text-xl font-semibold">Functional Cookies</h3>
            <p className="mb-4 text-gray-600">
              Enable enhanced functionality and personalization, such as videos and live chats.
            </p>

            <h3 className="mb-2 text-xl font-semibold">Analytics Cookies</h3>
            <p className="mb-4 text-gray-600">
              Help us understand how users interact with the platform by collecting anonymous data.
            </p>

            <h3 className="mb-2 text-xl font-semibold">Marketing Cookies</h3>
            <p className="text-gray-600">
              Used to deliver advertisements relevant to you and your interests.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">4. Third-Party Cookies</h2>
            <p className="text-gray-600">
              We may allow trusted third parties to place cookies on your device for services like analytics, payment processing, and marketing.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">5. Managing Cookies</h2>
            <p className="mb-2 text-gray-600">
              You can control and manage cookies through your browser settings:
            </p>
            <ul className="list-disc space-y-1 pl-6 text-gray-600">
              <li>Chrome: Settings {'>'} Privacy and security {'>'} Cookies and other site data</li>
              <li>Firefox: Options {'>'} Privacy & Security {'>'} Cookies and Site Data</li>
              <li>Safari: Preferences {'>'} Privacy {'>'} Manage Website Data</li>
              <li>Edge: Settings {'>'} Cookies and site permissions</li>
            </ul>
            <p className="mt-2 text-gray-600">
              Note that disabling cookies may affect the functionality of the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">6. Browser Local Storage</h2>
            <p className="text-gray-600">
              We also use browser local storage and similar technologies to store preferences and improve performance.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">7. Updates to This Policy</h2>
            <p className="text-gray-600">
              We may update this cookie policy from time to time to reflect changes in our practices or for operational reasons.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">8. Contact Us</h2>
            <p className="text-gray-600">
              For questions about our use of cookies, contact us at privacy@fstivo.com
            </p>
          </section>

          <p className="text-sm text-gray-500">
            Last updated: January 5, 2026
          </p>
        </div>
      </div>
    </div>
  )
}
