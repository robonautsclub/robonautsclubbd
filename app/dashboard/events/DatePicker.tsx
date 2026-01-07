'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
}

export default function DatePicker({ value, onChange, disabled, required }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null)
  const inputRef = useRef<HTMLInputElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value))
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
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
  const currentDate = selectedDate || new Date()
  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)

  const days = []
  // Empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(month - 1)
    } else {
      newDate.setMonth(month + 1)
    }
    setSelectedDate(newDate)
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayDate}
          readOnly
          onClick={() => !disabled && setIsOpen(!isOpen)}
          required={required}
          className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all cursor-pointer bg-white"
          disabled={disabled}
          placeholder="Select date"
        />
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute opacity-0 pointer-events-none"
          required={required}
        />
      </div>

      {isOpen && !disabled && (
        <div
          ref={calendarRef}
          className="absolute z-50 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4 w-80"
        >
          {/* Calendar Header */}
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

          {/* Calendar Grid */}
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
              const isSelected = selectedDate && format(dayDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateSelect(dayDate)}
                  className={`
                    aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-indigo-500 text-white shadow-md'
                      : isToday
                      ? 'bg-indigo-100 text-indigo-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
            <button
              type="button"
              onClick={() => handleDateSelect(new Date())}
              className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
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
              className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Tomorrow
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

