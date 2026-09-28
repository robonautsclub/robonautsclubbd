export const ROBOFEST_PAGE_SIZE_OPTIONS = [10, 20, 50] as const

export type RobofestPageSize = (typeof ROBOFEST_PAGE_SIZE_OPTIONS)[number]
