'use client'

import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import type { RobofestContent } from '@/lib/robofest-content'
import {
  computeRobofestRegistrationTotal,
  resolveRobofestFee,
} from '@/lib/robofest-fee'
import {
  formatCampusAmbassadorLabel,
  type RobofestCampusAmbassador,
} from '@/lib/robofest-campus-ambassadors'
import {
  getGradesForAgeCategory,
  ROBOFEST_AGE_CATEGORIES,
  ROBOFEST_DIVISIONS,
  type RobofestAgeCategory,
} from '@/lib/robofest-registration-options'
import {
  PRIVATE_CANDIDATE_OPTION,
  SCHOOL_NOT_FOUND_OPTION,
} from '@/lib/schoolDirectory'
import { createRobofestRegistrationManual } from './actions'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type TeamMemberForm = {
  name: string
  email: string
  phone: string
  schoolSelection: string
  customSchool: string
  branch: string
  grade: string
}

type FormState = {
  category: string
  division: string
  ageCategory: RobofestAgeCategory | ''
  teamSize: number
  teamMembers: TeamMemberForm[]
  campusAmbassadorId: string
  notes: string
  paymentMode: 'paid_offline' | 'waived'
  amountPaid: string
  trxId: string
  sendEmail: boolean
}

const emptyMember = (): TeamMemberForm => ({
  name: '',
  email: '',
  phone: '',
  schoolSelection: '',
  customSchool: '',
  branch: '',
  grade: '',
})

function resizeTeamMembers(
  members: TeamMemberForm[],
  size: number,
): TeamMemberForm[] {
  const next = members.slice(0, size)
  while (next.length < size) next.push(emptyMember())
  return next
}

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

