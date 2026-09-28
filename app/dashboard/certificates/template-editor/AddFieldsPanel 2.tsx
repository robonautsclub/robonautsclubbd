'use client'

import {
  CERTIFICATE_DYNAMIC_FIELD_KEYS,
  CERTIFICATE_FIELD_LABELS,
  type CertificateField,
  type CertificateFieldKey,
} from '@/lib/certificate-templates'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type Props = {
  isEdit: boolean
  fieldsLength: number
  staticFields: CertificateField[]
  selectedId: string | null
  onResetToStandardLayout: () => void
  onRemoveAllFields: () => void
  onAddField: (key: CertificateFieldKey) => void
  onSelectField: (id: string) => void
  onUpdateField: (id: string, patch: Partial<CertificateField>) => void
}

export function AddFieldsPanel({
  isEdit,
  fieldsLength,
  staticFields,
  selectedId,
  onResetToStandardLayout,
  onRemoveAllFields,
  onAddField,
  onSelectField,
  onUpdateField,
}: Props) {
  if (!isEdit) {
    return (
      <p className="text-xs text-slate-500">
        Switch to <span className="font-medium text-slate-700">Edit placement</span>{' '}
        to drag fields, resize, or add new ones.
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-600">Add field</p>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-xs h-7"
            onClick={onResetToStandardLayout}
          >
            Reset to standard layout
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
            disabled={fieldsLength === 0}
            onClick={onRemoveAllFields}
          >
            Remove all
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Dynamic (from recipient / award)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CERTIFICATE_DYNAMIC_FIELD_KEYS.map((key) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant="outline"
              className="text-xs h-7"
              onClick={() => onAddField(key)}
            >
              {CERTIFICATE_FIELD_LABELS[key]}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Static copy
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-xs h-7"
          onClick={() => onAddField('staticText')}
        >
          Add appreciation / boilerplate text
        </Button>
      </div>
      {staticFields.length > 0 ? (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Edit static copy
          </p>
          {staticFields.map((field) => (
            <div key={field.id} className="space-y-1">
              <button
                type="button"
                className={cn(
                  'text-left text-xs font-medium w-full',
                  selectedId === field.id
                    ? 'text-cyan-700'
                    : 'text-slate-600 hover:text-slate-900',
                )}
                onClick={() => onSelectField(field.id)}
              >
                {field.label || 'Static text'}
              </button>
              <Textarea
                rows={2}
                value={field.staticValue || ''}
                placeholder="Appreciation or intro text…"
                onFocus={() => onSelectField(field.id)}
                onChange={(e) =>
                  onUpdateField(field.id, {
                    staticValue: e.target.value,
                  })
                }
              />
            </div>
          ))}
        </div>
      ) : null}
      <p className="text-[11px] text-slate-500">
        Default positions match the built-in Robofest certificate (right
        panel + club logo). Title and position still switch from the
        recipient’s award at issue time.
      </p>
    </div>
  )
}
