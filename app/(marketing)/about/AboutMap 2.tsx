'use client'

import dynamic from 'next/dynamic'

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div
      className="h-[420px] w-full rounded-2xl bg-slate-100 animate-pulse border border-gray-200"
      aria-busy
      aria-label="Loading map"
    />
  ),
})

export default function AboutMap() {
  return <MapClient />
}
