/** Public contact anchor when a course has no valid detail page. */
export const COURSE_FALLBACK_HREF = "/about#contact";

/**
 * Course href values from the dashboard are often auto-generated as `/courses/{slug}`,
 * but no public course detail route exists. Fall back to contact instead of 404s.
 */
export function resolveCourseHref(href?: string | null): string {
  const trimmed = href?.trim() ?? "";
  if (!trimmed || trimmed === "#" || trimmed.startsWith("/courses/")) {
    return COURSE_FALLBACK_HREF;
  }
  return trimmed;
}

export function isResolvableCourseHref(href?: string | null): boolean {
  return resolveCourseHref(href) !== COURSE_FALLBACK_HREF || Boolean(href?.trim() && href !== "#" && !href.startsWith("/courses/"));
}
