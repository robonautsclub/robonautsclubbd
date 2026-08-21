'use client'

import type { Dispatch, SetStateAction } from 'react'
import type { RobofestContent } from '@/lib/robofest-content'
import { TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { EventBasicsSections } from './content/EventBasicsSections'
import { CompetitionsSections } from './content/CompetitionsSections'
import { CertificateSections } from './content/CertificateSections'

export function RobofestContentTab({
  message,
  error,
  content,
  setContent,
  pending,
  canEdit,
  saveContent,
  resetContent,
  uploadingSignatureId,
  setUploadingSignatureId,
  setError,
}: {
  message: string
  error: string
  content: RobofestContent
  setContent: Dispatch<SetStateAction<RobofestContent>>
  pending: boolean
  canEdit: boolean
  saveContent: () => void
  resetContent: () => void
  uploadingSignatureId: string | null
  setUploadingSignatureId: (id: string | null) => void
  setError: (error: string) => void
}) {
  return (
    <TabsContent value="content" className="space-y-4">
      {(message || error) && (
        <p className={`text-sm ${error ? 'text-red-600' : 'text-green-700'}`}>
          {error || message}
        </p>
      )}

      <EventBasicsSections content={content} setContent={setContent} />
      <CompetitionsSections content={content} setContent={setContent} />
      <CertificateSections
        content={content}
        setContent={setContent}
        pending={pending}
        uploadingSignatureId={uploadingSignatureId}
        setUploadingSignatureId={setUploadingSignatureId}
        setError={setError}
      />

      <div className="flex flex-wrap gap-3">
        {canEdit ? (
          <>
            <Button type="button" onClick={saveContent} disabled={pending}>
              {pending ? 'Saving…' : 'Save content'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetContent}
              disabled={pending}
            >
              Reset to defaults
            </Button>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            View only — you do not have permission to edit Robofest content.
          </p>
        )}
      </div>
    </TabsContent>
  )
}
