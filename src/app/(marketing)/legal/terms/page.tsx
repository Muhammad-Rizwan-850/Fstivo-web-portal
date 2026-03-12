import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - FSTIVO',
  description: 'Terms of service and usage policies',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">Terms of Service</h1>

        <div className="space-y-8 rounded-lg bg-white p-8 shadow-md">
          <section>
            <h2 className="mb-4 text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-gray-600">
              By accessing and using FSTIVO, you accept and agree to be bound by the terms and provisions of this agreement.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">2. Use License</h2>
            <p className="text-gray-600">
              Permission is granted to temporarily download one copy of the materials on FSTIVO's website for personal, non-commercial transitory viewing only.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">3. User Accounts</h2>
            <p className="text-gray-600">
              You are responsible for maintaining the confidentiality of your account and password and for restricting access to your account. You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">4. Events and Registrations</h2>
            <p className="text-gray-600">
              Event organizers are responsible for the accuracy of event information. FSTIVO acts as a platform and does not guarantee the quality, safety, or legality of events listed on the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">5. Payment Terms</h2>
            <p className="text-gray-600">
              Payment for event registrations and premium features is processed securely. Refunds are subject to the individual event organizer's policy.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">6. Prohibited Activities</h2>
            <ul className="list-disc space-y-2 pl-6 text-gray-600">
              <li>Creating fake events or fraudulent listings</li>
              <li>Harassing or abusing other users</li>
              <li>Spamming or sending unsolicited messages</li>
              <li>Attempting to gain unauthorized access to the platform</li>
              <li>Violating any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">7. Termination</h2>
            <p className="text-gray-600">
              FSTIVO reserves the right to terminate or suspend access to the platform immediately, without prior notice, for any breach of these Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">8. Limitation of Liability</h2>
            <p className="text-gray-600">
              FSTIVO shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">9. Changes to Terms</h2>
            <p className="text-gray-600">
              FSTIVO reserves the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">10. Contact Information</h2>
            <p className="text-gray-600">
              For questions about these Terms, please contact us at legal@fstivo.com
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
