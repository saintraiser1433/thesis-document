"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GradientBadge } from "@/components/ui/gradient-badge"
import { Archive, FileText, Check, X, Inbox } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"

interface Thesis {
  id: string
  title: string
  routingStatus: string
  abstract?: string
  user?: { name: string }
  createdAt?: string
}

export default function ProgramHeadArchiveApprovalsPage() {
  const [theses, setTheses] = useState<Thesis[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [selectedThesis, setSelectedThesis] = useState<Thesis | null>(null)
  const [thesisToApprove, setThesisToApprove] = useState<Thesis | null>(null)
  const [rejectComment, setRejectComment] = useState("")

  useEffect(() => {
    fetch("/api/theses")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Thesis[]) => {
        setTheses(data.filter((t) => t.routingStatus === "PENDING_ARCHIVE"))
      })
      .finally(() => setLoading(false))
  }, [])

  const handleOpenApprove = (thesis: Thesis) => {
    setThesisToApprove(thesis)
    setApproveOpen(true)
  }

  const handleApprove = async () => {
    if (!thesisToApprove) return
    const thesisId = thesisToApprove.id
    try {
      const res = await fetch(`/api/archive/${thesisId}/approve`, {
        method: "POST",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Failed to approve")
        return
      }
      toast.success("Thesis archived")
      setTheses((prev) => prev.filter((t) => t.id !== thesisId))
      setApproveOpen(false)
      setThesisToApprove(null)
    } catch {
      toast.error("Failed to approve")
    }
  }

  const handleOpenReject = (thesis: Thesis) => {
    setSelectedThesis(thesis)
    setRejectComment("")
    setRejectOpen(true)
  }

  const handleReject = async () => {
    if (!selectedThesis) return
    try {
      const res = await fetch(`/api/archive/${selectedThesis.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: rejectComment }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Failed to reject")
        return
      }
      toast.success("Archive request rejected; thesis returned to routing")
      setTheses((prev) => prev.filter((t) => t.id !== selectedThesis.id))
      setRejectOpen(false)
      setSelectedThesis(null)
    } catch {
      toast.error("Failed to reject")
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Archive className="h-6 w-6" />
            Archive approvals
          </h1>
          <p className="text-muted-foreground">
            Thesis that panels have fully approved and are pending your archive decision.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending approval</CardTitle>
            <CardDescription>
              Thesis listed below are ready for archiving after peer review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground py-8 text-center">Loading...</p>
            ) : theses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground/60 mb-3" />
                <p className="text-muted-foreground">
                  No thesis pending archive approval.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {theses.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-4 border rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{t.title}</p>
                        {t.user?.name && (
                          <p className="text-sm text-muted-foreground">
                            {t.user.name}
                          </p>
                        )}
                      </div>
                      <GradientBadge variant="default">{t.routingStatus}</GradientBadge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenReject(t)}>
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => handleOpenApprove(t)}>
                        <Check className="h-4 w-4 mr-2" />
                        Approve archive
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve archive?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to approve archiving this thesis? It will be marked as archived and available in the thesis archive.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {thesisToApprove && (
              <p className="text-sm font-medium">
                Thesis: {thesisToApprove.title}
              </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setThesisToApprove(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleApprove}>
                Approve archive
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject archive request?</AlertDialogTitle>
              <AlertDialogDescription>
                This will send the thesis back to routing so the student/teacher can revise and continue rounds.
                You can optionally add a comment that will be sent to the author.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 mt-2">
              <p className="text-sm font-medium">
                Thesis: {selectedThesis?.title}
              </p>
              <Textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Optional comments or reasons for rejection..."
                rows={3}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReject}>
                Reject and continue routing
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
