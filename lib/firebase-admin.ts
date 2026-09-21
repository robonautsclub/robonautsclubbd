/**
 * Cloudflare Worker runtime uses D1 (@/lib/db) — Firebase Admin is not initialized here.
 * Migration/import scripts may still use firebase-admin directly.
 */
export const adminAuth = undefined
export const adminDb = undefined
export const adminStorage = undefined
export default undefined
