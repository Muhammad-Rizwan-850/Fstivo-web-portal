/**
 * App Providers Component
 * Wraps the app with React Query, Error Boundary, and other providers
 */

'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import ErrorBoundary from './error-boundary'
import queryClient from '@/lib/react-query/client'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [isDevtoolsOpen, setIsDevtoolsOpen] = useState(false)

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools
            initialIsOpen={false}
            isOpen={isDevtoolsOpen}
            setIsOpen={setIsDevtoolsOpen}
            {...({ position: 'bottom-right' } as any)}
          />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

/**
 * HOC to wrap page with providers
 */
export const withProviders = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return function WithProviders(props: P) {
    return (
      <Providers>
        <Component {...props} />
      </Providers>
    )
  }
}

export default Providers
