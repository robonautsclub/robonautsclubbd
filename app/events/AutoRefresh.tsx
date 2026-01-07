'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AutoRefreshProps {
  /**
   * Refresh interval in milliseconds
   * Default: 10000ms (10 seconds) for near real-time updates
   */
  interval?: number
}

export default function AutoRefresh({ interval = 10000 }: AutoRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    // Refresh at the specified interval (default: 5 seconds for near real-time updates)
    const intervalId = setInterval(() => {
      router.refresh()
    }, interval)

    // Cleanup interval on unmount
    return () => clearInterval(intervalId)
  }, [router, interval])

  // This component doesn't render anything
  return null
}

