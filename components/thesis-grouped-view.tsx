"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GradientBadge } from "@/components/ui/gradient-badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, FileText, Download, Eye, Edit, Trash2, Calendar, User, Tag, GraduationCap } from "lucide-react"

interface Thesis {
  id: string
  title: string
  abstract: string
  fileUrl: string
  authors: string[]
  category: string
  course: string
  courseCode: string
  schoolYear: string
  isPublishedOnline: boolean
  publisherName?: string
  publisherLink?: string
  citation?: string
  indexings: Array<{ type: string; url: string }>
  uploadedBy: string
  createdAt: string
}

interface GroupedTheses {
  [courseCode: string]: {
    courseName: string
    schoolYears: {
      [schoolYear: string]: Thesis[]
    }
  }
}

interface ThesisGroupedViewProps {
  theses: Thesis[]
  onView?: (thesisId: string) => void
  onDownload?: (thesisId: string) => void
  onEdit?: (thesisId: string) => void
  onDelete?: (thesis: Thesis) => void
}

export function ThesisGroupedView({ theses, onView, onDownload, onEdit, onDelete }: ThesisGroupedViewProps) {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState("")

  // Group theses by course and school year (with memo + filtering)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return theses
    return theses.filter((t) => {
      const hay = [
        t.title,
        t.abstract,
        t.category,
        t.course,
        t.courseCode,
        t.schoolYear,
        t.uploadedBy,
        ...t.authors,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [theses, query])

  const groupedTheses: GroupedTheses = filtered.reduce((acc, thesis) => {
    const courseKey = thesis.courseCode
    const yearKey = `${courseKey}-${thesis.schoolYear}`
    
    if (!acc[courseKey]) {
      acc[courseKey] = {
        courseName: thesis.course,
        schoolYears: {}
      }
    }
    
    if (!acc[courseKey].schoolYears[thesis.schoolYear]) {
      acc[courseKey].schoolYears[thesis.schoolYear] = []
    }
    
    acc[courseKey].schoolYears[thesis.schoolYear].push(thesis)
    return acc
  }, {} as GroupedTheses)

  const toggleCourse = (courseCode: string) => {
    const newExpanded = new Set(expandedCourses)
    if (newExpanded.has(courseCode)) {
      newExpanded.delete(courseCode)
    } else {
      newExpanded.add(courseCode)
    }
    setExpandedCourses(newExpanded)
  }

  const toggleYear = (yearKey: string) => {
    const newExpanded = new Set(expandedYears)
    if (newExpanded.has(yearKey)) {
      newExpanded.delete(yearKey)
    } else {
      newExpanded.add(yearKey)
    }
    setExpandedYears(newExpanded)
  }

  const getTotalTheses = () => {
    return Object.values(groupedTheses).reduce((total, course) => {
      return total + Object.values(course.schoolYears).reduce((yearTotal, yearTheses) => {
        return yearTotal + yearTheses.length
      }, 0)
    }, 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Thesis Archive</h2>
        <div className="flex items-center gap-3 ml-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search thesis, authors, category..."
            className="h-8 w-[260px] rounded-md border bg-background px-2 text-sm outline-none ring-0 focus:border-primary"
          />
          <GradientBadge variant="default" className="text-sm">
            {getTotalTheses()} total thesis
          </GradientBadge>
        </div>
      </div>

      {getTotalTheses() === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <CardTitle className="text-lg">No thesis found</CardTitle>
            <CardDescription className="max-w-md">
              Try adjusting your filters or search query to find a thesis.
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {Object.entries(groupedTheses).map(([courseCode, courseData]) => {
        const isCourseExpanded = expandedCourses.has(courseCode)
        const courseThesisCount = Object.values(courseData.schoolYears).reduce((total, yearTheses) => total + yearTheses.length, 0)

        return (
          <Card key={courseCode}>
            <Collapsible open={isCourseExpanded} onOpenChange={() => toggleCourse(courseCode)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isCourseExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <GraduationCap className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{courseData.courseName}</CardTitle>
                        <CardDescription>
                          <GradientBadge variant="default" className="font-mono">
                            {courseCode}
                          </GradientBadge>
                        </CardDescription>
                      </div>
                    </div>
                    <GradientBadge variant="default">
                      {courseThesisCount} thesis
                    </GradientBadge>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {Object.entries(courseData.schoolYears)
                      .sort(([a], [b]) => b.localeCompare(a)) // Sort years descending
                      .map(([schoolYear, yearTheses]) => {
                        const yearKey = `${courseCode}-${schoolYear}`
                        const isYearExpanded = expandedYears.has(yearKey)

                        return (
                          <div key={schoolYear} className="border rounded-lg">
                            <Collapsible open={isYearExpanded} onOpenChange={() => toggleYear(yearKey)}>
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                                  <div className="flex items-center gap-2">
                                    {isYearExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{schoolYear}</span>
                                  </div>
                                  <GradientBadge variant="default">
                                    {yearTheses.length} thesis
                                  </GradientBadge>
                                </div>
                              </CollapsibleTrigger>
                              
                              <CollapsibleContent>
                                <div className="px-3 pb-3 space-y-2">
                                  {yearTheses.map((thesis) => (
                                    <div key={thesis.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <FileText className="h-4 w-4 text-muted-foreground" />
                                          <span className="font-medium">{thesis.title}</span>
                                          {thesis.isPublishedOnline && (
                                            <GradientBadge variant="published" className="text-xs">
                                              Published
                                            </GradientBadge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                          <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {thesis.authors.join(", ")}
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Tag className="h-3 w-3" />
                                            {thesis.category}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {onView && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onView(thesis.id)}
                                          >
                                            <Eye className="h-4 w-4 mr-1" />
                                            View
                                          </Button>
                                        )}
                                        {onDownload && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onDownload(thesis.id)}
                                          >
                                            <Download className="h-4 w-4 mr-1" />
                                            Download
                                          </Button>
                                        )}
                                        {onEdit && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onEdit(thesis.id)}
                                          >
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
                                          </Button>
                                        )}
                                        {onDelete && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onDelete(thesis)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                          >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )
      })}
    </div>
  )
}
