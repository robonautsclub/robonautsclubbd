'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AutoRefreshProps {
  /**
   * Refresh interval in milliseconds.
   * Default 5 minutes: balances fresh registration data with fewer origin/edge hits.
   */
  interval?: number
}

export default function AutoRefresh({ interval = 300000 }: AutoRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    const intervalId = setInterval(() => {
      router.refresh()
    }, interval)

    // Cleanup interval on unmount
    return () => clearInterval(intervalId)
  }, [router, interval])

  // This component doesn't render anything
  return null
}

