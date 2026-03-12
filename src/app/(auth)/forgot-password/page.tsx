import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forgot Password - FSTIVO',
  description: 'Reset your password',
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold">Forgot Your Password?</h1>
        <p className="mb-6 text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
          >
            Send Reset Link
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/login" className="text-sm text-indigo-600 hover:text-indigo-700">
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  )
}
