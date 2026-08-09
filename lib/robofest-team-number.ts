/**
 * Auto-assigned Robofest team numbers: BS#001, BA#001, LF#001, RE#001.
 */

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

export const ROBOFEST_TEAM_COUNTERS_COLLECTION = "robofestTeamCounters";

const PREFIX_BY_KEY: Record<string, string> = {
  bottlesumo: "BS",
  "bottle sumo": "BS",
  "bottle-sumo": "BS",
  buildathon: "BA",
  "line-following-bot": "LF",
  "line following bot": "LF",
  "line-following bot": "LF",
  "robo-exhibition": "RE",
  "robo exhibition": "RE",
  "robo-exhibition competition": "RE",
};

export function getRobofestTeamNumberPrefix(
  category: string,
): string | null {
  const key = category.trim().toLowerCase();
  if (!key) return null;
  if (PREFIX_BY_KEY[key]) return PREFIX_BY_KEY[key];

  // Loose match for CMS display names like "BuildAthon"
  if (key.includes("bottlesumo") || key.includes("bottle sumo")) return "BS";
  if (key.includes("buildathon") || key.includes("build athon")) return "BA";
  if (key.includes("line-following") || key.includes("line following"))
    return "LF";
  if (key.includes("robo-exhibition") || key.includes("robo exhibition"))
    return "RE";

  return null;
}

export function formatRobofestTeamNumber(
  prefix: string,
  sequence: number,
): string {
  return `${prefix}#${String(sequence).padStart(3, "0")}`;
}

/**
 * Atomically allocate the next team number for a competition category.
 * Returns null if the category has no known prefix or Firestore is unavailable.
 */
export async function allocateRobofestTeamNumber(
  category: string,
): Promise<string | null> {
  const prefix = getRobofestTeamNumberPrefix(category);
  if (!prefix || !adminDb) return null;

  const counterRef = adminDb
    .collection(ROBOFEST_TEAM_COUNTERS_COLLECTION)
    .doc(prefix);

  const sequence = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const current =
      snap.exists && typeof snap.data()?.next === "number"
        ? (snap.data()!.next as number)
        : 1;
    const next = current + 1;
    tx.set(
      counterRef,
      {
        prefix,
        next,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return current;
  });

  return formatRobofestTeamNumber(prefix, sequence);
}
