import { MetadataRoute } from 'next'
import { getSiteOrigin } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteOrigin()

  const disallow = ['/dashboard/', '/login/', '/api/', '/verify/', '/verify-booking']

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallow,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: disallow,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: disallow,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
