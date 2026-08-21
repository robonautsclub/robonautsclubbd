import {
  HOMEPAGE_ORGS_COLLECTION,
  isHomepageOrgKind,
  type HomepageOrg,
  type HomepageOrgKind,
} from '@/types/homepage-org'

export {
  HOMEPAGE_ORGS_COLLECTION,
  isHomepageOrgKind,
  type HomepageOrg,
  type HomepageOrgKind,
} from '@/types/homepage-org'

function toSerializableDate(
  value: { toDate?: () => Date } | Date | string | undefined,
): string {
  if (!value) return new Date().toISOString()
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate().toISOString()
  }
  return new Date().toISOString()
}

export function mapHomepageOrgDoc(
  id: string,
  data: Record<string, unknown>,
): HomepageOrg | null {
  const name = typeof data.name === 'string' ? data.name.trim() : ''
  if (!name || !isHomepageOrgKind(data.kind)) return null

  const logoUrl =
    typeof data.logoUrl === 'string' && data.logoUrl.trim()
      ? data.logoUrl.trim()
      : undefined

  const sortOrder =
    typeof data.sortOrder === 'number' && Number.isFinite(data.sortOrder)
      ? data.sortOrder
      : 0

  return {
    id,
    kind: data.kind,
    name,
    logoUrl,
    sortOrder,
    isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
    createdAt: toSerializableDate(
      data.createdAt as { toDate?: () => Date } | Date | string | undefined,
    ),
    updatedAt: toSerializableDate(
      data.updatedAt as { toDate?: () => Date } | Date | string | undefined,
    ),
    createdBy:
      typeof data.createdBy === 'string' && data.createdBy.trim()
        ? data.createdBy.trim()
        : undefined,
  }
}

export function sortHomepageOrgs(orgs: HomepageOrg[]): HomepageOrg[] {
  return [...orgs].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.name.localeCompare(b.name)
  })
}

export function splitHomepageOrgs(orgs: HomepageOrg[]): {
  partners: HomepageOrg[]
  schools: HomepageOrg[]
} {
  const sorted = sortHomepageOrgs(orgs)
  return {
    partners: sorted.filter((org) => org.kind === 'partner'),
    schools: sorted.filter((org) => org.kind === 'workshop_school'),
  }
}

export function orgKindLabel(kind: HomepageOrgKind): string {
  return kind === 'partner' ? 'Partner' : 'School'
}
