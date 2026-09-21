const YMD = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Parse HTML date input (YYYY-MM-DD) to ISO string at UTC noon.
 */
export function parseDateInputToTimestamp(ymd: string | undefined): string | null {
  if (!ymd?.trim()) return null
  const m = ymd.trim().match(YMD)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const date = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0, 0))
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

/** Today as UTC date at noon (for server-side defaults). */
export function timestampUtcNoonToday(): string {
  const t = new Date()
  return new Date(
    Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 12, 0, 0, 0),
  ).toISOString()
}
