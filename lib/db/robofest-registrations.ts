/**
 * Indexed D1 queries for Robofest registrations (dashboard hot path).
 * Prefer these over collectionWhere full-table scans.
 */
import { and, desc, eq, lt, or, sql, type SQL } from 'drizzle-orm'
import { getDb } from './index'
import { parsePayload, type JsonRecord } from './documents'
import { robofestRegistrations } from './schema'

export type RobofestRegistrationSqlFilters = {
  status: string
  category?: string
  roundCity?: string
  ageCategory?: string
}

export type RobofestRegistrationKeysetCursor = {
  createdAt: string
  id: string
}

/** Participant count aligned with JS participantCount() in registrations-data. */
const PARTICIPANT_SQL = sql<number>`COALESCE(
  NULLIF(${robofestRegistrations.teamSize}, 0),
  NULLIF(json_array_length(json_extract(${robofestRegistrations.payload}, '$.teamMembers')), 0),
  1
)`

function mergeRegistrationRow(row: {
  id: string
  payload: string | null
} & Record<string, unknown>): JsonRecord {
  const payload = parsePayload(row.payload)
  const { payload: _p, id, ...columns } = row
  const indexed: JsonRecord = {}
  for (const [key, value] of Object.entries(columns)) {
    if (value != null) indexed[key] = value
  }
  return { ...payload, ...indexed, id: String(id) }
}

function buildFilterConditions(filters: RobofestRegistrationSqlFilters): SQL[] {
  const conditions: SQL[] = [eq(robofestRegistrations.status, filters.status)]
  if (filters.category) {
    conditions.push(eq(robofestRegistrations.category, filters.category))
  }
  if (filters.roundCity) {
    conditions.push(eq(robofestRegistrations.roundCity, filters.roundCity))
  }
  if (filters.ageCategory) {
    conditions.push(eq(robofestRegistrations.ageCategory, filters.ageCategory))
  }
  return conditions
}

function keysetCondition(cursor: RobofestRegistrationKeysetCursor): SQL {
  return or(
    lt(robofestRegistrations.createdAt, cursor.createdAt),
    and(
      eq(robofestRegistrations.createdAt, cursor.createdAt),
      lt(robofestRegistrations.id, cursor.id),
    ),
  )!
}

export async function queryRobofestRegistrationsPage(options: {
  filters: RobofestRegistrationSqlFilters
  cursor?: RobofestRegistrationKeysetCursor | null
  limit: number
}): Promise<{ rows: JsonRecord[]; hasMore: boolean }> {
  const database = await getDb()
  const conditions = buildFilterConditions(options.filters)
  if (options.cursor?.id && options.cursor.createdAt) {
    conditions.push(keysetCondition(options.cursor))
  }

  const rows = await database
    .select()
    .from(robofestRegistrations)
    .where(and(...conditions))
    .orderBy(desc(robofestRegistrations.createdAt), desc(robofestRegistrations.id))
    .limit(options.limit + 1)

  const hasMore = rows.length > options.limit
  const pageRows = hasMore ? rows.slice(0, options.limit) : rows
  return {
    rows: pageRows.map((row) => mergeRegistrationRow(row)),
    hasMore,
  }
}

export async function countRobofestRegistrations(
  filters: RobofestRegistrationSqlFilters,
): Promise<number> {
  const database = await getDb()
  const conditions = buildFilterConditions(filters)
  const result = await database
    .select({ count: sql<number>`count(*)` })
    .from(robofestRegistrations)
    .where(and(...conditions))
  return Number(result[0]?.count ?? 0)
}

/** Load up to `limit` rows matching indexed filters (for search / export). */
export async function queryRobofestRegistrationsMatching(options: {
  filters: RobofestRegistrationSqlFilters
  limit: number
}): Promise<JsonRecord[]> {
  const database = await getDb()
  const conditions = buildFilterConditions(options.filters)
  const rows = await database
    .select()
    .from(robofestRegistrations)
    .where(and(...conditions))
    .orderBy(desc(robofestRegistrations.createdAt), desc(robofestRegistrations.id))
    .limit(options.limit)
  return rows.map((row) => mergeRegistrationRow(row))
}

