'use client'

import { Plus, Trash2 } from 'lucide-react'
import { CUSTOM_FORM_FIELD_TYPES, type EventCustomFormField, type CustomFormFieldType } from '@/types/event'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addField}
          disabled={disabled}
          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          <Plus className="w-4 h-4" />
          Add field
        </Button>
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
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-600">Question label</Label>
                  <Input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(fieldIndex, { label: e.target.value })}
                    placeholder="e.g. Guardian name"
                    disabled={disabled}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-600">Input type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(v) => updateField(fieldIndex, { type: v as CustomFormFieldType })}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOM_FORM_FIELD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {FIELD_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:items-end">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-600">Placeholder (optional)</Label>
                  <Input
                    type="text"
                    value={field.placeholder ?? ''}
                    onChange={(e) => updateField(fieldIndex, { placeholder: e.target.value })}
                    placeholder="e.g. Enter your answer"
                    disabled={disabled}
                    className="text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Checkbox
                    id={`custom-field-required-${field.id}`}
                    checked={field.required}
                    onCheckedChange={(v) => updateField(fieldIndex, { required: v === true })}
                    disabled={disabled}
                  />
                  <Label htmlFor={`custom-field-required-${field.id}`} className="text-sm font-normal text-gray-700">
                    Required
                  </Label>
                </div>
              </div>

              {requiresOptions(field.type) && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-600">Options</Label>
                  {(field.options ?? []).map((option, optionIndex) => (
                    <div key={`${field.id}-option-${optionIndex}`} className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(fieldIndex, optionIndex, e.target.value)}
                        placeholder={`Option ${optionIndex + 1}`}
                        disabled={disabled}
                        className="flex-1 text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(fieldIndex, optionIndex)}
                        disabled={disabled}
                        className="shrink-0 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(fieldIndex)}
                    disabled={disabled}
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    + Add option
                  </Button>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeField(fieldIndex)}
                  disabled={disabled}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove question
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
