import { AuthenticationUI } from '@/components/auth/authentication-ui'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - FSTIVO',
  description: 'Sign in to your FSTIVO account',
}

export default function LoginPage() {
  return <AuthenticationUI mode="login" />
}
