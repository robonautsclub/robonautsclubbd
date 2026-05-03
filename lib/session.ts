/**
 * Session duration constants. Safe to import from client and server.
 * Used for cookie max-age and client-side session timers.
 */
export const SESSION_DURATION_SECONDS = 30 * 60
export const SESSION_DURATION_MS = SESSION_DURATION_SECONDS * 1000

/** Throttle `/api/auth/assign-role` calls after a successful sync (client-only). */
export const ASSIGN_ROLE_LAST_SYNC_STORAGE_KEY = 'rb-assign-role-synced-at'
export const ASSIGN_ROLE_MIN_SYNC_INTERVAL_MS = 25 * 60 * 1000
