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

type FeeContentLike = {
  isPaid: boolean
  amount: number
  categories: Array<{ name: string; amount?: number | null; active?: boolean }>
}

/**
 * Resolve per-member fee: category override if set, else global amount when isPaid.
 * `amount` is always the fee **per team member**, not the team total.
 */
export function resolveRobofestFee(
  content: FeeContentLike,
  categoryName: string,
): { isPaid: boolean; amount: number } {
  const normalized = categoryName.trim().toLowerCase()
  const category = content.categories.find(
    (c) => c.name.trim().toLowerCase() === normalized && c.active !== false,
  )
  if (category?.amount != null && category.amount > 0) {
    return { isPaid: true, amount: category.amount }
  }
  if (content.isPaid) {
    return {
      isPaid: true,
      amount:
        content.amount > 0
          ? content.amount
          : ROBOFEST_DEFAULT_FEE_PER_MEMBER_BDT,
    }
  }
  return { isPaid: false, amount: 0 }
}
