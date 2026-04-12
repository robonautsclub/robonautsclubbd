export type NewsArticle = {
  id: string
  title: string
  slug: string
  body: string
  coverImageUrl?: string
  images?: string[]
  published: boolean
  /** Manual editorial date; falls back to publishedAt/createdAt in UI when absent */
  displayDate?: Date | string | null
  publishedAt: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
}
