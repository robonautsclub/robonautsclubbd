'use client'

import { useState, useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  // Default to 9:00 AM - 5:00 PM if no value provided
  const defaultTime = '9:00 AM - 5:00 PM'
  const [startHour, setStartHour] = useState('9')
  const [startMinute, setStartMinute] = useState('00')
  const [startPeriod, setStartPeriod] = useState('AM')
  const [endHour, setEndHour] = useState('5')
  const [endMinute, setEndMinute] = useState('00')
  const [endPeriod, setEndPeriod] = useState('PM')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Parse existing time value if present, otherwise use default
    const timeToParse = value || defaultTime
    const match = timeToParse.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (match) {
      setStartHour(match[1])
      setStartMinute(match[2])
      setStartPeriod(match[3].toUpperCase())
      setEndHour(match[4])
      setEndMinute(match[5])
      setEndPeriod(match[6].toUpperCase())
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const formatTime = () => {
    return `${startHour}:${startMinute} ${startPeriod} - ${endHour}:${endMinute} ${endPeriod}`
  }

  const handleTimeChange = () => {
    const timeString = formatTime()
    onChange(timeString)
  }

  useEffect(() => {
    if (isOpen) {
      handleTimeChange()
    }
  }, [startHour, startMinute, startPeriod, endHour, endMinute, endPeriod])

  // Auto-set default time if no value is provided on initial mount
  useEffect(() => {
    if (!value) {
      const defaultTimeString = formatTime()
      onChange(defaultTimeString)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString())
  const minutes = ['00', '15', '30', '45']
  const periods = ['AM', 'PM']

  const displayValue = value || defaultTime

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-400 transition-all cursor-pointer bg-white flex items-center"
      >
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>{displayValue}</span>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4 w-96">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Start Time</h4>
            <div className="flex items-center gap-2">
              <select
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              >
                {hours.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
              <span className="text-gray-500 font-semibold">:</span>
              <select
                value={startMinute}
                onChange={(e) => setStartMinute(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              >
                {minutes.map((minute) => (
                  <option key={minute} value={minute}>
                    {minute}
                  </option>
                ))}
              </select>
              <select
                value={startPeriod}
                onChange={(e) => setStartPeriod(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              >
                {periods.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">End Time</h4>
            <div className="flex items-center gap-2">
              <select
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              >
                {hours.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
              <span className="text-gray-500 font-semibold">:</span>
              <select
                value={endMinute}
                onChange={(e) => setEndMinute(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              >
                {minutes.map((minute) => (
                  <option key={minute} value={minute}>
                    {minute}
                  </option>
                ))}
              </select>
              <select
                value={endPeriod}
                onChange={(e) => setEndPeriod(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              >
                {periods.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

