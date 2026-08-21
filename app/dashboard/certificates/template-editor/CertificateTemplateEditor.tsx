'use client'

import { cn } from '@/lib/utils'
import {
  useCertificateTemplateEditor,
  type CertificateTemplateEditorProps,
} from './useCertificateTemplateEditor'
import { CertificateEditorHeader } from './CertificateEditorHeader'
import { CertificateCanvas } from './CertificateCanvas'
import { AddFieldsPanel } from './AddFieldsPanel'
import { TemplateMetaSidebar } from './TemplateMetaSidebar'
import { SelectedFieldInspector } from './SelectedFieldInspector'

export type { CertificateTemplateEditorProps }

export default function CertificateTemplateEditor(
  props: CertificateTemplateEditorProps,
) {
  const editor = useCertificateTemplateEditor(props)

  return (
    <div className="space-y-4">
      <CertificateEditorHeader
        canDownload={editor.canDownload}
        sampleDownloading={editor.sampleDownloading}
        pending={editor.pending}
        onDownloadSample={editor.downloadSample}
        onSave={editor.save}
      />

      {(editor.error || editor.message) && (
        <p
          className={cn(
            'text-sm rounded-md px-3 py-2 border',
            editor.error
              ? 'text-red-600 bg-red-50 border-red-100'
              : 'text-emerald-700 bg-emerald-50 border-emerald-100',
          )}
        >
          {editor.error || editor.message}
        </p>
      )}

      <div className="grid lg:grid-cols-[1fr_300px] gap-4 items-start">
        <div className="space-y-3">
          <CertificateCanvas
            name={editor.name}
            layout={editor.layout}
            backgroundUrl={editor.backgroundUrl}
            fields={editor.fields}
            selectedId={editor.selectedId}
            isEdit={editor.isEdit}
            showSample={editor.showSample}
            sample={editor.sample}
            canvasRef={editor.canvasRef}
            mode={editor.mode}
            onModePreview={editor.enterPreviewMode}
            onModeEdit={() => editor.setMode('edit')}
            onShowSampleChange={editor.setShowSample}
            onPointerMove={editor.onPointerMove}
            onPointerUp={editor.onPointerUp}
            onCanvasPointerDown={() => {
              if (editor.isEdit) editor.setSelectedId(null)
            }}
            onPointerDownField={editor.onPointerDownField}
          />

          <AddFieldsPanel
            isEdit={editor.isEdit}
            fieldsLength={editor.fields.length}
            staticFields={editor.staticFields}
            selectedId={editor.selectedId}
            onResetToStandardLayout={editor.resetToStandardLayout}
            onRemoveAllFields={editor.removeAllFields}
            onAddField={editor.addField}
            onSelectField={editor.setSelectedId}
            onUpdateField={editor.updateField}
          />
        </div>

        <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sticky top-4">
          <TemplateMetaSidebar
            name={editor.name}
            description={editor.description}
            layout={editor.layout}
            uploadingBg={editor.uploadingBg}
            onNameChange={editor.setName}
            onDescriptionChange={editor.setDescription}
            onLayoutChange={editor.setLayout}
            onBackgroundFile={(file) => {
              void editor.uploadImage(
                file,
                editor.setBackgroundUrl,
                editor.setUploadingBg,
              )
            }}
          />

          <hr className="border-slate-100" />

          <SelectedFieldInspector
            isEdit={editor.isEdit}
            selected={editor.selected}
            uploadingSig={editor.uploadingSig}
            onEnterEdit={() => editor.setMode('edit')}
            onUpdateField={editor.updateField}
            onUploadImage={editor.uploadImage}
            onSetUploadingSig={editor.setUploadingSig}
            onRemoveSelected={editor.removeSelected}
          />
        </aside>
      </div>
    </div>
  )
}
