import { CUSTOM_FORM_FIELD_TYPES, type EventCustomFormField, type CustomFormFieldType } from '@/types/event'

type CustomAnswers = Record<string, string | string[] | number | null | undefined>

const ALLOWED_TYPES = new Set<CustomFormFieldType>(CUSTOM_FORM_FIELD_TYPES)

function normalizeFieldId(candidate: string, index: number): string {
  const cleaned = candidate.trim().replace(/[^a-zA-Z0-9_-]/g, '')
  return cleaned || `custom_field_${index + 1}`
}

export function normalizeCustomFormFields(fields: EventCustomFormField[] | undefined): EventCustomFormField[] {
  if (!Array.isArray(fields)) return []

  const usedIds = new Set<string>()
  const normalized: EventCustomFormField[] = []

  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index]
    if (!field || typeof field.label !== 'string') continue

    const label = field.label.trim()
    if (!label) continue

    const rawType = field.type
    const type = ALLOWED_TYPES.has(rawType) ? rawType : 'shortText'
    const required = Boolean(field.required)
    const placeholder = typeof field.placeholder === 'string' ? field.placeholder.trim() : ''
    const options =
      type === 'select' || type === 'radio' || type === 'checkbox'
        ? (field.options ?? []).map((option) => option.trim()).filter((option) => option.length > 0)
        : []

    if ((type === 'select' || type === 'radio' || type === 'checkbox') && options.length === 0) {
      continue
    }

    const baseId = normalizeFieldId(field.id || '', index)
    let id = baseId
    let duplicateCounter = 1
    while (usedIds.has(id)) {
      id = `${baseId}_${duplicateCounter}`
      duplicateCounter += 1
    }
    usedIds.add(id)

    normalized.push({
      id,
      label,
      type,
      required,
      ...(placeholder ? { placeholder } : {}),
      ...((type === 'select' || type === 'radio' || type === 'checkbox') && options.length > 0 ? { options } : {}),
    })
  }

  return normalized
}

export function validateCustomFormAnswers(
  fields: EventCustomFormField[] | undefined,
  answers: CustomAnswers | undefined
): string | null {
  const normalizedFields = normalizeCustomFormFields(fields)
  const submittedAnswers = answers ?? {}

  for (const field of normalizedFields) {
    const value = submittedAnswers[field.id]
    const isChoice = field.type === 'select' || field.type === 'radio' || field.type === 'checkbox'
    const isMissing =
      value == null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0)

    if (field.required && isMissing) {
      return `${field.label} is required.`
    }

    if (isMissing) continue

    if (field.type === 'number') {
      const numeric = typeof value === 'number' ? value : Number(String(value))
      if (!Number.isFinite(numeric)) {
        return `${field.label} must be a valid number.`
      }
      continue
    }

    if (field.type === 'email') {
      const email = String(value).trim()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return `${field.label} must be a valid email address.`
      }
      continue
    }

    if (field.type === 'phone') {
      const phone = String(value).trim().replace(/\s/g, '')
      if (phone.length !== 11 || !phone.startsWith('01')) {
        return `${field.label} must be 11 digits and start with 01.`
      }
      continue
    }

    if (isChoice) {
      const validOptions = new Set((field.options ?? []).map((option) => option.toLowerCase()))
      if (field.type === 'checkbox') {
        const selected = Array.isArray(value) ? value : [String(value)]
        const hasInvalid = selected.some((option) => !validOptions.has(String(option).trim().toLowerCase()))
        if (hasInvalid) {
          return `${field.label} contains an invalid option.`
        }
      } else {
        if (!validOptions.has(String(value).trim().toLowerCase())) {
          return `${field.label} contains an invalid option.`
        }
      }
    }
  }

  return null
}

export function normalizeCustomFormAnswers(
  fields: EventCustomFormField[] | undefined,
  answers: CustomAnswers | undefined
): Record<string, string | string[] | number> {
  const normalizedFields = normalizeCustomFormFields(fields)
  const submittedAnswers = answers ?? {}
  const normalizedAnswers: Record<string, string | string[] | number> = {}

  for (const field of normalizedFields) {
    const rawValue = submittedAnswers[field.id]
    if (rawValue == null) continue

    if (field.type === 'checkbox') {
      const selected = (Array.isArray(rawValue) ? rawValue : [rawValue])
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0)
      if (selected.length > 0) {
        normalizedAnswers[field.id] = selected
      }
      continue
    }

    if (field.type === 'number') {
      const numeric = typeof rawValue === 'number' ? rawValue : Number(String(rawValue))
      if (Number.isFinite(numeric)) {
        normalizedAnswers[field.id] = numeric
      }
      continue
    }

    const textValue = String(rawValue).trim()
    if (textValue.length > 0) {
      normalizedAnswers[field.id] = textValue
    }
  }

  return normalizedAnswers
}
