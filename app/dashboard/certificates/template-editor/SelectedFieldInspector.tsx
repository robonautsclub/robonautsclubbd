'use client'

import {
  CERTIFICATE_FIELD_LABELS,
  CERTIFICATE_FONT_FAMILIES,
  CERTIFICATE_FONT_FAMILY_LABELS,
  type CertificateField,
  type CertificateFontFamily,
} from '@/lib/certificate-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  isEdit: boolean
  selected: CertificateField | null
  uploadingSig: boolean
  onEnterEdit: () => void
  onUpdateField: (id: string, patch: Partial<CertificateField>) => void
  onUploadImage: (
    file: File,
    onUrl: (url: string) => void,
    setBusy: (v: boolean) => void,
  ) => void
  onSetUploadingSig: (v: boolean) => void
  onRemoveSelected: () => void
}

export function SelectedFieldInspector({
  isEdit,
  selected,
  uploadingSig,
  onEnterEdit,
  onUpdateField,
  onUploadImage,
  onSetUploadingSig,
  onRemoveSelected,
}: Props) {
  if (!isEdit) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-600">
          You’re in PDF preview. Fields look as they will on the certificate.
        </p>
        <Button
          type="button"
          size="sm"
          className="w-full bg-cyan-700 hover:bg-cyan-800 text-white"
          onClick={onEnterEdit}
        >
          Edit placement
        </Button>
      </div>
    )
  }

  if (!selected) {
    return (
      <p className="text-sm text-slate-500">
        Select a field on the canvas to edit its style.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-800">
        {CERTIFICATE_FIELD_LABELS[selected.key]}
      </p>
      {selected.key === 'staticText' ? (
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Label</label>
          <Input
            value={selected.label || ''}
            onChange={(e) =>
              onUpdateField(selected.id, { label: e.target.value })
            }
          />
          <label className="text-xs text-slate-500">Text</label>
          <Textarea
            rows={3}
            value={selected.staticValue || ''}
            onChange={(e) =>
              onUpdateField(selected.id, {
                staticValue: e.target.value,
              })
            }
          />
        </div>
      ) : selected.key === 'certificateTitle' ||
        selected.key === 'certificateBody' ||
        selected.key === 'awardLabel' ? (
        <p className="text-xs text-slate-500 rounded-md bg-slate-50 border border-slate-100 px-2 py-1.5">
          Filled at issue time from the recipient’s award: Achievement +
          position when they placed; Participation with no position
          otherwise.
        </p>
      ) : null}
      {selected.key === 'signatureImage' || selected.key === 'logoImage' ? (
        <div className="space-y-2">
          {selected.key === 'signatureImage' ? (
            <>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">
                  Signatory name
                </label>
                <Input
                  value={selected.staticValue || ''}
                  placeholder="e.g. Dr. A. Rahman"
                  onChange={(e) =>
                    onUpdateField(selected.id, {
                      staticValue: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">
                  Role / title
                </label>
                <Input
                  value={
                    selected.label &&
                    !/^signature(\s*\d+)?$/i.test(selected.label)
                      ? selected.label
                      : ''
                  }
                  placeholder="e.g. Director"
                  onChange={(e) =>
                    onUpdateField(selected.id, {
                      label: e.target.value || 'Signature',
                    })
                  }
                />
              </div>
              <p className="text-[11px] text-slate-500">
                For Robofest, Content → Certificate signatures fill these
                automatically if left empty.
              </p>
            </>
          ) : null}
          <div className="space-y-1">
            <label className="text-xs text-slate-500">
              {selected.key === 'logoImage'
                ? 'Logo image'
                : 'Signature image'}
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploadingSig}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) {
                  void onUploadImage(
                    file,
                    (url) =>
                      onUpdateField(selected.id, { imageUrl: url }),
                    onSetUploadingSig,
                  )
                }
              }}
            />
            {selected.imageUrl ? (
              <p className="text-[11px] text-slate-500 truncate">
                {selected.imageUrl}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      {selected.key === 'qrVerify' ? (
        <div className="space-y-2">
          <label className="text-xs text-slate-500">
            QR size (% of page width)
          </label>
          <input
            type="range"
            min={4}
            max={28}
            step={0.5}
            className="w-full"
            value={selected.wPct}
            onChange={(e) =>
              onUpdateField(selected.id, {
                wPct: Number(e.target.value) || 8,
              })
            }
          />
          <div className="flex items-center justify-between gap-2">
            <Input
              type="number"
              min={4}
              max={28}
              step={0.5}
              value={Math.round(selected.wPct * 10) / 10}
              onChange={(e) =>
                onUpdateField(selected.id, {
                  wPct: Math.min(
                    28,
                    Math.max(4, Number(e.target.value) || 8),
                  ),
                })
              }
            />
            <span className="text-xs text-slate-500 shrink-0">
              Drag the handle on the canvas to resize too
            </span>
          </div>
        </div>
      ) : null}
      {selected.key !== 'qrVerify' &&
      selected.key !== 'signatureImage' &&
      selected.key !== 'logoImage' ? (
        <>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Font</label>
            <select
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
              value={selected.fontFamily || 'Helvetica'}
              onChange={(e) =>
                onUpdateField(selected.id, {
                  fontFamily: e.target.value as CertificateFontFamily,
                })
              }
            >
              {CERTIFICATE_FONT_FAMILIES.map((family) => (
                <option key={family} value={family}>
                  {CERTIFICATE_FONT_FAMILY_LABELS[family]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">
                Font size (pt)
              </label>
              <Input
                type="number"
                min={6}
                max={72}
                value={selected.fontSizePt}
                onChange={(e) =>
                  onUpdateField(selected.id, {
                    fontSizePt: Number(e.target.value) || 12,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Weight</label>
              <select
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                value={selected.fontWeight}
                onChange={(e) =>
                  onUpdateField(selected.id, {
                    fontWeight:
                      e.target.value === 'bold' ? 'bold' : 'normal',
                  })
                }
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Color</label>
              <Input
                type="color"
                value={selected.color}
                onChange={(e) =>
                  onUpdateField(selected.id, { color: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Align</label>
              <select
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                value={selected.align}
                onChange={(e) =>
                  onUpdateField(selected.id, {
                    align: e.target.value as CertificateField['align'],
                  })
                }
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </>
      ) : null}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-slate-500">X%</label>
          <Input
            type="number"
            step={0.01}
            value={Number(selected.xPct.toFixed(2))}
            onChange={(e) =>
              onUpdateField(selected.id, {
                xPct: Number(e.target.value) || 0,
              })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Y%</label>
          <Input
            type="number"
            step={0.01}
            value={Number(selected.yPct.toFixed(2))}
            onChange={(e) =>
              onUpdateField(selected.id, {
                yPct: Number(e.target.value) || 0,
              })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">W%</label>
          <Input
            type="number"
            step={0.01}
            value={Number(selected.wPct.toFixed(2))}
            onChange={(e) =>
              onUpdateField(selected.id, {
                wPct: Number(e.target.value) || 10,
              })
            }
          />
        </div>
      </div>
      <p className="text-[11px] text-slate-500">
        Drag freely, or use arrow keys (0.1%) — hold Shift for 1%
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="text-red-600 border-red-200 w-full"
        onClick={onRemoveSelected}
      >
        Remove field
      </Button>
      <p className="text-[11px] text-slate-500">
        Or press Delete / Backspace
      </p>
    </div>
  )
}
