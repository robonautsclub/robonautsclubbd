'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, X } from 'lucide-react'
import { format } from 'date-fns'

interface MultiDatePickerProps {
  value: string[] // Array of date strings in YYYY-MM-DD format
  onChange: (dates: string[]) => void
  disabled?: boolean
  required?: boolean
}

export default function MultiDatePicker({ value, onChange, disabled, required }: MultiDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDates, setSelectedDates] = useState<string[]>(value || [])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const inputRef = useRef<HTMLInputElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedDates(value || [])
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

  const handleDateToggle = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    const newDates = selectedDates.includes(dateString)
      ? selectedDates.filter(d => d !== dateString)
      : [...selectedDates, dateString].sort()
    
    setSelectedDates(newDates)
    onChange(newDates)
  }

  const handleRemoveDate = (dateString: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newDates = selectedDates.filter(d => d !== dateString)
    setSelectedDates(newDates)
    onChange(newDates)
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

  const displayDates = selectedDates.length > 0
    ? selectedDates.length === 1
      ? format(new Date(selectedDates[0]), 'MMM d, yyyy')
      : `${selectedDates.length} dates selected`
    : 'Select date(s)'

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)

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
    const newDate = new Date(currentMonth)
    if (direction === 'prev') {
      newDate.setMonth(month - 1)
    } else {
      newDate.setMonth(month + 1)
    }
    setCurrentMonth(newDate)
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayDates}
          readOnly
          onClick={() => !disabled && setIsOpen(!isOpen)}
          required={required && selectedDates.length === 0}
          className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all cursor-pointer bg-white"
          disabled={disabled}
          placeholder="Select date(s)"
        />
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        {selectedDates.length > 0 && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedDates([])
              onChange([])
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Selected dates chips */}
      {selectedDates.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedDates.map((dateString) => (
            <span
              key={dateString}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium"
            >
              {format(new Date(dateString), 'MMM d, yyyy')}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemoveDate(dateString, e)}
                  className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

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
              const dateString = format(dayDate, 'yyyy-MM-dd')
              const isToday = dateString === format(new Date(), 'yyyy-MM-dd')
              const isSelected = selectedDates.includes(dateString)

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateToggle(dayDate)}
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
              onClick={() => {
                const today = format(new Date(), 'yyyy-MM-dd')
                if (!selectedDates.includes(today)) {
                  const newDates = [...selectedDates, today].sort()
                  setSelectedDates(newDates)
                  onChange(newDates)
                }
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Add Today
            </button>
            <button
              type="button"
              onClick={() => {
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                const tomorrowString = format(tomorrow, 'yyyy-MM-dd')
                if (!selectedDates.includes(tomorrowString)) {
                  const newDates = [...selectedDates, tomorrowString].sort()
                  setSelectedDates(newDates)
                  onChange(newDates)
                }
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Add Tomorrow
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

