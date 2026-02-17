'use client'

import { Download } from 'lucide-react'
import { useTransition } from 'react'
import { Booking } from '@/types/booking'

interface ExportBookingsButtonProps {
  bookings: Booking[]
  eventTitle: string
}

export default function ExportBookingsButton({ bookings, eventTitle }: ExportBookingsButtonProps) {
  const [isPending, startTransition] = useTransition()

  const exportToExcel = () => {
    startTransition(() => {
      // Use IIFE to handle async code splitting
      ;(async () => {
        try {
          // Dynamically import XLSX only when needed (code splitting)
          const XLSX = await import('xlsx')
        
        // Prepare data for Excel export
        const exportData = bookings.map((booking, index) => {
          // Format the date consistently
          let formattedDate = 'N/A'
          if (booking.createdAt) {
            try {
              const bookedDate = booking.createdAt instanceof Date 
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

          return {
            'No.': index + 1,
            'Registration ID': booking.registrationId || 'N/A',
            'Name': booking.name,
            'School': booking.school,
            'Email': booking.email,
            'Phone': booking.phone || 'N/A',
            'bKash Number': booking.bkashNumber || '',
            'Additional Information': booking.information,
            'Booked At': formattedDate,
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
          { wch: 30 }, // School
          { wch: 35 }, // Email
          { wch: 18 }, // Phone
            { wch: 18 }, // bKash Number
            { wch: 50 }, // Additional Information
          { wch: 20 }, // Booked At
        ]
        ws['!cols'] = columnWidths

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Registrations')

        // Generate filename with event title and current date
        const sanitizedEventTitle = eventTitle
          .replace(/[^\w\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .substring(0, 50) // Limit length
        
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

  if (bookings.length === 0) {
    return null
  }

  return (
    <button
      onClick={exportToExcel}
      disabled={isPending}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
      title="Download registrations as Excel file"
    >
      <Download className="w-4 h-4" />
      {isPending ? 'Exporting...' : 'Export to Excel'}
    </button>
  )
}
