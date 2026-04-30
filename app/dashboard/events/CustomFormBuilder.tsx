'use client'

import { Plus, Trash2 } from 'lucide-react'
import { CUSTOM_FORM_FIELD_TYPES, type EventCustomFormField, type CustomFormFieldType } from '@/types/event'

type CustomFormBuilderProps = {
  fields: EventCustomFormField[]
  onChange: (fields: EventCustomFormField[]) => void
  disabled?: boolean
}

const FIELD_TYPE_LABELS: Record<CustomFormFieldType, string> = {
  shortText: 'Short text',
  longText: 'Long text',
  number: 'Number',
  email: 'Email',
  phone: 'Phone',
  select: 'Dropdown',
  radio: 'Multiple choice',
  checkbox: 'Checkboxes',
}

function createFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function requiresOptions(type: CustomFormFieldType): boolean {
  return type === 'select' || type === 'radio' || type === 'checkbox'
}

export default function CustomFormBuilder({ fields, onChange, disabled = false }: CustomFormBuilderProps) {
  const addField = () => {
    onChange([
      ...fields,
      {
        id: createFieldId(),
        label: '',
        type: 'shortText',
        required: false,
        placeholder: '',
        options: [],
      },
    ])
  }

  const updateField = (index: number, patch: Partial<EventCustomFormField>) => {
    const next = [...fields]
    const current = next[index]
    if (!current) return
    const updated = { ...current, ...patch }
    if (!requiresOptions(updated.type)) {
      updated.options = []
    }
    next[index] = updated
    onChange(next)
  }

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index))
  }

  const addOption = (fieldIndex: number) => {
    const target = fields[fieldIndex]
    if (!target) return
    updateField(fieldIndex, { options: [...(target.options ?? []), ''] })
  }

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const target = fields[fieldIndex]
    if (!target) return
    const options = [...(target.options ?? [])]
    options[optionIndex] = value
    updateField(fieldIndex, { options })
  }

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const target = fields[fieldIndex]
    if (!target) return
    const options = (target.options ?? []).filter((_, i) => i !== optionIndex)
    updateField(fieldIndex, { options })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-700">Custom Registration Fields</h4>
          <p className="text-xs text-gray-500">Build event-specific questions like Google Forms.</p>
        </div>
        <button
          type="button"
          onClick={addField}
          disabled={disabled}
          className="inline-flex items-center gap-2 px-3 py-2 border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add field
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-xs text-gray-500">
          No custom fields yet. Add one if you want to collect extra information from participants.
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, fieldIndex) => (
            <div key={field.id || fieldIndex} className="border-2 border-gray-200 rounded-xl p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Question label</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(fieldIndex, { label: e.target.value })}
                    placeholder="e.g. Guardian name"
                    disabled={disabled}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Input type</label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(fieldIndex, { type: e.target.value as CustomFormFieldType })}
                    disabled={disabled}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-sm"
                  >
                    {CUSTOM_FORM_FIELD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {FIELD_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Placeholder (optional)</label>
                  <input
                    type="text"
                    value={field.placeholder ?? ''}
                    onChange={(e) => updateField(fieldIndex, { placeholder: e.target.value })}
                    placeholder="e.g. Enter your answer"
                    disabled={disabled}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-sm"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 mt-6">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(fieldIndex, { required: e.target.checked })}
                    disabled={disabled}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Required
                </label>
              </div>

              {requiresOptions(field.type) && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600">Options</label>
                  {(field.options ?? []).map((option, optionIndex) => (
                    <div key={`${field.id}-option-${optionIndex}`} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(fieldIndex, optionIndex, e.target.value)}
                        placeholder={`Option ${optionIndex + 1}`}
                        disabled={disabled}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(fieldIndex, optionIndex)}
                        disabled={disabled}
                        className="px-3 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(fieldIndex)}
                    disabled={disabled}
                    className="px-3 py-2 border-2 border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Add option
                  </button>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => removeField(fieldIndex)}
                  disabled={disabled}
                  className="inline-flex items-center gap-2 px-3 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove question
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
