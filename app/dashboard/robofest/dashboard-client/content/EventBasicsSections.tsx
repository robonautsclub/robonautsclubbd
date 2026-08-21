'use client'

import { Trophy } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import type { RobofestContent } from '@/lib/robofest-content'
import DatePicker from '@/app/dashboard/events/DatePicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ContentSection } from '../ContentSection'

export function EventBasicsSections({
  content,
  setContent,
}: {
  content: RobofestContent
  setContent: Dispatch<SetStateAction<RobofestContent>>
}) {
  return (
    <>
      <ContentSection
        title="Event copy"
        description="Hero text, contact links, and info-strip date/venue lines."
        icon={<Trophy className="w-4 h-4 text-cyan-500" />}
        defaultOpen
        contentClassName="grid sm:grid-cols-2 gap-3"
      >
          {(
            [
              ['statusBadge', 'Status badge'],
              ['headline', 'Headline'],
              ['lead', 'Lead'],
              ['generalRulesPdf', 'General rules PDF path'],
              ['contactEmail', 'Contact email'],
              ['contactHref', 'Contact page href'],
            ] as const
          ).map(([key, label]) => (
            <div
              key={key}
              className={`space-y-1 ${key === 'lead' ? 'sm:col-span-2' : ''}`}
            >
              <label className="text-xs text-slate-500">{label}</label>
              {key === 'lead' ? (
                <Textarea
                  value={content[key] ?? ''}
                  onChange={(e) =>
                    setContent((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  rows={2}
                />
              ) : (
                <Input
                  value={content[key] ?? ''}
                  onChange={(e) =>
                    setContent((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                />
              )}
            </div>
          ))}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-500">
              Date lines (one per line — shown in info strip)
            </label>
            <Textarea
              rows={3}
              value={(content.dateLines || []).join('\n')}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  dateLines: e.target.value
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean),
                }))
              }
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-500">
              Venue lines (one per line — shown in info strip)
            </label>
            <Textarea
              rows={3}
              value={(content.venueLines || []).join('\n')}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  venueLines: e.target.value
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean),
                }))
              }
            />
          </div>
      </ContentSection>

      <ContentSection
        title="Contact lines"
        description="Phone contacts shown on the Robofest hub."
        contentClassName="space-y-3"
      >
          {(content.contactLines || []).map((line, index) => (
            <div
              key={index}
              className="grid sm:grid-cols-3 gap-2 border border-slate-100 rounded-lg p-3"
            >
              {(
                [
                  ['label', 'Label'],
                  ['phone', 'Phone'],
                  ['note', 'Note'],
                ] as const
              ).map(([field, label]) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs text-slate-500">{label}</label>
                  <Input
                    value={line[field]}
                    onChange={(e) => {
                      const value = e.target.value
                      setContent((prev) => {
                        const contactLines = [...(prev.contactLines || [])]
                        contactLines[index] = {
                          ...contactLines[index],
                          [field]: value,
                        }
                        return { ...prev, contactLines }
                      })
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  contactLines: [
                    ...(prev.contactLines || []),
                    { label: '', phone: '', note: '' },
                  ],
                }))
              }
            >
              Add contact line
            </Button>
            {(content.contactLines || []).length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setContent((prev) => ({
                    ...prev,
                    contactLines: (prev.contactLines || []).slice(0, -1),
                  }))
                }
              >
                Remove last
              </Button>
            ) : null}
          </div>
      </ContentSection>

      <ContentSection
        title="Payment"
        description="Global fee per member for bKash registration."
        contentClassName="flex flex-wrap gap-4 items-end"
      >
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={content.isPaid}
              onChange={(e) =>
                setContent((prev) => ({ ...prev, isPaid: e.target.checked }))
              }
            />
            Paid registration (global)
          </label>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">
              Fee per member (BDT)
            </label>
            <Input
              type="number"
              min={0}
              value={content.amount}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  amount: Number(e.target.value) || 0,
                }))
              }
              className="w-36"
            />
          </div>
          <p className="text-xs text-slate-500 max-w-md">
            Charged as fee × team size via bKash. Competition per-member
            override above 0 replaces the global fee.
          </p>
      </ContentSection>

      <ContentSection
        title="Registration deadline"
        description="Public registration closes at this date and time in Bangladesh Standard Time (UTC+6). Leave empty for no deadline."
        contentClassName="flex flex-wrap items-end gap-3"
        defaultOpen
      >
          <div className="space-y-1 min-w-56">
            <label className="text-xs text-slate-500">Closing date</label>
            <DatePicker
              value={
                content.registrationClosingDate
                  ? content.registrationClosingDate.slice(0, 10)
                  : ''
              }
              onChange={(date) =>
                setContent((prev) => {
                  if (!date) {
                    return { ...prev, registrationClosingDate: null }
                  }
                  const prevTime = prev.registrationClosingDate?.includes('T')
                    ? prev.registrationClosingDate.slice(11, 16)
                    : '23:59'
                  return {
                    ...prev,
                    registrationClosingDate: `${date}T${prevTime || '23:59'}`,
                  }
                })
              }
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Closing time</label>
            <Input
              type="time"
              value={
                content.registrationClosingDate?.includes('T')
                  ? content.registrationClosingDate.slice(11, 16)
                  : content.registrationClosingDate
                    ? '23:59'
                    : ''
              }
              disabled={!content.registrationClosingDate}
              onChange={(e) =>
                setContent((prev) => {
                  const date = prev.registrationClosingDate
                    ? prev.registrationClosingDate.slice(0, 10)
                    : ''
                  if (!date) return prev
                  const time = e.target.value || '23:59'
                  return {
                    ...prev,
                    registrationClosingDate: `${date}T${time}`,
                  }
                })
              }
              className="w-36 h-12.5"
            />
          </div>
          {content.registrationClosingDate ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  registrationClosingDate: null,
                }))
              }
            >
              Clear deadline
            </Button>
          ) : null}
          <p className="text-xs text-slate-500 w-full">
            Shown as a live countdown on the Robofest pages. Registration closes
            at the exact Bangladesh time (BST, UTC+6) you set.
          </p>
      </ContentSection>

      <ContentSection
        title="Divisions / rounds"
        description="City value is the registration Division option (e.g. Dhaka, Chittagong)."
        contentClassName="space-y-4"
      >
          {content.rounds.map((round, index) => (
            <div
              key={`${round.city}-${index}`}
              className="grid sm:grid-cols-2 gap-2 border border-slate-100 rounded-lg p-3"
            >
              {(
                [
                  ['city', 'City / division'],
                  ['title', 'Title'],
                  ['dates', 'Dates'],
                  ['venueLabel', 'Venue label'],
                  ['image', 'Image path'],
                ] as const
              ).map(([field, label]) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs text-slate-500">{label}</label>
                  <Input
                    value={round[field]}
                    onChange={(e) => {
                      const value = e.target.value
                      setContent((prev) => {
                        const rounds = [...prev.rounds]
                        rounds[index] = { ...rounds[index], [field]: value }
                        return { ...prev, rounds }
                      })
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
      </ContentSection>
    </>
  )
}
