'use client'

import { useState } from 'react'
import { BookOpen, Archive, GraduationCap, User, Link as LinkIcon } from 'lucide-react'
import CreateCourseForm from './CreateCourseForm'
import CourseActions from './CourseActions'
import type { Course } from '@/types/course'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CoursesClientProps {
  courses: Course[]
  activeCourses: Course[]
  archivedCourses: Course[]
  sessionId: string
  userRole?: 'superAdmin' | 'admin'
}

export default function CoursesClient({
  courses,
  activeCourses,
  archivedCourses,
  sessionId,
  userRole,
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
        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Courses</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{courses.length}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Active</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{activeCourses.length}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Archived</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-600">{archivedCourses.length}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as 'all' | 'active' | 'archived')}
        className="w-full"
      >
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none w-full justify-start h-auto p-0 gap-2">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none rounded-t-lg rounded-b-none px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            All Courses ({courses.length})
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-green-50 data-[state=active]:text-green-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600 data-[state=active]:shadow-none rounded-t-lg rounded-b-none px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            Active ({activeCourses.length})
          </TabsTrigger>
          <TabsTrigger
            value="archived"
            className="data-[state=active]:bg-gray-50 data-[state=active]:text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-gray-600 data-[state=active]:shadow-none rounded-t-lg rounded-b-none px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            Archived ({archivedCourses.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value={filter} className="mt-4 sm:mt-6">
          {filteredCourses.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-8 sm:p-12 text-center">
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
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm overflow-hidden p-0">
          <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 ${
            filter === 'active' ? 'bg-linear-to-r from-green-50 to-emerald-50' :
            filter === 'archived' ? 'bg-linear-to-r from-gray-50 to-slate-50' :
            'bg-linear-to-r from-indigo-50 to-blue-50'
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
          <Table className="min-w-[640px]">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="px-3 sm:px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Course
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Level
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                  Description
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                  Created By
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {filteredCourses.map((course) => (
                <TableRow
                  key={course.id}
                  className={`hover:bg-gray-50 ${
                    course.isArchived ? 'opacity-75' : ''
                  }`}
                >
                  <TableCell className="px-3 sm:px-6 py-4">
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
                  </TableCell>
                  <TableCell className="px-3 sm:px-6 py-4">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100">
                      {course.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 sm:px-6 py-4 hidden md:table-cell">
                    <p className="text-sm text-gray-600 line-clamp-2 max-w-md whitespace-normal">{course.blurb}</p>
                  </TableCell>
                  <TableCell className="px-3 sm:px-6 py-4 hidden lg:table-cell">
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
                  </TableCell>
                  <TableCell className="px-3 sm:px-6 py-4">
                    {course.isArchived ? (
                      <Badge variant="secondary" className="bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-200">
                        <Archive className="w-3 h-3" />
                        Archived
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-100">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-3 sm:px-6 py-4 text-right">
                    <CourseActions course={course} currentUserId={sessionId} userRole={userRole} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

