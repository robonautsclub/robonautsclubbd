'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
}

function parseDateOnly(value: string): Date | null {
  if (!value) return null
  const datePart = value.includes('T') ? value.slice(0, 10) : value.slice(0, 10)
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const [, y, m, d] = match
  return new Date(Number(y), Number(m) - 1, Number(d))
}

export default function DatePicker({ value, onChange, disabled, required }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [navigationDate, setNavigationDate] = useState<Date>(() =>
    parseDateOnly(value) || new Date(),
  )
  const [portalReady, setPortalReady] = useState(false)
  const [menuPos, setMenuPos] = useState({
    top: 0,
    left: 0,
    width: 320,
    openUp: false,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  const selectedDate = useMemo(() => parseDateOnly(value), [value])

  const currentDate = useMemo(() => {
    return selectedDate || navigationDate
  }, [selectedDate, navigationDate])

  const updateMenuPosition = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const menuWidth = 320
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - menuWidth - 8,
    )
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < 360 && rect.top > spaceBelow
    setMenuPos({
      top: openUp
        ? rect.top + window.scrollY - 8
        : rect.bottom + window.scrollY + 8,
      left: left + window.scrollX,
      width: menuWidth,
      openUp,
    })
  }, [])

  const handleOpen = () => {
    if (selectedDate) {
      setNavigationDate(selectedDate)
    }
    updateMenuPosition()
    setIsOpen(true)
  }

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        calendarRef.current?.contains(target) ||
        inputRef.current?.contains(target)
      ) {
        return
      }
      setIsOpen(false)
    }

    const handleReposition = () => updateMenuPosition()

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)
    updateMenuPosition()

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [isOpen, updateMenuPosition])

  const handleDateSelect = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    onChange(dateString)
    setIsOpen(false)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const displayDate = selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select date'
  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(month - 1)
    } else {
      newDate.setMonth(month + 1)
    }
    setNavigationDate(newDate)
  }

  const calendar = isOpen && !disabled && portalReady ? (
    <div
      ref={calendarRef}
      className="z-9999 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4"
      style={{
        position: 'absolute',
        top: menuPos.top,
        left: menuPos.left,
        width: menuPos.width,
        transform: menuPos.openUp ? 'translateY(-100%)' : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[month]} {year}
        </h3>
        <button
          type="button"
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const dayDate = new Date(year, month, day)
          const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          const isSelected =
            selectedDate && format(dayDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDateSelect(dayDate)}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                ${isSelected
                  ? 'bg-cyan-500 text-white shadow-md'
                  : isToday
                    ? 'bg-cyan-100 text-cyan-800 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
        <button
          type="button"
          onClick={() => handleDateSelect(new Date())}
          className="flex-1 px-3 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            handleDateSelect(tomorrow)
          }}
          className="flex-1 px-3 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
        >
          Tomorrow
        </button>
      </div>
    </div>
  ) : null

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayDate}
          readOnly
          onClick={() => {
            if (!disabled) {
              if (!isOpen) {
                handleOpen()
              } else {
                setIsOpen(false)
              }
            }
          }}
          required={required}
          className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all cursor-pointer bg-white"
          disabled={disabled}
          placeholder="Select date"
        />
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="date"
          value={value ? value.slice(0, 10) : ''}
          onChange={(e) => onChange(e.target.value)}
          className="absolute opacity-0 pointer-events-none"
          required={required}
        />
      </div>

      {portalReady && calendar ? createPortal(calendar, document.body) : null}
    </div>
  )
}
