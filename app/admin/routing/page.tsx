"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GradientBadge } from "@/components/ui/gradient-badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { ClipboardList, Plus, Eye, FileText, X } from "lucide-react"

interface Round {
  id: string
  roundNumber: number
  status: string
  assignments: Array<{
    id: string
    reviewer: { name: string; email: string }
    order: number
    deadline: string
    status: string
  }>
}

interface Schedule {
  id: string
  thesisId: string
  thesis: {
    id: string
    title: string
    routingStatus: string
    user: { name: string; email: string }
  }
  admin: { name: string; email: string }
  startDate: string
  status: string
  rounds: Round[]
  createdAt: string
}

interface ThesisOption {
  id: string
  title: string
  routingStatus: string
}

interface ReviewerOption {
  id: string
  name: string
  email: string
  role: string
}

export default function AdminRoutingPage() {
  const router = useRouter()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [theses, setTheses] = useState<ThesisOption[]>([])
  const [reviewers, setReviewers] = useState<ReviewerOption[]>([])
  const [thesisId, setThesisId] = useState("")
  const [selectedReviewerId, setSelectedReviewerId] = useState("")
  const [assignedReviewers, setAssignedReviewers] = useState<ReviewerOption[]>([])
  const [startDate, setStartDate] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchSchedules()
  }, [])

  useEffect(() => {
    if (createOpen) {
      Promise.all([fetch("/api/theses"), fetch("/api/users")]).then(
        async ([tRes, uRes]) => {
          if (tRes.ok) {
            const tData = await tRes.json()
            setTheses(tData.filter((t: ThesisOption) => t.routingStatus === "PENDING_REVIEW"))
          }
          if (uRes.ok) {
            const uData = await uRes.json()
            setReviewers(uData.filter((u: ReviewerOption) => u.role === "PEER_REVIEWER"))
          }
        }
      )
    }
  }, [createOpen])

  const handleAddReviewer = () => {
    if (!selectedReviewerId) return
    const reviewer = reviewers.find((r) => r.id === selectedReviewerId)
    if (!reviewer) return
    if (assignedReviewers.some((r) => r.id === reviewer.id)) {
      toast.error("Reviewer already added")
      return
    }
    setAssignedReviewers((prev) => [...prev, reviewer])
    setSelectedReviewerId("")
  }

  const handleRemoveReviewer = (id: string) => {
    setAssignedReviewers((prev) => prev.filter((r) => r.id !== id))
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!thesisId || !startDate) {
      toast.error("Please select thesis and start date")
      return
    }
    if (assignedReviewers.length === 0) {
      toast.error("Please add at least one peer reviewer")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thesisId,
          reviewerIds: assignedReviewers.map((r) => r.id),
          startDate: new Date(startDate).toISOString(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Failed to create schedule")
        return
      }
      toast.success("Routing schedule created")
      setCreateOpen(false)
      setThesisId("")
      setAssignedReviewers([])
      setSelectedReviewerId("")
      setStartDate("")
      fetchSchedules()
      router.push(`/admin/routing/${data.id}`)
    } catch {
      toast.error("Failed to create schedule")
    } finally {
      setSubmitting(false)
    }
  }

  const fetchSchedules = async () => {
    try {
      const res = await fetch("/api/routing")
      if (res.ok) {
        const data = await res.json()
        setSchedules(data)
      } else {
        toast.error("Failed to fetch schedules")
      }
    } catch {
      toast.error("Failed to fetch schedules")
    } finally {
      setLoading(false)
    }
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default"
      case "COMPLETED":
        return "secondary"
      case "CANCELLED":
        return "destructive"
      default:
        return "outline"
    }
  }

  const columns: ColumnDef<Schedule>[] = [
    {
      accessorKey: "thesis.title",
      header: "Thesis",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.thesis?.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "thesis.user.name",
      header: "Owner",
      cell: ({ row }) => row.original.thesis?.user?.name ?? "—",
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) =>
        new Date(row.original.startDate).toLocaleDateString(),
    },
    {
      accessorKey: "status",
      header: "Schedule Status",
      cell: ({ row }) => (
        <GradientBadge variant="default">
          {row.original.status}
        </GradientBadge>
      ),
    },
    {
      id: "rounds",
      header: "Rounds",
      cell: ({ row }) => {
        const r = row.original.rounds
        const completed = r?.filter((x) => x.status === "COMPLETED").length ?? 0
        return `${completed}/3`
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/routing/${row.original.id}`}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Link>
        </Button>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Routing Schedules
          </h1>
          <p className="text-muted-foreground">
            Create and manage thesis routing schedules. Assign peer reviewers and set deadlines.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Schedules</CardTitle>
              <CardDescription>All routing schedules</CardDescription>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Routing Schedule</DialogTitle>
                  <DialogDescription>
                    Select a thesis (pending review) and assign one or more peer reviewers with a start date. Each reviewer has 2 weeks in sequence.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="modal-thesis">Thesis (Pending Review)</Label>
                    <Select value={thesisId} onValueChange={setThesisId} required>
                      <SelectTrigger id="modal-thesis">
                        <SelectValue placeholder="Select thesis" />
                      </SelectTrigger>
                      <SelectContent>
                        {theses.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.title}
                          </SelectItem>
                        ))}
                        {theses.length === 0 && (
                          <SelectItem value="none" disabled>
                            No thesis pending review
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-reviewer">Peer Reviewers</Label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedReviewerId}
                        onValueChange={setSelectedReviewerId}
                      >
                        <SelectTrigger id="modal-reviewer" className="flex-1">
                          <SelectValue placeholder="Select reviewer" />
                        </SelectTrigger>
                        <SelectContent>
                          {reviewers
                            .filter(
                              (u) =>
                                !assignedReviewers.some((ar) => ar.id === u.id)
                            )
                            .map((u) => (
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
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddReviewer}
                        disabled={!selectedReviewerId}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {assignedReviewers.map((r) => (
                        <Badge
                          key={r.id}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {r.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveReviewer(r.id)}
                            className="ml-1 inline-flex items-center justify-center rounded-full hover:bg-secondary/70"
                            aria-label={`Remove ${r.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reviewers are activated in order. Each reviewer has 2 weeks; the next reviewer starts after the previous finishes or times out.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-startDate">Start Date</Label>
                    <Input
                      id="modal-startDate"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Reviewer 1 deadline = start + 14 days, Reviewer 2 = start + 28 days.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Creating..." : "Create Schedule"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground py-8 text-center">Loading...</p>
            ) : schedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground/60 mb-4" />
                <p className="text-muted-foreground">
                  No routing schedules yet. Create one from a thesis that is pending review.
                </p>
              </div>
            ) : (
              <DataTable columns={columns} data={schedules} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
