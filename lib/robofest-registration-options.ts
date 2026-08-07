export type RobofestAgeCategory = 'explorer' | 'innovators'

export const ROBOFEST_AGE_CATEGORIES: Array<{
  value: RobofestAgeCategory
  label: string
}> = [
  { value: 'explorer', label: 'Explorer (Grades 05 – 08)' },
  { value: 'innovators', label: 'Innovators (Grades 09 – 12)' },
]

export const ROBOFEST_DIVISIONS: Array<{ value: string; label: string }> = [
  { value: 'Dhaka', label: 'Dhaka Division' },
  { value: 'Chittagong', label: 'Chittagong Division' },
]

export const ROBOFEST_GRADES_ALL = [
  'Grade - 05',
  'Grade - 06',
  'Grade - 07',
  'Grade - 08',
  'Grade - 09',
  'Grade - 10',
  'Grade - 11',
  'Grade - 12',
] as const

export const ROBOFEST_GRADES_BY_AGE: Record<
  RobofestAgeCategory,
  readonly string[]
> = {
  explorer: ['Grade - 05', 'Grade - 06', 'Grade - 07', 'Grade - 08'],
  innovators: ['Grade - 09', 'Grade - 10', 'Grade - 11', 'Grade - 12'],
}

export function getGradesForAgeCategory(
  ageCategory: RobofestAgeCategory | '',
): readonly string[] {
  if (ageCategory === 'explorer' || ageCategory === 'innovators') {
    return ROBOFEST_GRADES_BY_AGE[ageCategory]
  }
  return ROBOFEST_GRADES_ALL
}

export function isGradeAllowedForAgeCategory(
  grade: string,
  ageCategory: RobofestAgeCategory,
): boolean {
  return ROBOFEST_GRADES_BY_AGE[ageCategory].includes(grade)
}

export function formatAgeCategoryLabel(ageCategory: string): string {
  const found = ROBOFEST_AGE_CATEGORIES.find((c) => c.value === ageCategory)
  return found?.label ?? ageCategory
}
