"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table"
import { ThesisGroupedView } from "@/components/thesis-grouped-view"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Search, Download, ExternalLink, FileText, Calendar, User, Tag, Eye, Edit, Trash2, Plus, Grid, List, MoreHorizontal } from "lucide-react"
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

export default function ProgramHeadThesesPage() {
  const router = useRouter()
  const [theses, setTheses] = useState<Thesis[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "grouped">("grouped")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [thesisToDelete, setThesisToDelete] = useState<Thesis | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [thesisToEdit, setThesisToEdit] = useState<Thesis | null>(null)
  const [editFormData, setEditFormData] = useState({
    title: "",
    abstract: "",
    isPublishedOnline: false,
    publisherName: "",
    publisherLink: "",
    citation: ""
  })
  const [editAuthors, setEditAuthors] = useState<string[]>([])
  const [editIndexings, setEditIndexings] = useState<Array<{ type: string; url: string }>>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([])
  const [schoolYears, setSchoolYears] = useState<{ id: string; name: string }[]>([])
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [thesisToView, setThesisToView] = useState<Thesis | null>(null)

  const PENDING_ROUTING_STATUSES = ["PENDING_REVIEW", "IN_ROUTING", "PENDING_ARCHIVE"] as const
  const isPendingRouting = (status: string | undefined | null) =>
    !!status && PENDING_ROUTING_STATUSES.includes(status as (typeof PENDING_ROUTING_STATUSES)[number])
  const isArchived = (status: string | undefined | null, uploaderRole?: string) =>
    status === "ARCHIVED" ||
    (status === "NONE" && (uploaderRole === "ADMIN" || uploaderRole === "PROGRAM_HEAD"))

  useEffect(() => {
    fetchTheses()
    loadFormData()
  }, [])

  const loadFormData = async () => {
    try {
      const [categoriesRes, coursesRes, schoolYearsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/courses'),
        fetch('/api/school-years')
      ])

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCourses(coursesData)
      }

      if (schoolYearsRes.ok) {
        const schoolYearsData = await schoolYearsRes.json()
        setSchoolYears(schoolYearsData)
      }
    } catch (error) {
      console.error('Error loading form data:', error)
    }
  }

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
        abstract: "This thesis explores the use of machine learning algorithms in medical diagnosis and treatment planning. The research focuses on developing predictive models that can assist healthcare professionals in making more accurate diagnoses and treatment recommendations.",
        authors: ["John Doe", "Jane Smith"],
        category: "Computer Science",
        course: "Bachelor of Science in Information Technology",
        courseCode: "BSIT",
        schoolYear: "2023-2024",
        isPublishedOnline: true,
        publisherName: "IEEE",
        publisherLink: "https://ieeexplore.ieee.org/example",
        citation: "Doe, J., & Smith, J. (2024). Machine Learning Applications in Healthcare. IEEE Transactions on Medical Informatics.",
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
        abstract: "An investigation into how blockchain can improve transparency and efficiency in supply chains. This research examines the implementation of distributed ledger technology to track products from origin to consumer.",
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
        abstract: "A comprehensive security framework designed specifically for small and medium enterprises. This thesis addresses the unique challenges faced by smaller organizations in implementing effective cybersecurity measures.",
        authors: ["Bob Johnson", "Carol Davis"],
        category: "Cybersecurity",
        course: "Bachelor of Science in Cybersecurity",
        courseCode: "BSCY",
        schoolYear: "2022-2023",
        isPublishedOnline: true,
        publisherName: "ACM",
        publisherLink: "https://dl.acm.org/example",
        citation: "Johnson, B., & Davis, C. (2023). Cybersecurity Framework for Small Businesses. ACM Computing Surveys.",
        indexings: [
          { type: "ACM Digital Library", url: "https://dl.acm.org/example" },
          { type: "ResearchGate", url: "https://researchgate.net/example" }
        ],
        uploadedBy: "Dr. Program Head",
        createdAt: "2023-12-20"
      }
    ]
    // setTheses(mockTheses) // Commented out - now using API


  const filteredTheses = theses.filter(thesis => {
    const pending = isPendingRouting(thesis.routingStatus)
    const archived = isArchived(thesis.routingStatus, thesis.user?.role)

    const matchesCategory = selectedCategory === "all" || thesis.category === selectedCategory
    const matchesYear = selectedYear === "all" || thesis.schoolYear === selectedYear

    let matchesTab = false
    if (activeTab === "pending") {
      matchesTab = pending
    } else {
      if (!archived) return false
      matchesTab =
        activeTab === "all" ||
        (activeTab === "published" && thesis.isPublishedOnline) ||
        (activeTab === "unpublished" && !thesis.isPublishedOnline)
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

  const handleEdit = (thesisId: string) => {
    const thesis = theses.find(t => t.id === thesisId)
    if (thesis) {
      setThesisToEdit(thesis)
      setEditFormData({
        title: thesis.title,
        abstract: thesis.abstract,
        isPublishedOnline: thesis.isPublishedOnline,
        publisherName: thesis.publisherName || "",
        publisherLink: thesis.publisherLink || "",
        citation: thesis.citation || ""
      })
      setEditAuthors([...thesis.authors])
      setEditIndexings([...thesis.indexings])
      setEditDialogOpen(true)
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

  const handleEditSubmit = async () => {
    if (!thesisToEdit) return

    try {
      const response = await fetch(`/api/theses/${thesisToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editFormData.title,
          abstract: editFormData.abstract,
          isPublishedOnline: editFormData.isPublishedOnline,
          publisherName: editFormData.isPublishedOnline ? editFormData.publisherName : null,
          publisherLink: editFormData.isPublishedOnline ? editFormData.publisherLink : null,
          citation: editFormData.isPublishedOnline ? editFormData.citation : null,
          authors: editAuthors,
          indexings: editIndexings
        }),
      })

      if (response.ok) {
        toast.success("Thesis updated successfully!")
        setEditDialogOpen(false)
        setThesisToEdit(null)
        fetchTheses() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update thesis")
      }
    } catch (error) {
      console.error("Error updating thesis:", error)
      toast.error("Failed to update thesis")
    }
  }

  const addEditAuthor = () => {
    setEditAuthors([...editAuthors, ""])
  }

  const removeEditAuthor = (index: number) => {
    if (editAuthors.length > 1) {
      setEditAuthors(editAuthors.filter((_, i) => i !== index))
    }
  }

  const updateEditAuthor = (index: number, name: string) => {
    const updatedAuthors = editAuthors.map((author, i) => 
      i === index ? name : author
    )
    setEditAuthors(updatedAuthors)
  }

  const addEditIndexing = () => {
    setEditIndexings([...editIndexings, { type: "", url: "" }])
  }

  const removeEditIndexing = (index: number) => {
    if (editIndexings.length > 1) {
      setEditIndexings(editIndexings.filter((_, i) => i !== index))
    }
  }

  const updateEditIndexing = (index: number, field: 'type' | 'url', value: string) => {
    const updatedIndexings = editIndexings.map((indexing, i) => 
      i === index ? { ...indexing, [field]: value } : indexing
    )
    setEditIndexings(updatedIndexings)
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
      accessorKey: "createdAt",
      header: "Uploaded",
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </div>
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Thesis</h1>
            <p className="text-muted-foreground">
              Manage your uploaded thesis and publication information.
            </p>
          </div>
          <Button onClick={() => router.push("/program-head/upload")}>
            <Plus className="mr-2 h-4 w-4" />
            Upload New Thesis
          </Button>
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
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
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
                    <SelectItem key={year.id} value={year.name}>
                      {year.name}
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
                  <CardTitle>Thesis Management</CardTitle>
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Thesis</DialogTitle>
            <DialogDescription>
              Update the thesis information below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="Enter thesis title"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-abstract">Abstract</Label>
                <Textarea
                  id="edit-abstract"
                  value={editFormData.abstract}
                  onChange={(e) => setEditFormData({ ...editFormData, abstract: e.target.value })}
                  placeholder="Enter thesis abstract"
                  rows={6}
                />
              </div>
            </div>

            {/* Authors */}
            <div className="space-y-4">
              <Label>Authors</Label>
              {editAuthors.map((author, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={author}
                    onChange={(e) => updateEditAuthor(index, e.target.value)}
                    placeholder="Author name"
                    className="flex-1"
                  />
                  {editAuthors.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEditAuthor(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addEditAuthor}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Author
              </Button>
            </div>

            {/* Publication Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-published"
                  checked={editFormData.isPublishedOnline}
                  onCheckedChange={(checked) => 
                    setEditFormData({ ...editFormData, isPublishedOnline: checked as boolean })
                  }
                />
                <Label htmlFor="edit-published">Published Online</Label>
              </div>

              {editFormData.isPublishedOnline && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-publisher-name">Publisher Name</Label>
                    <Input
                      id="edit-publisher-name"
                      value={editFormData.publisherName}
                      onChange={(e) => setEditFormData({ ...editFormData, publisherName: e.target.value })}
                      placeholder="e.g., IEEE, ACM, Springer"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-publisher-link">Publisher Link</Label>
                    <Input
                      id="edit-publisher-link"
                      value={editFormData.publisherLink}
                      onChange={(e) => setEditFormData({ ...editFormData, publisherLink: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-citation">Citation</Label>
                    <Textarea
                      id="edit-citation"
                      value={editFormData.citation}
                      onChange={(e) => setEditFormData({ ...editFormData, citation: e.target.value })}
                      placeholder="APA, MLA, or other citation format"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Indexing References */}
            <div className="space-y-4">
              <Label>Indexing References</Label>
              {editIndexings.map((indexing, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Select
                    value={indexing.type}
                    onValueChange={(value) => updateEditIndexing(index, "type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Google Scholar">Google Scholar</SelectItem>
                      <SelectItem value="ResearchGate">ResearchGate</SelectItem>
                      <SelectItem value="IEEE Xplore">IEEE Xplore</SelectItem>
                      <SelectItem value="ACM Digital Library">ACM Digital Library</SelectItem>
                      <SelectItem value="SpringerLink">SpringerLink</SelectItem>
                      <SelectItem value="ScienceDirect">ScienceDirect</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={indexing.url}
                    onChange={(e) => updateEditIndexing(index, "url", e.target.value)}
                    placeholder="URL"
                  />
                  {editIndexings.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEditIndexing(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addEditIndexing}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Indexing Reference
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>
              Update Thesis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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