import { MetadataRoute } from 'next'
import { getPublicEvents } from './(marketing)/events/actions'
import {
  getActiveRobofestCategories,
  getRobofestCategoryHref,
  getRobofestContent,
} from '@/lib/robofest-content'
import { getSiteOrigin } from '@/lib/site-config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteOrigin()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/robofest`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  let robofestPages: MetadataRoute.Sitemap = []
  try {
    const content = await getRobofestContent()
    const categories = getActiveRobofestCategories(content)
    robofestPages = categories.map((category) => ({
      url: `${baseUrl}${getRobofestCategoryHref(category.slug)}`,
      lastModified: content.updatedAt
        ? new Date(content.updatedAt)
        : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (error) {
    console.error('Error generating Robofest sitemap entries:', error)
  }

  try {
    const events = await getPublicEvents()
    const eventPages: MetadataRoute.Sitemap = events.map((event) => ({
      url: `${baseUrl}/events/${event.id}`,
      lastModified: event.updatedAt
        ? new Date(event.updatedAt)
        : event.createdAt
          ? new Date(event.createdAt)
          : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...robofestPages, ...eventPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return [...staticPages, ...robofestPages]
  }
}