export default function CreateRobofestRegistrationForm({
  content,
  schools,
  campusAmbassadors,
  canViewPayments = true,
  canSendMail = true,
}: {
  content: RobofestContent
  schools: string[]
  campusAmbassadors: RobofestCampusAmbassador[]
  canViewPayments?: boolean
  canSendMail?: boolean
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const categories = useMemo(
    () => content.categories.filter((c) => c.active !== false),
    [content.categories],
  )

  const divisionOptions = useMemo(() => {
    const fromRounds = content.rounds
      .map((round) => {
        const match = ROBOFEST_DIVISIONS.find((d) => d.value === round.city)
        return match ?? { value: round.city, label: `${round.city} Division` }
      })
      .filter((d, i, arr) => arr.findIndex((x) => x.value === d.value) === i)
    return fromRounds.length > 0 ? fromRounds : ROBOFEST_DIVISIONS
  }, [content.rounds])

  const defaultCategory = categories[0]?.name ?? ''
  const defaultDivision = divisionOptions[0]?.value ?? 'Dhaka'

  const emptyForm = (): FormState => {
    const fee = resolveRobofestFee(content, defaultCategory)
    const total = computeRobofestRegistrationTotal(fee.amount || 300, 1)
    return {
      category: defaultCategory,
      division: defaultDivision,
      ageCategory: '',
      teamSize: 1,
      teamMembers: [emptyMember()],
      campusAmbassadorId: '',
      notes: '',
      paymentMode: canViewPayments ? 'paid_offline' : 'waived',
      amountPaid: canViewPayments ? String(total) : '0',
      trxId: '',
      sendEmail: canSendMail,
    }
  }

  const [form, setForm] = useState<FormState>(emptyForm)

  const fee = resolveRobofestFee(content, form.category || defaultCategory)
  const suggestedTotal = computeRobofestRegistrationTotal(
    fee.amount || 300,
    form.teamSize,
  )
  const gradeOptions = getGradesForAgeCategory(form.ageCategory)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setError('')
      setMessage('')
      setForm(emptyForm())
    }
  }

  const updateTeamSize = (event: ChangeEvent<HTMLSelectElement>) => {
    const size = Math.min(4, Math.max(1, Number(event.target.value) || 1))
    setForm((prev) => {
      const nextFee = resolveRobofestFee(content, prev.category || defaultCategory)
      const nextTotal = computeRobofestRegistrationTotal(
        nextFee.amount || 300,
        size,
      )
      return {
        ...prev,
        teamSize: size,
        teamMembers: resizeTeamMembers(prev.teamMembers, size),
        amountPaid:
          prev.paymentMode === 'paid_offline'
            ? String(nextTotal)
            : prev.amountPaid,
      }
    })
  }

  const updateCategory = (event: ChangeEvent<HTMLSelectElement>) => {
    const category = event.target.value
    setForm((prev) => {
      const nextFee = resolveRobofestFee(content, category)
      const nextTotal = computeRobofestRegistrationTotal(
        nextFee.amount || 300,
        prev.teamSize,
      )
      return {
        ...prev,
        category,
        amountPaid:
          prev.paymentMode === 'paid_offline'
            ? String(nextTotal)
            : prev.amountPaid,
      }
    })
  }

  const updateAgeCategory = (event: ChangeEvent<HTMLSelectElement>) => {
    const ageCategory = event.target.value as RobofestAgeCategory | ''
    setForm((prev) => ({
      ...prev,
      ageCategory,
      teamMembers: prev.teamMembers.map((member) => {
        const allowed = getGradesForAgeCategory(ageCategory)
        return {
          ...member,
          grade: allowed.includes(member.grade) ? member.grade : '',
        }
      }),
    }))
  }

  const updateMember =
    (index: number, field: keyof TeamMemberForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value
      setForm((prev) => {
        const teamMembers = prev.teamMembers.map((member, i) =>
          i === index ? { ...member, [field]: value } : member,
        )
        return { ...prev, teamMembers }
      })
    }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      const amountPaid = Number(form.amountPaid)
      const result = await createRobofestRegistrationManual({
        category: form.category,
        name: '',
        division: form.division,
        ageCategory: form.ageCategory,
        teamSize: form.teamSize,
        teamMembers: form.teamMembers.slice(0, form.teamSize).map((m) => ({
          name: m.name,
          email: m.email,
          phone: m.phone,
          schoolSelection: m.schoolSelection,
          customSchool: m.customSchool,
          branch: m.branch,
          grade: m.grade,
        })),
        campusAmbassadorId: form.campusAmbassadorId || undefined,
        notes: form.notes,
        paymentMode: form.paymentMode,
        amountPaid:
          form.paymentMode === 'paid_offline' && Number.isFinite(amountPaid)
            ? amountPaid
            : undefined,
        trxId: form.trxId || undefined,
        sendEmail: canSendMail && form.sendEmail,
      })

      if (!result.success) {
        setError(result.error || 'Failed to create registration.')
        return
      }

      setMessage(
        result.warning ||
          `Registration created${
            result.registrationId ? ` (${result.registrationId})` : ''
          }${result.teamNumber ? ` · Team ${result.teamNumber}` : ''}.`,
      )
      router.refresh()
      setTimeout(() => handleOpenChange(false), 800)
    } catch {
      setError('Failed to create registration. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button type="button" size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add registration
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col gap-0 overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 bg-cyan-700 px-4 py-4 text-white">
          <div>
            <SheetTitle className="text-lg font-bold text-white">
              Add Robofest registration
            </SheetTitle>
            <SheetDescription className="text-xs text-cyan-100 mt-1">
              Create a team registration as admin (no bKash checkout).
            </SheetDescription>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => handleOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {(error || message) && (
            <Alert variant={error ? 'destructive' : 'default'}>
              <AlertTitle>{error ? 'Could not create' : 'Created'}</AlertTitle>
              <AlertDescription>{error || message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <label className="text-xs text-gray-500">Competition</label>
            <select
              className={selectClassName}
              value={form.category}
              onChange={updateCategory}
              required
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Team number is assigned automatically and used as the team name.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Division</label>
              <select
                className={selectClassName}
                value={form.division}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, division: e.target.value }))
                }
                required
              >
                {divisionOptions.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Age category</label>
              <select
                className={selectClassName}
                value={form.ageCategory}
                onChange={updateAgeCategory}
                required
              >
                <option value="">Select</option>
                {ROBOFEST_AGE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500">Team size</label>
            <select
              className={selectClassName}
              value={form.teamSize}
              onChange={updateTeamSize}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} member{n === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </div>

          {form.teamMembers.slice(0, form.teamSize).map((member, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-100 p-3 space-y-2"
            >
              <p className="text-sm font-medium text-gray-800">
                {`Team Member ${String(index + 1).padStart(2, '0')}`}
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                <Input
                  placeholder={
                    index === 0 ? 'Name (Team Leader)' : 'Name'
                  }
                  value={member.name}
                  onChange={updateMember(index, 'name')}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={member.email}
                  onChange={updateMember(index, 'email')}
                  required
                />
                <Input
                  placeholder="Phone (01XXXXXXXXX)"
                  value={member.phone}
                  onChange={updateMember(index, 'phone')}
                  required
                />
                <select
                  className={selectClassName}
                  value={member.grade}
                  onChange={updateMember(index, 'grade')}
                  required
                >
                  <option value="">Grade</option>
                  {gradeOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <select
                className={selectClassName}
                value={member.schoolSelection}
                onChange={updateMember(index, 'schoolSelection')}
                required
              >
                <option value="">Institution</option>
                {schools.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
                <option value={PRIVATE_CANDIDATE_OPTION}>
                  {PRIVATE_CANDIDATE_OPTION}
                </option>
                <option value={SCHOOL_NOT_FOUND_OPTION}>
                  {SCHOOL_NOT_FOUND_OPTION}
                </option>
              </select>
              {member.schoolSelection === SCHOOL_NOT_FOUND_OPTION ? (
                <Input
                  placeholder="Custom school name"
                  value={member.customSchool}
                  onChange={updateMember(index, 'customSchool')}
                  required
                />
              ) : null}
              <Input
                placeholder="Branch (optional)"
                value={member.branch}
                onChange={updateMember(index, 'branch')}
              />
            </div>
          ))}

          <div className="space-y-1">
            <label className="text-xs text-gray-500">
              Campus ambassador (optional)
            </label>
            <select
              className={selectClassName}
              value={form.campusAmbassadorId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  campusAmbassadorId: e.target.value,
                }))
              }
            >
              <option value="">None</option>
              {campusAmbassadors.map((a) => (
                <option key={a.id} value={a.id}>
                  {formatCampusAmbassadorLabel(a)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500">Notes (optional)</label>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>

          {canViewPayments ? (
            <div className="rounded-lg border border-gray-100 p-3 space-y-3">
              <p className="text-sm font-medium text-gray-800">Payment</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={form.paymentMode === 'paid_offline'}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        paymentMode: 'paid_offline',
                        amountPaid: String(suggestedTotal),
                      }))
                    }
                  />
                  Paid offline
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={form.paymentMode === 'waived'}
                    onChange={() =>
                      setForm((prev) => ({ ...prev, paymentMode: 'waived' }))
                    }
                  />
                  Waived (n/a)
                </label>
              </div>
              {form.paymentMode === 'paid_offline' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      Amount (BDT) · suggested {suggestedTotal}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={form.amountPaid}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          amountPaid: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      Trx / reference (optional)
                    </label>
                    <Input
                      value={form.trxId}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, trxId: e.target.value }))
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground rounded-lg border border-gray-100 p-3">
              New registrations are created as fee waived. You do not have
              permission to set or view paid amounts.
            </p>
          )}

          {canSendMail ? (
            <label className="flex items-start gap-3 rounded-lg border border-gray-100 px-3 py-3 cursor-pointer">
              <Checkbox
                checked={form.sendEmail}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, sendEmail: checked === true }))
                }
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700">
                Send confirmation email to team members with valid emails
              </span>
            </label>
          ) : (
            <p className="text-sm text-muted-foreground rounded-lg border border-gray-100 p-3">
              Confirmation email will not be sent. You do not have permission to
              send emails from the dashboard.
            </p>
          )}

          <div className="flex gap-2 pt-2 pb-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Creating…' : 'Create registration'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
