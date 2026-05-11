'use client'

import { Download } from 'lucide-react'
import { useTransition } from 'react'
import { Booking } from '@/types/booking'
import { Button } from '@/components/ui/button'

interface ExportBookingsButtonProps {
  bookings: Booking[]
  eventTitle: string
}

export default function ExportBookingsButton({ bookings, eventTitle }: ExportBookingsButtonProps) {
  const [isPending, startTransition] = useTransition()

  const formatBookedAt = (booking: Booking) => {
    let formattedDate = 'N/A'
    if (booking.createdAt) {
      try {
        const bookedDate = booking.createdAt instanceof Date ? booking.createdAt : new Date(booking.createdAt)
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

  const exportToExcel = () => {
    startTransition(() => {
      // Use IIFE to handle async code splitting
      ;(async () => {
        try {
          // Dynamically import XLSX only when needed (code splitting)
          const XLSX = await import('xlsx')
        
        // Prepare data for Excel export
        const exportData = bookings.map((booking, index) => {
          return {
            'No.': index + 1,
            'Registration ID': booking.registrationId || 'N/A',
            'Name': booking.name,
            'Category': booking.category || 'Unspecified',
            'School': booking.school,
            'Email': booking.email,
            'Phone': booking.phone || 'N/A',
            'Amount Paid (BDT)': booking.amountPaid || '',
            'Payment Status': booking.paymentStatus || 'unpaid',
            'Additional Information': booking.information || '',
            'Booked At': formatBookedAt(booking),
          }
        })

        // Create a new workbook
        const wb = XLSX.utils.book_new()

        // Create a worksheet from the data
        const ws = XLSX.utils.json_to_sheet(exportData)

        // Set column widths for better readability
        const columnWidths = [
          { wch: 8 },  // No.
          { wch: 20 }, // Registration ID
          { wch: 25 }, // Name
          { wch: 18 }, // Category
          { wch: 30 }, // School
          { wch: 35 }, // Email
          { wch: 18 }, // Phone
          { wch: 18 }, // Amount Paid (BDT)
          { wch: 18 }, // Payment Status
          { wch: 50 }, // Additional Information
          { wch: 20 }, // Booked At
        ]
        ws['!cols'] = columnWidths

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Registrations')

        // Generate filename with event title and current date
        const sanitizedEventTitle = getSanitizedTitle()
        const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        const filename = `Registrations_${sanitizedEventTitle}_${currentDate}.xlsx`

          // Write the file and trigger download
          XLSX.writeFile(wb, filename)
        } catch (error) {
          console.error('Error exporting to Excel:', error)
          alert('Failed to export registrations. Please try again.')
        }
      })()
    })
  }

  const exportToPdf = () => {
    startTransition(() => {
      ;(async () => {
        try {
          const [{ jsPDF }, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
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

          const rows = bookings.map((booking, index) => [
            String(index + 1),
            booking.registrationId || 'N/A',
            booking.name || '',
            booking.category || 'Unspecified',
            booking.school || '',
            booking.email || '',
            booking.phone || 'N/A',
            booking.amountPaid ? `BDT ${booking.amountPaid}` : '—',
            booking.paymentStatus || 'unpaid',
            booking.information || '',
            formatBookedAt(booking),
          ])

          autoTable(doc, {
            startY: 92,
            head: [[
              'No.',
              'Registration ID',
              'Name',
              'Category',
              'School',
              'Email',
              'Phone',
              'Amount',
              'Status',
              'Info',
              'Booked At',
            ]],
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
          alert('Failed to export PDF. Please try again.')
        }
      })()
    })
  }

  if (bookings.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
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
    </div>
  )
}
