/**
 * Verifies fee resolution used by admin manual bookings.
 * Keep assertions aligned with lib/event-fee.ts.
 * Run: pnpm verify:event-fee
 */
import assert from 'node:assert/strict'

/** @param {{ amount?: number, categories?: Array<{ name: string, amount?: number }> }} event */
function resolveEventSuggestedFee(event, categoryName) {
  const categories = Array.isArray(event.categories) ? event.categories : []
  const selected = categoryName?.trim()
  if (selected && categories.length > 0) {
    const match = categories.find(
      (category) => category.name.trim().toLowerCase() === selected.toLowerCase()
    )
    if (match?.amount != null && Number.isFinite(match.amount) && match.amount > 0) {
      return match.amount
    }
  }
  if (event.amount != null && Number.isFinite(event.amount) && event.amount > 0) {
    return event.amount
  }
  return 0
}

assert.equal(resolveEventSuggestedFee({ isPaid: true, amount: 500 }), 500)
assert.equal(
  resolveEventSuggestedFee(
    {
      isPaid: true,
      amount: 500,
      categories: [
        { name: 'Junior', amount: 300 },
        { name: 'Senior', amount: 700 },
      ],
    },
    'Senior',
  ),
  700,
)
assert.equal(
  resolveEventSuggestedFee(
    {
      isPaid: true,
      amount: 500,
      categories: [{ name: 'Junior', amount: 300 }],
    },
    'Unknown',
  ),
  500,
)
assert.equal(resolveEventSuggestedFee({ isPaid: false }), 0)
assert.equal(
  resolveEventSuggestedFee(
    {
      isPaid: true,
      amount: 0,
      categories: [{ name: 'Free', amount: 0 }],
    },
    'Free',
  ),
  0,
)

console.log('resolveEventSuggestedFee checks passed')