export async function queryRobofestRegistrationStatusCounts(): Promise<
  Record<string, number>
> {
  const database = await getDb()
  const rows = await database
    .select({
      status: robofestRegistrations.status,
      count: sql<number>`count(*)`,
    })
    .from(robofestRegistrations)
    .groupBy(robofestRegistrations.status)

  const counts: Record<string, number> = {}
  for (const row of rows) {
    if (row.status) counts[row.status] = Number(row.count ?? 0)
  }
  return counts
}

export type RobofestRegistrationAggregateStats = {
  registrations: number
  total: number
  paidTotal: number
  paidCount: number
  byCategory: [string, number][]
  byAge: [string, number][]
}

export async function queryRobofestRegistrationStats(
  filters: RobofestRegistrationSqlFilters,
): Promise<RobofestRegistrationAggregateStats> {
  const database = await getDb()
  const conditions = buildFilterConditions(filters)
  const whereClause = and(...conditions)

  const [totals] = await database
    .select({
      registrations: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(${PARTICIPANT_SQL}), 0)`,
      paidTotal: sql<number>`coalesce(sum(
        case when ${robofestRegistrations.paymentStatus} = 'paid'
          then coalesce(${robofestRegistrations.amountPaid}, 0)
          else 0
        end
      ), 0)`,
      paidCount: sql<number>`coalesce(sum(
        case when ${robofestRegistrations.paymentStatus} = 'paid' then 1 else 0 end
      ), 0)`,
    })
    .from(robofestRegistrations)
    .where(whereClause)

  const byCategoryRows = await database
    .select({
      category: robofestRegistrations.category,
      members: sql<number>`coalesce(sum(${PARTICIPANT_SQL}), 0)`,
    })
    .from(robofestRegistrations)
    .where(whereClause)
    .groupBy(robofestRegistrations.category)

  const byAgeRows = await database
    .select({
      ageCategory: robofestRegistrations.ageCategory,
      members: sql<number>`coalesce(sum(${PARTICIPANT_SQL}), 0)`,
    })
    .from(robofestRegistrations)
    .where(
      and(
        whereClause,
        sql`${robofestRegistrations.ageCategory} is not null`,
        sql`${robofestRegistrations.ageCategory} != ''`,
      ),
    )
    .groupBy(robofestRegistrations.ageCategory)

  return {
    registrations: Number(totals?.registrations ?? 0),
    total: Number(totals?.total ?? 0),
    paidTotal: Number(totals?.paidTotal ?? 0),
    paidCount: Number(totals?.paidCount ?? 0),
    byCategory: byCategoryRows
      .filter((r) => r.category)
      .map((r) => [String(r.category), Number(r.members ?? 0)] as [string, number]),
    byAge: byAgeRows
      .filter((r) => r.ageCategory)
      .map((r) => [String(r.ageCategory), Number(r.members ?? 0)] as [string, number]),
  }
}

export async function queryRobofestCampusAmbassadorReferralCounts(): Promise<
  Record<string, { teams: number; members: number }>
> {
  const database = await getDb()
  const rows = await database
    .select({
      campusAmbassadorId: robofestRegistrations.campusAmbassadorId,
      teams: sql<number>`count(*)`,
      members: sql<number>`coalesce(sum(${PARTICIPANT_SQL}), 0)`,
    })
    .from(robofestRegistrations)
    .where(
      and(
        eq(robofestRegistrations.status, 'confirmed'),
        sql`${robofestRegistrations.campusAmbassadorId} is not null`,
        sql`${robofestRegistrations.campusAmbassadorId} != ''`,
      ),
    )
    .groupBy(robofestRegistrations.campusAmbassadorId)

  const counts: Record<string, { teams: number; members: number }> = {}
  for (const row of rows) {
    if (!row.campusAmbassadorId) continue
    counts[row.campusAmbassadorId] = {
      teams: Number(row.teams ?? 0),
      members: Number(row.members ?? 0),
    }
  }
  return counts
}
