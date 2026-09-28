'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
  canDownload: boolean
  sampleDownloading: boolean
  pending: boolean
  onDownloadSample: () => void
  onSave: () => void
}

export function CertificateEditorHeader({
  canDownload,
  sampleDownloading,
  pending,
  onDownloadSample,
  onSave,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Edit template</h2>
        <p className="text-sm text-slate-600">
          Preview as a finished PDF page, then switch to Edit placement when you
          need to move fields.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/dashboard/certificates">Back</Link>
        </Button>
        {canDownload ? (
          <Button
            type="button"
            variant="outline"
            disabled={sampleDownloading || pending}
            onClick={() => void onDownloadSample()}
          >
            {sampleDownloading ? 'Preparing…' : 'Download sample PDF'}
          </Button>
        ) : null}
        <Button
          type="button"
          className="bg-cyan-700 hover:bg-cyan-800 text-white"
          disabled={pending}
          onClick={onSave}
        >
          {pending ? 'Saving…' : 'Save template'}
        </Button>
      </div>
    </div>
  )
}
