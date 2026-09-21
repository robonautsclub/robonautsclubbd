import { collectionAdd } from '@/lib/db/collections'
import type { Session } from './auth'

/**
 * Helper function to create notifications for database changes
 * This is called from server actions to notify all admins/super admins
 */
export async function createNotification(
  type: string,
  message: string,
  session: Session,
  changes?: string[],
): Promise<void> {
  try {
    await collectionAdd('notifications', {
      type,
      message,
      userId: session.uid,
      userName: session.name,
      userEmail: session.email,
      changes: changes || [],
      readBy: [],
      createdAt: new Date().toISOString(),
    })
  } catch {
    // Silently fail - don't break the main operation if notification fails
  }
}
