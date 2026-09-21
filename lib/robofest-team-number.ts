/**
 * Auto-assigned Robofest team numbers: BS#001, BA#001, LF#001, RE#001.
 */

import { allocateTeamNumber } from '@/lib/db/collections'

export const ROBOFEST_TEAM_COUNTERS_COLLECTION = 'robofestTeamCounters'

const PREFIX_BY_KEY: Record<string, string> = {
  bottlesumo: 'BS',
  'bottle sumo': 'BS',
  'bottle-sumo': 'BS',
  buildathon: 'BA',
  'line-following-bot': 'LF',
  'line following bot': 'LF',
  'line-following bot': 'LF',
  'robo-exhibition': 'RE',
  'robo exhibition': 'RE',
  'robo-exhibition competition': 'RE',
}

export function getRobofestTeamNumberPrefix(category: string): string | null {
  const key = category.trim().toLowerCase()
  if (!key) return null
  if (PREFIX_BY_KEY[key]) return PREFIX_BY_KEY[key]

  if (key.includes('bottlesumo') || key.includes('bottle sumo')) return 'BS'
  if (key.includes('buildathon') || key.includes('build athon')) return 'BA'
  if (key.includes('line-following') || key.includes('line following')) return 'LF'
  if (key.includes('robo-exhibition') || key.includes('robo exhibition')) return 'RE'

  return null
}

export function formatRobofestTeamNumber(prefix: string, sequence: number): string {
  return `${prefix}#${String(sequence).padStart(3, '0')}`
}

/**
 * Atomically allocate the next team number for a competition category.
 * Returns null if the category has no known prefix.
 */
export async function allocateRobofestTeamNumber(category: string): Promise<string | null> {
  const prefix = getRobofestTeamNumberPrefix(category)
  if (!prefix) return null

  try {
    const sequence = await allocateTeamNumber(prefix)
    return formatRobofestTeamNumber(prefix, sequence)
  } catch {
    return null
  }
}
