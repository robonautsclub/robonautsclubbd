/** Round to 2 decimal places and clamp into [min, max]. */
export function clampPct(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value * 100) / 100))
}
