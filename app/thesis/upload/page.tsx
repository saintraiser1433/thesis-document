"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X, FileText } from "lucide-react"
import { FileUpload } from "@/components/file-upload"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Author {
  name: string
}

interface Indexing {
  type: string
  url: string
}

export default function ThesisUploadPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    categoryId: "",
    courseId: "",
    schoolYear: "",
    isPublishedOnline: false,
    publisherName: "",
    publisherLink: "",
    citation: ""
  })
  const [authors, setAuthors] = useState<Author[]>([{ name: "" }])
  const [indexings, setIndexings] = useState<Indexing[]>([{ type: "", url: "" }])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("")
  const [schoolYears, setSchoolYears] = useState<string[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const schoolYearsRes = await fetch('/api/school-years')
        if (schoolYearsRes.ok) {
          const schoolYearsData = await schoolYearsRes.json()
          setSchoolYears(schoolYearsData.map((sy: { name: string }) => sy.name))
        }
        const categoriesRes = await fetch('/api/categories')
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData)
        }
        const coursesRes = await fetch('/api/courses')
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json()
          setCourses(coursesData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadData()
  }, [])

  const indexingTypes = [
    "Google Scholar",
    "ResearchGate",
    "IEEE Xplore",
    "ACM Digital Library",
    "SpringerLink",
    "ScienceDirect",
    "Other"
  ]

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
  }

  const handleUploadComplete = (fileUrl: string) => {
    setUploadedFileUrl(fileUrl)
  }

  const addAuthor = () => {
    setAuthors([...authors, { name: "" }])
  }

  const removeAuthor = (index: number) => {
    if (authors.length > 1) {
      setAuthors(authors.filter((_, i) => i !== index))
    }
  }

  const updateAuthor = (index: number, name: string) => {
    const updatedAuthors = authors.map((author, i) =>
      i === index ? { ...author, name } : author
    )
    setAuthors(updatedAuthors)
  }

  const addIndexing = () => {
    setIndexings([...indexings, { type: "", url: "" }])
  }

  const removeIndexing = (index: number) => {
    if (indexings.length > 1) {
      setIndexings(indexings.filter((_, i) => i !== index))
    }
  }

  const updateIndexing = (index: number, field: keyof Indexing, value: string) => {
    const updatedIndexings = indexings.map((indexing, i) =>
      i === index ? { ...indexing, [field]: value } : indexing
    )
    setIndexings(updatedIndexings)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.abstract || !formData.categoryId || !formData.courseId || !formData.schoolYear) {
      toast.error("Please fill in all required fields")
      return
    }
    if (!selectedFile || !uploadedFileUrl) {
      toast.error("Please upload a PDF file")
      return
    }
    const validAuthors = authors.filter(author => author.name.trim())
    if (validAuthors.length === 0) {
      toast.error("Please add at least one author")
      return
    }
    setShowConfirmDialog(true)
  }

  const handleConfirmUpload = async () => {
    setIsSubmitting(true)
    setShowConfirmDialog(false)
    try {
      const schoolYearRes = await fetch('/api/school-years')
      const schoolYears = await schoolYearRes.json()
      const selectedSchoolYear = schoolYears.find((sy: { name: string }) => sy.name === formData.schoolYear)
      if (!selectedSchoolYear) {
        toast.error("Selected school year not found")
        return
      }
      const thesisData = {
        title: formData.title,
        abstract: formData.abstract,
        categoryId: formData.categoryId,
        courseId: formData.courseId,
        schoolYearId: selectedSchoolYear.id,
        fileUrl: uploadedFileUrl,
        isPublishedOnline: formData.isPublishedOnline,
        publisherName: formData.publisherName || null,
        publisherLink: formData.publisherLink || null,
        citation: formData.citation || null,
        authors: authors.filter(author => author.name.trim()).map(author => author.name),
        indexings: indexings.filter(idx => idx.type && idx.url)
      }
      const response = await fetch('/api/theses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thesisData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload thesis')
      }
      toast.success("Thesis uploaded successfully and submitted for routing.")
      setTimeout(() => {
        router.push("/thesis/routing")
      }, 1500)
    } catch (error) {
      console.error("Error uploading thesis:", error)
      toast.error(error instanceof Error ? error.message : "Error uploading thesis. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Thesis</h1>
          <p className="text-muted-foreground">
            Upload your thesis paper. After uploading, it is automatically submitted for routing (3 rounds of peer review). When approved by the program head, it will be archived.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thesis Information</CardTitle>
              <CardDescription>Basic information about the thesis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter thesis title"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="abstract">Abstract *</Label>
                <Textarea
                  id="abstract"
                  value={formData.abstract}
                  onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                  placeholder="Enter thesis abstract"
                  rows={6}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="course">Course *</Label>
                  <Select
                    value={formData.courseId}
                    onValueChange={(value) => setFormData({ ...formData, courseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="schoolYear">School Year *</Label>
                  <Select
                    value={formData.schoolYear}
                    onValueChange={(value) => setFormData({ ...formData, schoolYear: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select school year" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolYears.map(year => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authors</CardTitle>
              <CardDescription>Add all authors of the thesis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authors.map((author, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={author.name}
                    onChange={(e) => updateAuthor(index, e.target.value)}
                    placeholder="Author name"
                    className="flex-1"
                  />
                  {authors.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAuthor(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addAuthor} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Author
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
              <CardDescription>Upload the thesis PDF file (required for routing)</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={handleFileSelect}
                onUploadComplete={handleUploadComplete}
                accept=".pdf"
                maxSize={10}
              />
              {uploadedFileUrl && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground truncate">
                      Preview: {uploadedFileUrl}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.open(uploadedFileUrl, "_blank")}
                      >
                        <FileText className="h-4 w-4 mr-2" /> View in new tab
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const a = document.createElement('a')
                          a.href = uploadedFileUrl
                          a.download = uploadedFileUrl.split('/').pop() || 'thesis.pdf'
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                        }}
                      >
                        Download PDF
                      </Button>
                    </div>
                  </div>
                  <div className="h-[600px] w-full rounded-md border overflow-hidden bg-muted/30">
                    <object
                      data={uploadedFileUrl}
                      type="application/pdf"
                      className="h-full w-full"
                    >
                      <iframe
                        src={uploadedFileUrl}
                        title="PDF Preview"
                        className="h-full w-full"
                      />
                      <div className="p-4 text-sm">
                        Unable to display PDF preview. You can
                        <button
                          type="button"
                          className="ml-1 underline"
                          onClick={() => window.open(uploadedFileUrl, "_blank")}
                        >
                          open it in a new tab
                        </button>
                        .
                      </div>
                    </object>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publication Information</CardTitle>
              <CardDescription>Optional: Mark if published online and add publication details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="published"
                  checked={formData.isPublishedOnline}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPublishedOnline: checked as boolean })
                  }
                />
                <Label htmlFor="published">Published Online</Label>
              </div>
              {formData.isPublishedOnline && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="publisherName">Publisher Name</Label>
                    <Input
                      id="publisherName"
                      value={formData.publisherName}
                      onChange={(e) => setFormData({ ...formData, publisherName: e.target.value })}
                      placeholder="e.g., IEEE, ACM, Springer"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="publisherLink">Publisher Link</Label>
                    <Input
                      id="publisherLink"
                      value={formData.publisherLink}
                      onChange={(e) => setFormData({ ...formData, publisherLink: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="citation">Citation</Label>
                    <Textarea
                      id="citation"
                      value={formData.citation}
                      onChange={(e) => setFormData({ ...formData, citation: e.target.value })}
                      placeholder="APA, MLA, or other citation format"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Indexing References</CardTitle>
              <CardDescription>Optional: Add indexing references where the thesis can be found</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {indexings.map((indexing, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Select
                    value={indexing.type}
                    onValueChange={(value) => updateIndexing(index, "type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {indexingTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={indexing.url}
                    onChange={(e) => updateIndexing(index, "url", e.target.value)}
                    placeholder="URL"
                  />
                  {indexings.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeIndexing(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addIndexing} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Indexing Reference
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Upload Thesis"}
            </Button>
          </div>
        </form>

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Thesis Upload</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to upload this thesis?
                <br /><br />
                <strong>Title:</strong> {formData.title}
                <br />
                <strong>Category:</strong> {categories.find(c => c.id === formData.categoryId)?.name}
                <br />
                <strong>Course:</strong> {courses.find(c => c.id === formData.courseId)?.name}
                <br />
                <strong>School Year:</strong> {formData.schoolYear}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmUpload}>
                Upload Thesis
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
