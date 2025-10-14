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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/ui/data-table"
import { ThesisGroupedView } from "@/components/thesis-grouped-view"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Search, Download, ExternalLink, FileText, Calendar, User, Tag, Eye, Edit, Trash2, List, Grid, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal } from "lucide-react"
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
  publisherName?: string
  publisherLink?: string
  citation?: string
  indexings: Array<{ type: string; url: string }>
  uploadedBy: string
  createdAt: string
}

export default function AdminThesesPage() {
  const [theses, setTheses] = useState<Thesis[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "grouped">("grouped")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [thesisToDelete, setThesisToDelete] = useState<Thesis | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [thesisToView, setThesisToView] = useState<Thesis | null>(null)

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


    // setTheses(mockTheses) // Commented out - now using API

  const categories = ["Computer Science", "Information Technology", "Software Engineering", "Data Science", "Cybersecurity"]
  const schoolYears = ["2022-2023", "2023-2024", "2024-2025"]

  const filteredTheses = theses.filter(thesis => {
    const matchesCategory = selectedCategory === "all" || thesis.category === selectedCategory
    const matchesYear = selectedYear === "all" || thesis.schoolYear === selectedYear
    const matchesTab = activeTab === "all" || 
      (activeTab === "published" && thesis.isPublishedOnline) ||
      (activeTab === "unpublished" && !thesis.isPublishedOnline)
    
    return matchesCategory && matchesYear && matchesTab
  })

  const publishedCount = theses.filter(t => t.isPublishedOnline).length
  const unpublishedCount = theses.filter(t => !t.isPublishedOnline).length

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

  const handleEdit = (thesisId: string) => {
    const thesis = theses.find(t => t.id === thesisId)
    if (thesis) {
      // For admin, show a toast with the thesis title
      toast.info(`Edit functionality for "${thesis.title}" - Coming soon!`)
    }
  }

  const handleDelete = async (thesisId: string) => {
    try {
      const response = await fetch(`/api/theses/${thesisId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTheses(theses.filter(thesis => thesis.id !== thesisId))
        toast.success("Thesis deleted successfully!")
        setDeleteDialogOpen(false)
        setThesisToDelete(null)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete thesis")
      }
    } catch (error) {
      console.error("Error deleting thesis:", error)
      toast.error("Failed to delete thesis")
    }
  }

  const openDeleteDialog = (thesis: Thesis) => {
    setThesisToDelete(thesis)
    setDeleteDialogOpen(true)
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Title
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Authors
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {(row.getValue("authors") as string[]).map((author: string, index: number) => (
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Category
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline">
          <Tag className="w-3 h-3 mr-1" />
          {row.getValue("category")}
        </Badge>
      ),
    },
    {
      accessorKey: "schoolYear",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          School Year
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
          {row.getValue("schoolYear")}
        </div>
      ),
    },
    {
      accessorKey: "uploadedBy",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Uploaded By
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {row.getValue("uploadedBy")}
        </div>
      ),
    },
    {
      accessorKey: "isPublishedOnline",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Status
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
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
        <DropdownMenu>
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
            <DropdownMenuItem onClick={() => handleEdit(row.original.id)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload(row.original.id)}>
              <Download className="mr-2 h-4 w-4" /> Download
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openDeleteDialog(row.original)}
              className="text-red-600 focus:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thesis Management</h1>
          <p className="text-muted-foreground">
            View and manage all thesis in the archive system.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
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
            <TabsTrigger value="all">All Thesis ({theses.length})</TabsTrigger>
            <TabsTrigger value="published">Published ({publishedCount})</TabsTrigger>
            <TabsTrigger value="unpublished">Unpublished ({unpublishedCount})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {viewMode === "grouped" ? (
              <ThesisGroupedView 
                theses={filteredTheses}
                onView={handleView}
                onDownload={handleDownload}
                onEdit={handleEdit}
                onDelete={openDeleteDialog}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Thesis Archive</CardTitle>
                  <CardDescription>
                    {filteredTheses.length} {filteredTheses.length === 1 ? 'thesis' : 'thesis'} found
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
        </Tabs>
      </div>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the thesis "{thesisToDelete?.title}" and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => thesisToDelete && handleDelete(thesisToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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