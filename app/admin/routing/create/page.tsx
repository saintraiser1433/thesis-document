"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ClipboardList } from "lucide-react"

interface Thesis {
  id: string
  title: string
  routingStatus: string
  departmentId?: string | null
  departmentName?: string | null
  user?: { name: string }
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function AdminRoutingCreatePage() {
  const router = useRouter()
  const [theses, setTheses] = useState<Thesis[]>([])
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("")
  const [reviewers, setReviewers] = useState<User[]>([])
  const [thesisId, setThesisId] = useState("")
  const [reviewer1Id, setReviewer1Id] = useState("")
  const [reviewer2Id, setReviewer2Id] = useState("")
  const [startDate, setStartDate] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([fetch("/api/theses"), fetch("/api/users"), fetch("/api/departments")]).then(
      async ([tRes, uRes, dRes]) => {
        if (tRes.ok) {
          const tData = await tRes.json()
          setTheses(
            tData
              .filter((t: Thesis) => t.routingStatus === "PENDING_REVIEW")
              .map((t: any) => ({
                id: t.id,
                title: t.title,
                routingStatus: t.routingStatus,
                departmentId: t.departmentId ?? t.user?.departmentId ?? null,
                departmentName: t.departmentName ?? t.user?.department?.name ?? null,
                user: t.user,
              }))
          )
        }
        if (uRes.ok) {
          const uData = await uRes.json()
          setReviewers(uData.filter((u: User) => u.role === "PEER_REVIEWER"))
        }
        if (dRes.ok) {
          const dData = await dRes.json()
          setDepartments(dData)
        }
      }
    )
  }, [])

  const filteredTheses = selectedDepartmentId
    ? theses.filter((t) => t.departmentId === selectedDepartmentId)
    : theses

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDepartmentId || !thesisId || !reviewer1Id || !reviewer2Id || !startDate) {
      toast.error("Please select department, thesis, reviewers and start date")
      return
    }
    if (reviewer1Id === reviewer2Id) {
      toast.error("Select two different reviewers")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thesisId,
          reviewer1Id,
          reviewer2Id,
          startDate: new Date(startDate).toISOString(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Failed to create schedule")
        return
      }
      toast.success("Routing schedule created")
      router.push(`/admin/routing/${data.id}`)
    } catch {
      toast.error("Failed to create schedule")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/routing">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              Create Routing Schedule
            </h1>
            <p className="text-muted-foreground">
              Select a thesis and assign two peer reviewers with a start date.
            </p>
          </div>
        </div>

        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>New Schedule</CardTitle>
            <CardDescription>
              Thesis must be submitted for routing by the student first (status: Pending Review).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={selectedDepartmentId}
                  onValueChange={(value) => {
                    setSelectedDepartmentId(value)
                    setThesisId("")
                  }}
                  required
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedDepartmentId && (
                <div className="space-y-2">
                  <Label htmlFor="thesis">Thesis (Pending Review)</Label>
                  <Select value={thesisId} onValueChange={setThesisId} required>
                    <SelectTrigger id="thesis">
                      <SelectValue placeholder="Select thesis" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTheses.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                      {filteredTheses.length === 0 && (
                        <SelectItem value="none" disabled>
                          No thesis pending review for this department
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="reviewer1">Peer Reviewer 1</Label>
                <Select value={reviewer1Id} onValueChange={setReviewer1Id} required>
                  <SelectTrigger id="reviewer1">
                    <SelectValue placeholder="Select reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                    {reviewers.length === 0 && (
                      <SelectItem value="none" disabled>
                        No peer reviewers. Add users with Peer Reviewer role.
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewer2">Peer Reviewer 2</Label>
                <Select value={reviewer2Id} onValueChange={setReviewer2Id} required>
                  <SelectTrigger id="reviewer2">
                    <SelectValue placeholder="Select reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Each reviewer has 2 weeks. Reviewer 1 deadline = start + 14 days, Reviewer 2 = start + 28 days.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Schedule"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin/routing">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
