'use client'

import { useState } from 'react'
import { BookOpen, Archive, GraduationCap, User, Link as LinkIcon } from 'lucide-react'
import CreateCourseForm from './CreateCourseForm'
import CourseActions from './CourseActions'
import type { Course } from '@/types/course'
import Image from 'next/image'

interface CoursesClientProps {
  courses: Course[]
  activeCourses: Course[]
  archivedCourses: Course[]
  sessionId: string
}

export default function CoursesClient({
  courses,
  activeCourses,
  archivedCourses,
  sessionId,
}: CoursesClientProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all')

  // Filter courses based on selected filter
  const filteredCourses = courses.filter((course) => {
    if (filter === 'active') return !course.isArchived
    if (filter === 'archived') return course.isArchived
    return true // 'all'
  })

  return (
    <div className="max-w-7xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Courses Management</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage and view all your courses</p>
        </div>
        <CreateCourseForm />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Courses</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Active</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{activeCourses.length}</p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Archived</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-600">{archivedCourses.length}</p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            filter === 'all'
              ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          All Courses ({courses.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            filter === 'active'
              ? 'bg-green-50 text-green-600 border-b-2 border-green-600'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Active ({activeCourses.length})
        </button>
        <button
          onClick={() => setFilter('archived')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            filter === 'archived'
              ? 'bg-gray-50 text-gray-700 border-b-2 border-gray-600'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Archived ({archivedCourses.length})
        </button>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            {filter === 'archived' ? 'No archived courses' : filter === 'active' ? 'No active courses' : 'No courses yet'}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            {filter === 'archived'
              ? 'Archived courses will appear here'
              : filter === 'active'
              ? 'Create your first course to get started'
              : 'Create your first course to get started'}
          </p>
          {filter !== 'archived' && <CreateCourseForm />}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 ${
            filter === 'active' ? 'bg-gradient-to-r from-green-50 to-emerald-50' :
            filter === 'archived' ? 'bg-gradient-to-r from-gray-50 to-slate-50' :
            'bg-gradient-to-r from-indigo-50 to-blue-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                filter === 'active' ? 'bg-green-500' :
                filter === 'archived' ? 'bg-gray-500' :
                'bg-indigo-500'
              }`}>
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  {filter === 'active' ? 'Active Courses' : filter === 'archived' ? 'Archived Courses' : 'All Courses'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                    Description
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                    Created By
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course) => (
                  <tr
                    key={course.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      course.isArchived ? 'opacity-75' : ''
                    }`}
                  >
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        {course.image && (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                            <Image
                              src={course.image}
                              alt={course.title}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 mb-1 truncate">{course.title}</div>
                          {course.href && (
                            <div className="text-xs text-gray-500 flex items-center gap-1 truncate">
                              <LinkIcon className="w-3 h-3 shrink-0" />
                              <span className="truncate">{course.href}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                        {course.level}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-600 line-clamp-2 max-w-md">{course.blurb}</p>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                      {course.createdByName ? (
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1.5 mb-1">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium truncate max-w-xs">{course.createdByName}</span>
                          </div>
                          {course.createdByEmail && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">{course.createdByEmail}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Unknown</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      {course.isArchived ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 border border-gray-300">
                          <Archive className="w-3 h-3 mr-1" />
                          Archived
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-right">
                      <CourseActions course={course} currentUserId={sessionId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

