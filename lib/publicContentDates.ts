import type { NewsArticle } from '@/types/news'
import type { GalleryGroup } from '@/types/gallery'

/** Date shown on public news (manual display date, then publish time, then created). */
export function effectiveNewsDisplayRaw(article: NewsArticle): string | Date | null {
  return article.displayDate ?? article.publishedAt ?? article.createdAt ?? null
}

/** Date shown on public gallery album (manual display date, then created). */
export function effectiveGalleryDisplayRaw(group: GalleryGroup): string | Date | null {
  return group.displayDate ?? group.createdAt ?? null
}
