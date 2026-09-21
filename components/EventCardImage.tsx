'use client'

import { useState } from 'react'
import Image from 'next/image'

const FALLBACK_IMAGE = '/robologo.png'

export default function EventCardImage({
  src,
  alt,
  priority = false,
}: {
  src?: string
  alt: string
  priority?: boolean
}) {
  const [imageError, setImageError] = useState(false)
  const imageSrc = src && !imageError ? src : FALLBACK_IMAGE

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      className="object-cover group-hover:scale-105 transition-transform duration-300"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      onError={() => setImageError(true)}
    />
  )
}
