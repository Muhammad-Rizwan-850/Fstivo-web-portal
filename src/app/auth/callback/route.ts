import { createClient } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successful auth, redirect to dashboard
      return NextResponse.redirect(new URL(redirect, request.url))
    }
  }

  // Error or no code, redirect to sign in
  return NextResponse.redirect(new URL('/sign-in?error=auth_failed', request.url))
}
