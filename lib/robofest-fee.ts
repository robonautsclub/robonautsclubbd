/** Client-safe Robofest fee helpers (no firebase-admin). */

/** Default per-member fee when paid but amount is missing/zero. */
export const ROBOFEST_DEFAULT_FEE_PER_MEMBER_BDT = 300

/** Total registration fee for a team: per-member rate × team size (1–4). */
export function computeRobofestRegistrationTotal(
  perMemberAmount: number,
  teamSize: number,
): number {
  const members = Math.min(4, Math.max(1, Math.floor(Number(teamSize) || 1)))
  const unit = Math.max(0, Number(perMemberAmount) || 0)
  return unit * members
}
