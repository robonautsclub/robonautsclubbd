'use client'

interface RetryButtonProps {
  className?: string
}

export default function RetryButton({ className }: RetryButtonProps) {
  return (
    <button
      onClick={() => window.location.reload()}
      className={className}
    >
      Try Again
    </button>
  )
}

