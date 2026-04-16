'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AutoRefreshProps {
  /**
   * Refresh interval in milliseconds.
   * Default 2 minutes: enough for dashboard updates without hammering the server.
   */
  interval?: number
}

export default function AutoRefresh({ interval = 120000 }: AutoRefreshProps) {
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
