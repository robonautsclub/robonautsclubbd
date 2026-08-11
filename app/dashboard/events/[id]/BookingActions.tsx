'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelBooking } from '../../actions'
import { Trash2, FileText, Award } from 'lucide-react'
import DeleteConfirmation from '../DeleteConfirmation'
import type { Booking } from '@/types/booking'
import type { Event } from '@/types/event'
import { Button } from '@/components/ui/button'
import { downloadPdfFromResponse } from '@/lib/downloadPdfBlob'

interface BookingActionsProps {
  booking: Booking
  event: Event
}

export default function BookingActions({ booking, event }: BookingActionsProps) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingCert, setDownloadingCert] = useState(false)

  const hasCertificateTemplate = Boolean(event.certificateTemplateId?.trim())

  const handleCancel = async () => {
    setDeleting(true)
    try {
      const result = await cancelBooking(booking.id)
      if (result.success) {
        setShowDeleteConfirm(false)
        router.refresh()
      } else {
        alert(result.error || 'Failed to cancel booking')
      }
    } catch (error) {
      console.error('Error canceling booking:', error)
      alert('An unexpected error occurred')
    } finally {
      setDeleting(false)
    }
  }

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true)
    try {
      const response = await fetch(
        `/api/dashboard/registrations/${booking.id}/pdf`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking, event }),
        },
      )
      await downloadPdfFromResponse(
        response,
        `Registration-Confirmation-${booking.registrationId || booking.id}.pdf`,
      )
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert(error instanceof Error ? error.message : 'Failed to download PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleDownloadCertificate = async () => {
    if (!hasCertificateTemplate) {
      alert('Assign a certificate template on this event first.')
      return
    }
    setDownloadingCert(true)
    try {
      const response = await fetch(
        `/api/dashboard/events/${event.id}/bookings/${booking.id}/certificate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking, event }),
        },
      )
      await downloadPdfFromResponse(
        response,
        `Certificate-${booking.registrationId || booking.id}.pdf`,
      )
    } catch (error) {
      console.error('Error downloading certificate:', error)
      alert(
        error instanceof Error ? error.message : 'Failed to download certificate',
      )
    } finally {
      setDownloadingCert(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={downloadingPdf}
          onClick={handleDownloadPdf}
          className="text-cyan-700 hover:text-cyan-800 hover:bg-cyan-50"
          title="Download confirmation PDF"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">
            {downloadingPdf ? '…' : 'PDF'}
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={downloadingCert || !hasCertificateTemplate}
          onClick={handleDownloadCertificate}
          className="text-cyan-700 hover:text-cyan-800 hover:bg-cyan-50"
          title={
            hasCertificateTemplate
              ? 'Download certificate'
              : 'Assign a certificate template on the event first'
          }
        >
          <Award className="w-4 h-4" />
          <span className="hidden sm:inline">
            {downloadingCert ? '…' : 'Cert'}
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Cancel booking"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Cancel</span>
        </Button>
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmation
          title="Cancel Booking"
          message="Are you sure you want to cancel this booking? This action cannot be undone."
          itemName={`${booking.name} - ${booking.email}`}
          onConfirm={handleCancel}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}
