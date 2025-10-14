"use client"

import { useState, useEffect } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "react-toastify"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { GradientBadge } from "@/components/ui/gradient-badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { ThesisGroupedView } from "@/components/thesis-grouped-view"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Search, Download, ExternalLink, FileText, Calendar, User, Tag, Eye, Grid, List } from "lucide-react"

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

interface SearchFilters {
  query: string
  category: string
  schoolYear: string
  publishedOnly: boolean
}

export default function ThesisSearchPage() {
  const [theses, setTheses] = useState<Thesis[]>([])
  const [searchResults, setSearchResults] = useState<Thesis[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "grouped">("grouped")
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "all",
    schoolYear: "all",
    publishedOnly: false
  })

  // Mock data - in real app, this would come from API
  useEffect(() => {
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
      },
      {
        id: "4",
        title: "Artificial Intelligence in Educational Assessment",
        abstract: "This research investigates the application of AI technologies in educational assessment systems, focusing on automated grading and personalized learning recommendations.",
        authors: ["Emma Wilson", "Michael Chen"],
        category: "Computer Science",
        course: "Bachelor of Science in Information Technology",
        courseCode: "BSIT",
        schoolYear: "2022-2023",
        isPublishedOnline: false,
        indexings: [],
        uploadedBy: "Dr. Program Head",
        createdAt: "2023-11-15"
      }
    ]
    setTheses(mockTheses)
  }, [])

  const categories = ["Computer Science", "Information Technology", "Software Engineering", "Data Science", "Cybersecurity"]
  const schoolYears = ["2022-2023", "2023-2024", "2024-2025"]

  const handleSearch = async () => {
    setIsSearching(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    let results = theses.filter(thesis => {
      // Text search
      const queryMatch = !filters.query || 
        thesis.title.toLowerCase().includes(filters.query.toLowerCase()) ||
        thesis.abstract.toLowerCase().includes(filters.query.toLowerCase()) ||
        thesis.authors.some(author => author.toLowerCase().includes(filters.query.toLowerCase()))
      
      // Category filter
      const categoryMatch = filters.category === "all" || thesis.category === filters.category
      
      // School year filter
      const yearMatch = filters.schoolYear === "all" || thesis.schoolYear === filters.schoolYear
      
      // Published filter
      const publishedMatch = !filters.publishedOnly || thesis.isPublishedOnline
      
      return queryMatch && categoryMatch && yearMatch && publishedMatch
    })
    
    setSearchResults(results)
    setIsSearching(false)
  }

  const handleDownload = (thesisId: string) => {
    console.log("Downloading thesis:", thesisId)
    toast.success("Download started!")
  }

  const handleView = (thesisId: string) => {
    console.log("Viewing thesis:", thesisId)
    toast.info("Opening thesis viewer...")
  }

  const columns: ColumnDef<Thesis>[] = [
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
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(row.original.id)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Details</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(row.original.id)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download PDF</p>
              </TooltipContent>
            </Tooltip>
            {row.original.isPublishedOnline && row.original.publisherLink && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(row.original.publisherLink, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Online</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search Thesis</h1>
          <p className="text-muted-foreground">
            Use advanced search to find specific thesis in the archive.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Search Filters
            </CardTitle>
            <CardDescription>
              Use the filters below to find thesis that match your criteria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search-keyword">Keyword</Label>
                <Input
                  id="search-keyword"
                  placeholder="Enter keywords (title, abstract, author)"
                  value={filters.query}
                  onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-category">Category</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger id="search-category">
                    <SelectValue placeholder="Select category" />
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-schoolYear">School Year</Label>
                <Select value={filters.schoolYear} onValueChange={(value) => setFilters(prev => ({ ...prev, schoolYear: value }))}>
                  <SelectTrigger id="search-schoolYear">
                    <SelectValue placeholder="Select school year" />
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="search-published"
                checked={filters.publishedOnly}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, publishedOnly: checked as boolean }))}
              />
              <Label htmlFor="search-published">Only show published online</Label>
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="mr-2 h-4 w-4" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </CardContent>
        </Card>

        {searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Search Results</CardTitle>
                  <CardDescription>
                    {searchResults.length} {searchResults.length === 1 ? 'thesis' : 'thesis'} found
                  </CardDescription>
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
            </CardHeader>
            <CardContent>
              {viewMode === "grouped" ? (
                <ThesisGroupedView 
                  theses={searchResults}
                  onView={(thesisId) => console.log("View thesis:", thesisId)}
                  onDownload={(thesisId) => console.log("Download thesis:", thesisId)}
                />
              ) : (
                <DataTable 
                  columns={columns} 
                  data={searchResults}
                  searchKey="title"
                  searchPlaceholder="Search within results..."
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}