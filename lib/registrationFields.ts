import type { Event, EventDefaultRegistrationFields } from '@/types/event'

type RegistrationFieldInput = Partial<{
  school: Partial<EventDefaultRegistrationFields['school']>
  category: Partial<EventDefaultRegistrationFields['category']>
  information: Partial<EventDefaultRegistrationFields['information']>
}>

const CORE_FIELDS = {
  name: { enabled: true as const, required: true as const },
  email: { enabled: true as const, required: true as const },
  phone: { enabled: true as const, required: true as const },
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

export function normalizeDefaultRegistrationFields(
  config: RegistrationFieldInput | Event['defaultRegistrationFields'] | undefined,
  options?: { hasCategories?: boolean }
): EventDefaultRegistrationFields {
  const hasCategories = Boolean(options?.hasCategories)

  const schoolConfig = config?.school
  const categoryConfig = config?.category
  const informationConfig = config?.information

  return {
    ...CORE_FIELDS,
    school: {
      enabled: toBoolean(schoolConfig?.enabled, true),
      required: toBoolean(schoolConfig?.required, true),
    },
    category: {
      enabled: hasCategories ? true : toBoolean(categoryConfig?.enabled, true),
      required: hasCategories ? true : toBoolean(categoryConfig?.required, false),
    },
    information: {
      enabled: toBoolean(informationConfig?.enabled, true),
      required: toBoolean(informationConfig?.required, false),
    },
  }
}

export function getEventRegistrationFields(event: Event): EventDefaultRegistrationFields {
  const hasCategories = Array.isArray(event.categories) && event.categories.length > 0
  return normalizeDefaultRegistrationFields(event.defaultRegistrationFields, { hasCategories })
}
