'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelBooking, resendBookingEmail } from '../../actions'
import { Trash2, FileText, Award, Mail } from 'lucide-react'
import DeleteConfirmation from '../DeleteConfirmation'
import type { Booking } from '@/types/booking'
import type { Event } from '@/types/event'
import { Button } from '@/components/ui/button'
import { downloadPdfFromResponse } from '@/lib/downloadPdfBlob'

interface BookingActionsProps {
  booking: Booking
  event: Event
  canCancel?: boolean
  canDownloadPdf?: boolean
  canSendMail?: boolean
  onChanged?: () => void
}

export default function BookingActions({
  booking,
  event,
  canCancel = false,
  canDownloadPdf = false,
  canSendMail = false,
  onChanged,
}: BookingActionsProps) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingCert, setDownloadingCert] = useState(false)
  const [sendingMail, setSendingMail] = useState(false)

  const hasCertificateTemplate = Boolean(event.certificateTemplateId?.trim())
  const sendCount = booking.emailSendCount ?? 0

  const refresh = () => {
    onChanged?.()
    router.refresh()
  }

  const handleCancel = async () => {
    setDeleting(true)
    try {
      const result = await cancelBooking(booking.id)
      if (result.success) {
        setShowDeleteConfirm(false)
        refresh()
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

  const handleResendEmail = async () => {
    setSendingMail(true)
    try {
      const result = await resendBookingEmail(booking.id)
      if (!result.success) {
        alert(result.error || 'Failed to send confirmation email')
        return
      }
      const count = result.emailSendCount ?? sendCount + 1
      alert(
        result.warning ||
          `Confirmation email sent${count > 0 ? ` (send #${count})` : ''}.`,
      )
      refresh()
    } catch (error) {
      console.error('Error resending confirmation email:', error)
      alert('An unexpected error occurred')
    } finally {
      setSendingMail(false)
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
        {canSendMail && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={sendingMail || !booking.registrationId || !booking.email}
            onClick={() => void handleResendEmail()}
            className="relative text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 gap-1"
            title={
              sendCount > 0
                ? `Email sent ${sendCount} time${sendCount === 1 ? '' : 's'} — click to resend`
                : 'Send confirmation email'
            }
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">{sendingMail ? '…' : 'Email'}</span>
            {sendCount > 0 ? (
              <span className="inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold leading-none text-white">
                {sendCount}
              </span>
            ) : null}
          </Button>
        )}
        {canDownloadPdf && (
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
        )}
        {canDownloadPdf && (
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
        )}
        {canCancel && (
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
        )}
      </div>

      {showDeleteConfirm && canCancel && (
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
