import { NextRequest, NextResponse } from 'next/server'
import { handleJazzCashCallback } from '@/lib/payments/webhook'

/**
 * JazzCash payment callback endpoint
 * JazzCash redirects users here after payment completion
 */
export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams
  const params: Record<string, string> = {}

  // Convert all URL parameters to a record
  for (const [key, value] of searchParams.entries()) {
    params[key] = value
  }

  const result = await handleJazzCashCallback(params)

  if (result.success) {
    // Redirect to success page
    return NextResponse.redirect(
      new URL('/dashboard/registrations?success=Payment+successful', request.url)
    )
  } else {
    // Redirect to error page
    return NextResponse.redirect(
      new URL(`/dashboard/registrations?error=${encodeURIComponent(result.error || 'Payment failed')}`, request.url)
    )
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  const formData = await request.formData()
  const params: Record<string, string> = {}

  for (const [key, value] of formData.entries()) {
    params[key] = value.toString()
  }

  const result = await handleJazzCashCallback(params)

  return NextResponse.json(result)
}
