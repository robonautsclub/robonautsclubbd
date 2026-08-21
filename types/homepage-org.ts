export const HOMEPAGE_ORGS_COLLECTION = 'homepage_orgs'

export type HomepageOrgKind = 'partner' | 'workshop_school'

export type HomepageOrg = {
  id: string
  kind: HomepageOrgKind
  name: string
  logoUrl?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export type HomepageOrgWriteInput = {
  kind: HomepageOrgKind
  name: string
  logoUrl?: string
  isActive?: boolean
  sortOrder?: number
}

export type PublicHomepageOrgs = {
  partners: HomepageOrg[]
  schools: HomepageOrg[]
}

export function isHomepageOrgKind(value: unknown): value is HomepageOrgKind {
  return value === 'partner' || value === 'workshop_school'
}
