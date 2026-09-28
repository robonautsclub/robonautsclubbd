import Script from 'next/script'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1079258526503093"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <Navbar />
      {children}
      <Footer />
    </>
  )
}
