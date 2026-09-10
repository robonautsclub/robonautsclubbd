'use client'

import { Download } from 'lucide-react'
import { useTransition } from 'react'
import { Booking } from '@/types/booking'
import { Button } from '@/components/ui/button'
import { getBookings } from '../../actions'

interface ExportBookingsButtonProps {
  eventId: string
  eventTitle: string
  /** When known (stats), used to hide the button if empty. Export always fetches full list. */
  totalCount?: number
  canExportExcel?: boolean
  canExportPdf?: boolean
  canViewPayments?: boolean
}

function formatPaymentStatus(booking: Booking): string {
  if (booking.paymentStatus === 'n/a') return 'n/a'
  if (booking.paymentStatus === 'paid') return 'paid'
  return booking.paymentStatus || 'unpaid'
}

export default function ExportBookingsButton({
  eventId,
  eventTitle,
  totalCount,
  canExportExcel = false,
  canExportPdf = false,
  canViewPayments = false,
}: ExportBookingsButtonProps) {
  const [isPending, startTransition] = useTransition()

  const formatBookedAt = (booking: Booking) => {
    let formattedDate = 'N/A'
    if (booking.createdAt) {
      try {
        const bookedDate =
          booking.createdAt instanceof Date
            ? booking.createdAt
            : new Date(booking.createdAt)
        if (!isNaN(bookedDate.getTime())) {
          formattedDate = bookedDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        }
      } catch {
        formattedDate = 'N/A'
      }
    }
    return formattedDate
  }

  const getSanitizedTitle = () =>
    eventTitle
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)

  const loadAllBookings = async () => {
    const bookings = await getBookings(eventId)
    if (bookings.length === 0) {
      throw new Error('No registrations to export.')
    }
    return bookings
  }

  const exportToExcel = () => {
    startTransition(() => {
      ;(async () => {
        try {
          const [XLSX, bookings] = await Promise.all([
            import('xlsx'),
            loadAllBookings(),
          ])

          const exportData = bookings.map((booking, index) => {
            const row: Record<string, string | number> = {
              'No.': index + 1,
              'Registration ID': booking.registrationId || 'N/A',
              Name: booking.name,
              Category: booking.category || 'Unspecified',
              School: booking.school,
              Email: booking.email,
              Phone: booking.phone || 'N/A',
            }
            if (canViewPayments) {
              row['Amount Paid (BDT)'] = booking.amountPaid ?? ''
              row['Payment Status'] = formatPaymentStatus(booking)
              row['Trx ID'] = booking.trxId || ''
            }
            row['Additional Information'] = booking.information || ''
            row['Booked At'] = formatBookedAt(booking)
            return row
          })

          const wb = XLSX.utils.book_new()
          const ws = XLSX.utils.json_to_sheet(exportData)

          const columnWidths = canViewPayments
            ? [
                { wch: 8 },
                { wch: 20 },
                { wch: 25 },
                { wch: 18 },
                { wch: 30 },
                { wch: 35 },
                { wch: 18 },
                { wch: 18 },
                { wch: 18 },
                { wch: 22 },
                { wch: 50 },
                { wch: 20 },
              ]
            : [
                { wch: 8 },
                { wch: 20 },
                { wch: 25 },
                { wch: 18 },
                { wch: 30 },
                { wch: 35 },
                { wch: 18 },
                { wch: 50 },
                { wch: 20 },
              ]
          ws['!cols'] = columnWidths
          XLSX.utils.book_append_sheet(wb, ws, 'Registrations')

          const sanitizedEventTitle = getSanitizedTitle()
          const currentDate = new Date().toISOString().split('T')[0]
          const filename = `Registrations_${sanitizedEventTitle}_${currentDate}.xlsx`
          XLSX.writeFile(wb, filename)
        } catch (error) {
          console.error('Error exporting to Excel:', error)
          alert(
            error instanceof Error
              ? error.message
              : 'Failed to export registrations. Please try again.',
          )
        }
      })()
    })
  }

  const exportToPdf = () => {
    startTransition(() => {
      ;(async () => {
        try {
          const [{ jsPDF }, autoTableModule, bookings] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable'),
            loadAllBookings(),
          ])
          const autoTable = autoTableModule.default

          const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
          const exportedAt = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })

          doc.setFontSize(16)
          doc.text(`Event Registrations: ${eventTitle}`, 40, 40)
          doc.setFontSize(10)
          doc.text(`Total registrations: ${bookings.length}`, 40, 60)
          doc.text(`Exported at: ${exportedAt}`, 40, 76)

          const rows = bookings.map((booking, index) => {
            const base = [
              String(index + 1),
              booking.registrationId || 'N/A',
              booking.name || '',
              booking.category || 'Unspecified',
              booking.school || '',
              booking.email || '',
              booking.phone || 'N/A',
            ]
            if (canViewPayments) {
              base.push(
                booking.amountPaid != null ? `BDT ${booking.amountPaid}` : '—',
                formatPaymentStatus(booking),
                booking.trxId || '—',
              )
            }
            base.push(booking.information || '', formatBookedAt(booking))
            return base
          })

          const head = canViewPayments
            ? [
                'No.',
                'Registration ID',
                'Name',
                'Category',
                'School',
                'Email',
                'Phone',
                'Amount',
                'Status',
                'Trx ID',
                'Info',
                'Booked At',
              ]
            : [
                'No.',
                'Registration ID',
                'Name',
                'Category',
                'School',
                'Email',
                'Phone',
                'Info',
                'Booked At',
              ]

          autoTable(doc, {
            startY: 92,
            head: [head],
            body: rows,
            styles: {
              fontSize: 8,
              cellPadding: 4,
              overflow: 'linebreak',
              valign: 'middle',
            },
            headStyles: {
              fillColor: [79, 70, 229],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
            },
            alternateRowStyles: {
              fillColor: [248, 250, 252],
            },
            margin: { left: 30, right: 30 },
          })

          const currentDate = new Date().toISOString().split('T')[0]
          const filename = `Registrations_${getSanitizedTitle()}_${currentDate}.pdf`
          doc.save(filename)
        } catch (error) {
          console.error('Error exporting to PDF:', error)
          alert(
            error instanceof Error
              ? error.message
              : 'Failed to export PDF. Please try again.',
          )
        }
      })()
    })
  }

  if (
    (typeof totalCount === 'number' && totalCount === 0) ||
    (!canExportExcel && !canExportPdf)
  ) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canExportExcel ? (
        <Button
          type="button"
          onClick={exportToExcel}
          disabled={isPending}
          className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md"
          title="Download registrations as Excel file"
        >
          <Download className="w-4 h-4" />
          {isPending ? 'Exporting...' : 'Export to Excel'}
        </Button>
      ) : null}
      {canExportPdf ? (
        <Button
          type="button"
          onClick={exportToPdf}
          disabled={isPending}
          className="bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md"
          title="Download registrations as PDF file"
        >
          <Download className="w-4 h-4" />
          {isPending ? 'Exporting...' : 'Export as PDF'}
        </Button>
      ) : null}
    </div>
  )
}
