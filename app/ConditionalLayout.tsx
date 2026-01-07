'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Exclude Navbar and Footer for dashboard and login pages
  const isDashboardRoute = pathname?.startsWith('/dashboard') || pathname?.startsWith('/login')
  
  if (isDashboardRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}

