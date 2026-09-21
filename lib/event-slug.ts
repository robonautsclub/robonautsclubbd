import { collectionSet, collectionWhere } from '@/lib/db/collections'
import { slugifyForUrl } from '@/lib/multilingualText'

export function slugifyEventTitle(title: string): string {
  const slug = slugifyForUrl(title.trim() || 'event')
  return slug === 'article' ? 'event' : slug
}

export async function ensureUniqueEventSlug(
  baseSlug: string,
  excludeDocId?: string,
  reserved?: Set<string>,
): Promise<string> {
  let slug = baseSlug
  let n = 0
  for (;;) {
    const takenInMemory = reserved?.has(slug)
    if (!takenInMemory) {
      const conflicts = await collectionWhere('events', 'slug', '==', slug, { limit: 5 })
      const conflict = conflicts.find((d) => d.id !== excludeDocId)
      if (!conflict) return slug
    }
    n += 1
    slug = `${baseSlug}-${n}`
  }
}

/** Persist slugs for events that predate the slug field. Mutates `events` in place. */
export async function persistMissingEventSlugs(
  events: Array<{ id: string; title: string; slug?: string }>,
): Promise<void> {
  const missing = events.filter((event) => !event.slug?.trim())
  if (missing.length === 0) return

  try {
    const reserved = new Set(
      events.map((event) => event.slug?.trim()).filter((slug): slug is string => Boolean(slug)),
    )
    const writes: Array<{ id: string; slug: string; event: { slug?: string } }> = []

    for (const event of missing) {
      const slug = await ensureUniqueEventSlug(slugifyEventTitle(event.title), event.id, reserved)
      reserved.add(slug)
      writes.push({ id: event.id, slug, event })
    }

    await Promise.all(
      writes.map((write) => collectionSet('events', write.id, { slug: write.slug }, { merge: true })),
    )

    for (const write of writes) {
      write.event.slug = write.slug
    }
  } catch (error) {
    console.error('Error persisting missing event slugs:', error)
  }
}
