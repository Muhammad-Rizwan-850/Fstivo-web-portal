import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - FSTIVO',
  description: 'Our privacy policy and how we handle your data',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">Privacy Policy</h1>

        <div className="space-y-8 rounded-lg bg-white p-8 shadow-md">
          <section>
            <h2 className="mb-4 text-2xl font-semibold">1. Information We Collect</h2>
            <p className="mb-2 text-gray-600">We collect information you provide directly:</p>
            <ul className="list-disc space-y-1 pl-6 text-gray-600">
              <li>Account information (name, email, password)</li>
              <li>Profile information (university, interests, photo)</li>
              <li>Event registration details</li>
              <li>Payment information (processed securely via third-party providers)</li>
              <li>Communications with support</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">2. How We Use Your Information</h2>
            <p className="mb-2 text-gray-600">We use your information to:</p>
            <ul className="list-disc space-y-1 pl-6 text-gray-600">
              <li>Provide and improve our services</li>
              <li>Process event registrations and payments</li>
              <li>Send important notifications and updates</li>
              <li>Personalize your experience</li>
              <li>Analyze usage patterns to improve the platform</li>
              <li>Communicate about events and features</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">3. Information Sharing</h2>
            <p className="text-gray-600">
              We do not sell your personal information. We may share information with:
            </p>
            <ul className="list-disc space-y-1 pl-6 text-gray-600">
              <li>Event organizers (for events you register for)</li>
              <li>Payment processors (for transaction processing)</li>
              <li>Service providers who assist our operations</li>
              <li>Law enforcement (when required by law)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">4. Data Security</h2>
            <p className="text-gray-600">
              We implement industry-standard security measures to protect your data, including encryption, secure servers, and regular security audits. However, no method of transmission is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">5. Your Rights</h2>
            <p className="text-gray-600">You have the right to:</p>
            <ul className="list-disc space-y-1 pl-6 text-gray-600">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">6. Cookies and Tracking</h2>
            <p className="text-gray-600">
              We use cookies and similar technologies to improve your experience, analyze usage, and assist in marketing efforts. You can control cookie settings through your browser.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">7. Third-Party Links</h2>
            <p className="text-gray-600">
              Our platform may contain links to third-party websites. We are not responsible for the privacy practices of such websites.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">8. Children's Privacy</h2>
            <p className="text-gray-600">
              FSTIVO is not intended for children under 13. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">9. Changes to Privacy Policy</h2>
            <p className="text-gray-600">
              We may update this privacy policy from time to time. We will notify users of significant changes via email or prominent notice on the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">10. Contact Us</h2>
            <p className="text-gray-600">
              For privacy-related questions or concerns, please contact us at privacy@fstivo.com
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
