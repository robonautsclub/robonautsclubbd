'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface CopyButtonProps {
  text: string
  label: string
}

export default function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Copy failed
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`ml-2 p-1.5 rounded-lg transition-all duration-200 group ${
        copied 
          ? 'bg-green-100 text-green-700' 
          : 'hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700'
      }`}
      title={copied ? 'Copied!' : `Copy ${label}`}
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <Check className="w-4 h-4" />
      ) : (
        <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
      )}
    </button>
  )
}

