import { AuthenticationUI } from '@/components/auth/authentication-ui'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up - FSTIVO',
  description: 'Create a new FSTIVO account',
}

export default function RegisterPage() {
  return <AuthenticationUI mode="signup" />
}
