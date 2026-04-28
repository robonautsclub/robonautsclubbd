'use client'

interface AutoRefreshProps {
  /**
   * Kept only for backward compatibility. Dashboard now uses realtime updates.
   */
  interval?: number
}

export default function AutoRefresh({ interval = 120000 }: AutoRefreshProps) {
  void interval
  return null
}
