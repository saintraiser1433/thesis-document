"use client"

import { useState, useEffect } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "react-toastify"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GradientBadge } from "@/components/ui/gradient-badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { ThesisGroupedView } from "@/components/thesis-grouped-view"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Search, Download, ExternalLink, FileText, Calendar, User, Tag, Eye, Grid, List, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
  routingStatus?: string
  user?: {
    id: string
    role?: string
  }
  publisherName?: string
  publisherLink?: string
  citation?: string
  indexings: Array<{ type: string; url: string }>
  uploadedBy: string
  createdAt: string
}

export default function BrowseThesesPage() {
  const [theses, setTheses] = useState<Thesis[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "grouped">("grouped")
  const [actionsOpenId, setActionsOpenId] = useState<string | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [thesisToView, setThesisToView] = useState<Thesis | null>(null)

  // Mock data - in real app, this would come from API
  useEffect(() => {
    fetchTheses()
  }, [])

  const fetchTheses = async () => {
    try {
      const response = await fetch('/api/theses')
      if (response.ok) {
        const data = await response.json()
        setTheses(data)
      } else {
        toast.error("Failed to fetch theses")
      }
    } catch (error) {
      console.error("Error fetching theses:", error)
      toast.error("Failed to fetch theses")
    }
  }

  // Remove mock data - now using API
  const mockTheses: Thesis[] = [
      {
        id: "1",
        title: "Machine Learning Applications in Healthcare",
        abstract: "This thesis explores the use of machine learning algorithms in medical diagnosis and treatment planning...",
        authors: ["John Doe", "Jane Smith"],
        category: "Computer Science",
        course: "Bachelor of Science in Information Technology",
        courseCode: "BSIT",
        schoolYear: "2023-2024",
        isPublishedOnline: true,
        publisherName: "IEEE",
        publisherLink: "https://ieeexplore.ieee.org/example",
        citation: "Doe, J., & Smith, J. (2024). Machine Learning Applications in Healthcare.",
        indexings: [
          { type: "Google Scholar", url: "https://scholar.google.com/example" },
          { type: "IEEE Xplore", url: "https://ieeexplore.ieee.org/example" }
        ],
        uploadedBy: "Dr. Program Head",
        createdAt: "2024-01-15"
      },
      {
        id: "2",
        title: "Blockchain Technology in Supply Chain Management",
        abstract: "An investigation into how blockchain can improve transparency and efficiency in supply chains...",
        authors: ["Alice Brown"],
        category: "Information Technology",
        course: "Bachelor of Science in Computer Science",
        courseCode: "BSCS",
        schoolYear: "2023-2024",
        isPublishedOnline: false,
        indexings: [],
        uploadedBy: "Dr. Program Head",
        createdAt: "2024-01-10"
      },
      {
        id: "3",
        title: "Cybersecurity Framework for Small Businesses",
        abstract: "A comprehensive security framework designed specifically for small and medium enterprises...",
        authors: ["Bob Johnson", "Carol Davis"],
        category: "Cybersecurity",
        course: "Bachelor of Science in Cybersecurity",
        courseCode: "BSCY",
        schoolYear: "2022-2023",
        isPublishedOnline: true,
        publisherName: "ACM",
        publisherLink: "https://dl.acm.org/example",
        citation: "Johnson, B., & Davis, C. (2023). Cybersecurity Framework for Small Businesses.",
        indexings: [
          { type: "ACM Digital Library", url: "https://dl.acm.org/example" },
          { type: "ResearchGate", url: "https://researchgate.net/example" }
        ],
        uploadedBy: "Dr. Program Head",
        createdAt: "2023-12-20"
      }
    ]
    // setTheses(mockTheses) // Commented out - now using API

  const categories = ["Computer Science", "Information Technology", "Software Engineering", "Data Science", "Cybersecurity"]
  const schoolYears = ["2022-2023", "2023-2024", "2024-2025"]

  const PENDING_ROUTING_STATUSES = ["PENDING_REVIEW", "IN_ROUTING", "PENDING_ARCHIVE"] as const
  const isPendingRouting = (status: string | undefined | null) =>
    !!status && PENDING_ROUTING_STATUSES.includes(status as (typeof PENDING_ROUTING_STATUSES)[number])
  const isArchived = (status: string | undefined | null, uploaderRole?: string) =>
    status === "ARCHIVED" ||
    (status === "NONE" && (uploaderRole === "ADMIN" || uploaderRole === "PROGRAM_HEAD"))

  const filteredTheses = theses.filter(thesis => {
    const pending = isPendingRouting(thesis.routingStatus)
    const archived = isArchived(thesis.routingStatus, thesis.user?.role)
    const matchesCategory = selectedCategory === "all" || thesis.category === selectedCategory
    const matchesYear = selectedYear === "all" || thesis.schoolYear === selectedYear

    let matchesTab = false
    if (activeTab === "all") {
      // Archive list: only theses that have completed routing and are archived
      matchesTab = archived
    } else if (activeTab === "published") {
      matchesTab = archived && thesis.isPublishedOnline
    } else if (activeTab === "unpublished") {
      matchesTab = archived && !thesis.isPublishedOnline
    } else if (activeTab === "pending") {
      matchesTab = pending
    }

    return matchesCategory && matchesYear && matchesTab
  })

  const totalArchivedCount = theses.filter(t => isArchived(t.routingStatus, t.user?.role)).length
  const publishedCount = theses.filter(t => isArchived(t.routingStatus, t.user?.role) && t.isPublishedOnline).length
  const unpublishedCount = theses.filter(t => isArchived(t.routingStatus, t.user?.role) && !t.isPublishedOnline).length
  const pendingCount = theses.filter(t => isPendingRouting(t.routingStatus)).length

  const handleDownload = (thesisId: string) => {
    const thesis = theses.find(t => t.id === thesisId)
    if (thesis && thesis.fileUrl) {
      // Create a temporary link to download the file
      const link = document.createElement('a')
      link.href = thesis.fileUrl
      link.download = `${thesis.title}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Download started!")
    } else {
      toast.error("File not found")
    }
  }

  const handleView = (thesisId: string) => {
    const thesis = theses.find(t => t.id === thesisId)
    if (thesis) {
      setThesisToView(thesis)
      setViewDialogOpen(true)
    } else {
      toast.error("Thesis not found")
    }
  }

  const columns: ColumnDef<Thesis>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.index + 1}
        </div>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <div className="font-medium truncate">{row.getValue("title")}</div>
          <div className="text-sm text-muted-foreground truncate">
            {row.original.abstract.substring(0, 100)}...
          </div>
        </div>
      ),
    },
    {
      accessorKey: "authors",
      header: "Authors",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.getValue("authors").map((author: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              <User className="w-3 h-3 mr-1" />
              {author}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="outline">
          <Tag className="w-3 h-3 mr-1" />
          {row.getValue("category")}
        </Badge>
      ),
    },
    {
      accessorKey: "schoolYear",
      header: "School Year",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
          {row.getValue("schoolYear")}
        </div>
      ),
    },
    {
      accessorKey: "isPublishedOnline",
      header: "Status",
      cell: ({ row }) => (
        <GradientBadge variant={row.getValue("isPublishedOnline") ? "published" : "unpublished"}>
          {row.getValue("isPublishedOnline") ? "Published" : "Unpublished"}
        </GradientBadge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu open={actionsOpenId === row.original.id} onOpenChange={(open) => setActionsOpenId(open ? row.original.id : null)}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleView(row.original.id)}>
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload(row.original.id)}>
              <Download className="mr-2 h-4 w-4" /> Download
            </DropdownMenuItem>
            {row.original.isPublishedOnline && row.original.publisherLink && (
              <DropdownMenuItem onClick={() => window.open(row.original.publisherLink!, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" /> View Online
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse Thesis</h1>
          <p className="text-muted-foreground">
            Explore and discover thesis in the archive system.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by School Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {schoolYears.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grouped" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grouped")}
            >
              <Grid className="w-4 h-4 mr-2" />
              Grouped
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <List className="w-4 h-4 mr-2" />
              Table
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Thesis ({totalArchivedCount})</TabsTrigger>
            <TabsTrigger value="published">Published ({publishedCount})</TabsTrigger>
            <TabsTrigger value="unpublished">Unpublished ({unpublishedCount})</TabsTrigger>
            <TabsTrigger value="pending">Pending routing ({pendingCount})</TabsTrigger>
          </TabsList>

          {(["all", "published", "unpublished", "pending"] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {viewMode === "grouped" ? (
                <ThesisGroupedView
                  theses={filteredTheses}
                  onView={handleView}
                  onDownload={handleDownload}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Thesis Archive</CardTitle>
                    <CardDescription>
                      {filteredTheses.length} {filteredTheses.length === 1 ? "thesis" : "thesis"} found
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      columns={columns}
                      data={filteredTheses}
                      searchKey="title"
                      searchPlaceholder="Search thesis, authors, or abstracts..."
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Thesis Details</DialogTitle>
            <DialogDescription>
              View thesis information and document
            </DialogDescription>
          </DialogHeader>
          
          {thesisToView && (
            <div className="flex h-[80vh] gap-6">
              {/* Left side - Thesis Details */}
              <div className="w-1/2 overflow-y-auto space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                    <p className="text-lg font-semibold">{thesisToView.title}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Abstract</Label>
                    <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded-md">
                      {thesisToView.abstract}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Authors</Label>
                    <div className="flex flex-wrap gap-2">
                      {thesisToView.authors.map((author, index) => (
                        <Badge key={index} variant="secondary">
                          {author}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                      <p className="text-sm">{thesisToView.category}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Course</Label>
                      <p className="text-sm">{thesisToView.course} ({thesisToView.courseCode})</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">School Year</Label>
                      <p className="text-sm">{thesisToView.schoolYear}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <div>
                        {thesisToView.isPublishedOnline ? (
                          <GradientBadge variant="published">Published Online</GradientBadge>
                        ) : (
                          <GradientBadge variant="default">Unpublished</GradientBadge>
                        )}
                      </div>
                    </div>
                  </div>

                  {thesisToView.isPublishedOnline && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Publisher</Label>
                        <p className="text-sm">{thesisToView.publisherName}</p>
                      </div>
                      {thesisToView.publisherLink && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Publisher Link</Label>
                          <a 
                            href={thesisToView.publisherLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline break-all"
                          >
                            {thesisToView.publisherLink}
                          </a>
                        </div>
                      )}
                      {thesisToView.citation && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Citation</Label>
                          <p className="text-xs bg-muted/50 p-3 rounded-md font-mono">
                            {thesisToView.citation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {thesisToView.indexings.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Indexing References</Label>
                      <div className="space-y-2">
                        {thesisToView.indexings.map((indexing, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted/30 p-2 rounded">
                            <span className="text-sm font-medium">{indexing.type}</span>
                            <a 
                              href={indexing.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Uploaded By</Label>
                      <p className="text-sm">{thesisToView.uploadedBy}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Date Created</Label>
                      <p className="text-sm">{new Date(thesisToView.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - PDF Viewer */}
              <div className="w-1/2 border rounded-lg overflow-hidden">
                <div className="h-full flex flex-col">
                  <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                    <h3 className="font-medium">Document Preview</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(thesisToView.fileUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open in New Tab
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(thesisToView.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1">
                    {thesisToView.fileUrl ? (
                      <iframe
                        src={thesisToView.fileUrl}
                        className="w-full h-full border-0"
                        title="Thesis Document"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <FileText className="h-12 w-12 mx-auto mb-2" />
                          <p>No document available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}