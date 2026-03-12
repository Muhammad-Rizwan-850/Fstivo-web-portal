'use client'

import { useEffect, useState, useRef } from 'react'
import { QrReader } from 'react-qr-reader'

interface UseQRScannerReturn {
  result: string | null
  resetScanner: () => void
  error: string | null
}

export function useQRScanner(): UseQRScannerReturn {
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hasResultRef = useRef(false)

  const resetScanner = () => {
    setResult(null)
    setError(null)
    hasResultRef.current = false
  }

  // Note: react-qr-reader component should be used directly in the component
  // This is a simplified hook for state management
  // The actual QR scanning happens via the QrReader component

  return {
    result,
    resetScanner,
    error,
  }
}

// Export a wrapper component for QR scanner that can be used in the check-in page
export { QrReader }
