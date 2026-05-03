'use client'

import { useState } from 'react'
import Image from 'next/image'

interface EventImageProps {
  src: string
  alt: string
  priority?: boolean
}

export default function EventImage({ src, alt, priority = false }: EventImageProps) {
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    // This will catch errors from Next.js Image component
    // including when the domain is not configured in next.config.js
    // Next.js will fail to optimize the image and the browser will show a broken image
    // which triggers this onError handler
    if (!hasError) {
      setHasError(true)
    }
  }

  // If error occurred (including unconfigured domain in next.config.js), use fallback
  if (hasError) {
    return (
      <div className="relative h-64 md:h-80 lg:h-96">
        <Image
          src="/robot.gif"
          alt={alt}
          fill
          className="object-cover"
          priority={priority}
          quality={80}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => {}} // prevent infinite loop if fallback fails
        />
      </div>
    )
  }

  // Try Next.js Image component first
  // If the domain is not configured in next.config.js, Next.js will fail to optimize
  // and the browser will show a broken image, which triggers onError
  return (
    <div className="relative h-64 md:h-80 lg:h-96">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        priority={priority}
        quality={85}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        loading={priority ? undefined : 'lazy'}
        onError={handleError}
      />
    </div>
  )
}

