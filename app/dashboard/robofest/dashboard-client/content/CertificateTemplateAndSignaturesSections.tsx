'use client'

import { Award } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import type { RobofestContent } from '@/lib/robofest-content'
import {
  ROBOFEST_MAX_CERTIFICATE_SIGNATURES,
  getDefaultCertificateSignatures,
  type RobofestCertificateSignature,
} from '@/lib/robofest-certificate-signatures'
import CertificateTemplateSelect from '@/app/dashboard/events/CertificateTemplateSelect'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ContentSection } from '../ContentSection'

export function CertificateTemplateAndSignaturesSections({
  content,
  setContent,
  pending,
  uploadingSignatureId,
  setUploadingSignatureId,
  setError,
}: {
  content: RobofestContent
  setContent: Dispatch<SetStateAction<RobofestContent>>
  pending: boolean
  uploadingSignatureId: string | null
  setUploadingSignatureId: (id: string | null) => void
  setError: (error: string) => void
}) {
  return (
    <>
      <ContentSection
        title="Certificate template"
        description="Optional background template from Certificates. When set, downloads use that artwork instead of the built-in Robofest design."
        icon={<Award className="w-4 h-4 text-cyan-500" />}
        contentClassName="space-y-2"
      >
        <CertificateTemplateSelect
          value={content.certificateTemplateId || ''}
          onChange={(v) =>
            setContent((prev) => ({
              ...prev,
              certificateTemplateId: v || null,
            }))
          }
          disabled={pending}
        />
      </ContentSection>

      <ContentSection
        title="Certificate signatures"
        description="Add up to 4 signatories (name, role/title, optional signature image). They auto-arrange on certificates."
        icon={<Award className="w-4 h-4 text-cyan-500" />}
        contentClassName="space-y-3"
      >
        {(() => {
          const signatures =
            content.certificateSignatures?.length
              ? content.certificateSignatures
              : getDefaultCertificateSignatures(content.hostName)

          const ensureList = (
            prev: RobofestContent,
          ): RobofestCertificateSignature[] =>
            prev.certificateSignatures?.length
              ? [...prev.certificateSignatures]
              : getDefaultCertificateSignatures(prev.hostName)

          return (
            <>
              {signatures.map((sig, index) => {
                const updateSig = (
                  patch: Partial<RobofestCertificateSignature> & {
                    clearImage?: boolean
                  },
                ) => {
                  setContent((prev) => {
                    const list = ensureList(prev)
                    const next = { ...list[index], ...patch }
                    if (patch.clearImage || patch.imageUrl === '') {
                      delete next.imageUrl
                      delete (next as { clearImage?: boolean }).clearImage
                    }
                    list[index] = next
                    return { ...prev, certificateSignatures: list }
                  })
                }
                return (
                  <div
                    key={sig.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-600">
                        Signature {index + 1}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200"
                        disabled={signatures.length <= 1}
                        onClick={() => {
                          setContent((prev) => ({
                            ...prev,
                            certificateSignatures: ensureList(prev).filter(
                              (s) => s.id !== sig.id,
                            ),
                          }))
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">Name</label>
                        <Input
                          value={sig.name}
                          onChange={(e) =>
                            updateSig({ name: e.target.value })
                          }
                          placeholder="Signatory name"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">
                          Title / position
                        </label>
                        <Input
                          value={sig.title}
                          onChange={(e) =>
                            updateSig({ title: e.target.value })
                          }
                          placeholder="e.g. Head Judge"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">
                        Signature image (optional)
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        {sig.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary preview
                          <img
                            src={sig.imageUrl}
                            alt={`${sig.name || 'Signature'} preview`}
                            className="h-12 max-w-[160px] object-contain rounded border border-slate-200 bg-white px-2"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">
                            No image — blank line on certificate
                          </span>
                        )}
                        <label
                          className={cn(
                            'inline-flex h-8 cursor-pointer items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50',
                            (uploadingSignatureId === sig.id || pending) &&
                              'pointer-events-none opacity-50',
                          )}
                        >
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="hidden"
                            disabled={
                              uploadingSignatureId === sig.id || pending
                            }
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              e.target.value = ''
                              if (!file) return
                              setUploadingSignatureId(sig.id)
                              setError('')
                              try {
                                const formData = new FormData()
                                formData.append('image', file)
                                formData.append('folder', 'robofest')
                                const response = await fetch(
                                  '/api/upload-image',
                                  {
                                    method: 'POST',
                                    body: formData,
                                  },
                                )
                                const data = await response.json()
                                if (!response.ok) {
                                  throw new Error(
                                    data.error ||
                                      'Failed to upload signature',
                                  )
                                }
                                updateSig({
                                  imageUrl: data.secure_url as string,
                                })
                              } catch (err) {
                                setError(
                                  err instanceof Error
                                    ? err.message
                                    : 'Failed to upload signature image.',
                                )
                              } finally {
                                setUploadingSignatureId(null)
                              }
                            }}
                          />
                          {uploadingSignatureId === sig.id
                            ? 'Uploading…'
                            : sig.imageUrl
                              ? 'Replace image'
                              : 'Upload image'}
                        </label>
                        {sig.imageUrl ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => updateSig({ clearImage: true })}
                          >
                            Clear image
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}

              <Button
                type="button"
                size="sm"
                className="bg-cyan-700 hover:bg-cyan-800 text-white"
                disabled={
                  signatures.length >= ROBOFEST_MAX_CERTIFICATE_SIGNATURES
                }
                onClick={() => {
                  setContent((prev) => {
                    const existing = ensureList(prev)
                    if (
                      existing.length >= ROBOFEST_MAX_CERTIFICATE_SIGNATURES
                    ) {
                      return prev
                    }
                    return {
                      ...prev,
                      certificateSignatures: [
                        ...existing,
                        {
                          id: `sig-${Date.now().toString(36)}`,
                          name: '',
                          title: 'Signatory',
                        },
                      ],
                    }
                  })
                }}
              >
                Add signature
              </Button>
            </>
          )
        })()}
      </ContentSection>
    </>
  )
}
