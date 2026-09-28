export async function uploadCertificateImage(
  file: File,
  onUrl: (url: string) => void,
  setBusy: (v: boolean) => void,
  setError: (msg: string) => void,
) {
  setBusy(true)
  setError('')
  try {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('folder', 'certificates')
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Upload failed')
    onUrl(data.secure_url as string)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Upload failed')
  } finally {
    setBusy(false)
  }
}
