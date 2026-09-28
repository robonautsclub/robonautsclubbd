'use client'

import type { Dispatch, SetStateAction } from 'react'
import type { RobofestContent } from '@/lib/robofest-content'
import { AwardCategoriesSection } from './AwardCategoriesSection'
import { CertificateTemplateAndSignaturesSections } from './CertificateTemplateAndSignaturesSections'

export function CertificateSections({
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
      <AwardCategoriesSection content={content} setContent={setContent} />
      <CertificateTemplateAndSignaturesSections
        content={content}
        setContent={setContent}
        pending={pending}
        uploadingSignatureId={uploadingSignatureId}
        setUploadingSignatureId={setUploadingSignatureId}
        setError={setError}
      />
    </>
  )
}
