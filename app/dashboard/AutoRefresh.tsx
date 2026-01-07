'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    // Refresh every 2 minutes (120,000 milliseconds)
    const interval = setInterval(() => {
      router.refresh()
    }, 120000) // 2 minutes

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [router])

  // This component doesn't render anything
  return null
}
