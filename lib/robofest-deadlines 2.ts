import { isRegistrationClosedByDate } from "@/lib/dateUtils";
import type { RobofestContent } from "@/lib/robofest-content";

type RobofestDeadlineContent = Pick<
  RobofestContent,
  "rounds" | "registrationClosingDate"
>;

/**
 * Resolve the registration closing datetime for a division/city.
 * Prefers the round's own deadline; falls back to the legacy global
 * content.registrationClosingDate for unsaved CMS docs.
 */
export function resolveRobofestDivisionClosingDate(
  content: RobofestDeadlineContent,
  city: string,
): string | null {
  const normalized = city.trim().toLowerCase();
  const round = normalized
    ? (content.rounds || []).find(
        (r) => r.city.trim().toLowerCase() === normalized,
      )
    : undefined;
  const fromRound = round?.registrationClosingDate?.trim();
  if (fromRound) return fromRound;

  const global = content.registrationClosingDate?.trim();
  return global || null;
}

/** True when public registration for this division is past its deadline. */
export function isRobofestDivisionRegistrationClosed(
  content: RobofestDeadlineContent,
  city: string,
): boolean {
  return isRegistrationClosedByDate(
    resolveRobofestDivisionClosingDate(content, city) ?? undefined,
  );
}

/** True when every configured division has closed (or there are no rounds). */
export function areAllRobofestDivisionsClosed(
  content: RobofestDeadlineContent,
): boolean {
  const rounds = content.rounds || [];
  if (rounds.length === 0) {
    return isRegistrationClosedByDate(
      content.registrationClosingDate ?? undefined,
    );
  }
  return rounds.every((round) =>
    isRobofestDivisionRegistrationClosed(content, round.city),
  );
}
