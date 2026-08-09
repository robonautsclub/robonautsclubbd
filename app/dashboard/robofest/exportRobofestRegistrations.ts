import { format } from 'date-fns'
import type { RobofestRegistration } from '@/lib/robofest-content'
import { formatAgeCategoryLabel } from '@/lib/robofest-registration-options'

function dateStamp() {
  return format(new Date(), 'yyyy-MM-dd')
}

function ageLabel(r: RobofestRegistration) {
  return r.ageCategory ? formatAgeCategoryLabel(r.ageCategory) : ''
}

function createdLabel(r: RobofestRegistration) {
  if (!r.createdAt) return ''
  try {
    return format(new Date(r.createdAt), 'dd MMM yyyy HH:mm')
  } catch {
    return r.createdAt
  }
}

function membersLabel(r: RobofestRegistration) {
  const members = r.teamMembers?.filter((m) => m?.name) || []
  if (members.length === 0) {
    return [r.name, r.email, r.phone].filter(Boolean).join(' · ') || '—'
  }
  return members
    .map((m, i) => {
      const detail = [m.email, m.phone, m.school].filter(Boolean).join(' · ')
      return `${i + 1}. ${m.name}${detail ? ` (${detail})` : ''}`
    })
    .join('\n')
}

function memberCells(r: RobofestRegistration) {
  return [0, 1, 2, 3].flatMap((i) => {
    const m = r.teamMembers?.[i]
    return [
      m?.name || '',
      m?.email || '',
      m?.phone || '',
      m?.school || '',
      m?.branch || '',
      m?.grade || '',
    ]
  })
}

export function exportRobofestCsv(rows: RobofestRegistration[]) {
  const memberHeaders = [1, 2, 3, 4].flatMap((n) => [
    `Member ${n} Name`,
    `Member ${n} Email`,
    `Member ${n} Phone`,
    `Member ${n} School`,
    `Member ${n} Branch`,
    `Member ${n} Grade`,
  ])
  const headers = [
    'Registration ID',
    'Team Number',
    'Team Name',
    'Contact Email',
    'Contact Phone',
    'Contact School',
    'Age Category',
    'Team Size',
    'Campus Ambassador',
    'Ambassador School',
    'Division',
    'Competition',
    'Status',
    'Payment',
    'Amount Paid',
    'Trx ID',
    'Created At',
    'Notes',
    ...memberHeaders,
  ]
  const lines = rows.map((r) =>
    [
      r.registrationId || '',
      r.teamNumber || '',
      r.name,
      r.email,
      r.phone,
      r.school,
      ageLabel(r),
      r.teamSize ?? r.teamMembers?.length ?? '',
      r.campusAmbassadorName || '',
      r.campusAmbassadorSchool || '',
      r.roundCity,
      r.category,
      r.status,
      r.paymentStatus || '',
      r.amountPaid ?? '',
      r.trxId || '',
      r.createdAt || '',
      r.notes || '',
      ...memberCells(r),
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(','),
  )
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `robofest-registrations-${dateStamp()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportRobofestExcel(rows: RobofestRegistration[]) {
  const XLSX = await import('xlsx')
  const exportData = rows.map((r, index) => {
    const row: Record<string, string | number> = {
      'No.': index + 1,
      'Registration ID': r.registrationId || '',
      'Team Number': r.teamNumber || '',
      'Team Name': r.name || '',
      Competition: r.category || '',
      Division: r.roundCity || '',
      'Age Category': ageLabel(r),
      'Team Size': r.teamSize ?? r.teamMembers?.length ?? '',
      'Contact Email': r.email || '',
      'Contact Phone': r.phone || '',
      'Contact School': r.school || '',
      'Campus Ambassador': r.campusAmbassadorName || '',
      'Ambassador School': r.campusAmbassadorSchool || '',
      Status: r.status || '',
      Payment: r.paymentStatus || '',
      'Amount Paid': r.amountPaid ?? '',
      'Trx ID': r.trxId || '',
      'Created At': createdLabel(r),
      Notes: r.notes || '',
    }
    for (let i = 0; i < 4; i += 1) {
      const m = r.teamMembers?.[i]
      const n = i + 1
      row[`Member ${n} Name`] = m?.name || ''
      row[`Member ${n} Email`] = m?.email || ''
      row[`Member ${n} Phone`] = m?.phone || ''
      row[`Member ${n} School`] = m?.school || ''
      row[`Member ${n} Branch`] = m?.branch || ''
      row[`Member ${n} Grade`] = m?.grade || ''
    }
    return row
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(exportData)
  ws['!cols'] = Object.keys(exportData[0] || { No: 1 }).map((key) => ({
    wch: Math.min(36, Math.max(12, key.length + 2)),
  }))
  XLSX.utils.book_append_sheet(wb, ws, 'Registrations')
  XLSX.writeFile(wb, `robofest-registrations-${dateStamp()}.xlsx`)
}

export async function exportRobofestPdf(rows: RobofestRegistration[]) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
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
  doc.text('Robofest Registrations', 40, 40)
  doc.setFontSize(10)
  doc.text(`Matching registrations: ${rows.length}`, 40, 60)
  doc.text(`Exported at: ${exportedAt}`, 40, 76)

  const body = rows.map((r, index) => [
    String(index + 1),
    r.name || '',
    r.category || '',
    r.roundCity || '',
    ageLabel(r) || '—',
    membersLabel(r),
    r.status || '',
    r.paymentStatus || '—',
  ])

  autoTable(doc, {
    startY: 92,
    head: [
      [
        'No.',
        'Team',
        'Competition',
        'Division',
        'Age',
        'Team members',
        'Status',
        'Payment',
      ],
    ],
    body,
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

  doc.save(`robofest-registrations-${dateStamp()}.pdf`)
}
