/**
 * Trigger a browser download from a PDF fetch Response.
 */
export async function downloadPdfFromResponse(
  response: Response,
  fallbackFilename: string,
): Promise<void> {
  if (!response.ok) {
    let message = `PDF download failed (${response.status})`
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message)
  }

  const disposition = response.headers.get('Content-Disposition') || ''
  const match = /filename="?([^"]+)"?/i.exec(disposition)
  const filename = match?.[1] || fallbackFilename

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
