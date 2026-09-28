'use client'

import { Button } from '@/components/ui/button'

interface RetryButtonProps {
  className?: string
}

export default function RetryButton({ className }: RetryButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => window.location.reload()}
      className={className}
    >
      Try Again
    </Button>
  )
}
