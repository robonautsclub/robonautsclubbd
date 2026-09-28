import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1079258526503093"
        crossOrigin="anonymous"
      />
      <Navbar />
      {children}
      <Footer />
    </>
  )
}
