'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

const GA_MEASUREMENT_ID = 'G-X87SJ4G3R7'

/**
 * Loads GA only outside /dashboard to cut third-party requests on admin routes.
 */
export default function ConditionalAnalytics() {
  const pathname = usePathname()
  if (pathname?.startsWith('/dashboard')) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
      </Script>
    </>
  )
}
