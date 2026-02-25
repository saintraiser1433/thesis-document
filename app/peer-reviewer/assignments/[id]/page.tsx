"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "react-toastify"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft, FileText, User, Send } from "lucide-react"
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

const RichTextEditor = dynamic(
  () => import("@/components/rich-text-editor").then((mod) => mod.RichTextEditor),
  { ssr: false }
)

interface AssignmentDetail {
  id: string
  order: number
  deadline: string
  status: string
  comment: string | null
  approved: boolean | null
  round: {
    id: string
    roundNumber: number
    status: string
    thesisFileUrl: string | null
  }
  scheduleId: string
  thesis: { id: string; title: string; fileUrl: string | null }
  priorReviews: Array<{
    reviewerName: string
    order: number
    comment: string | null
    approved: boolean | null
  }>
}

export default function PeerReviewerAssignmentDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState("")
  const [approved, setApproved] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/routing/assignment/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (approved === null) {
      toast.error("Please choose Approve or Request changes")
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmSubmit = async () => {
    if (!data) return
    if (approved === null) {
      toast.error("Please choose Approve or Request changes")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/routing/${data.scheduleId}/submit-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: data.id,
          comment: comment || undefined,
          approved,
        }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(result.error || "Failed to submit review")
        return
      }
      toast.success("Review submitted")
      setData((prev) =>
        prev
          ? {
              ...prev,
              status: approved ? "APPROVED" : "REJECTED",
              comment: comment || null,
              approved,
            }
          : null
      )
      setConfirmOpen(false)
    } catch {
      toast.error("Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit =
    data?.status === "IN_PROGRESS" || data?.status === "PENDING"

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading...</div>
      </DashboardLayout>
    )
  }

  const fileUrl = data.round.thesisFileUrl || data.thesis.fileUrl

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/peer-reviewer/assignments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6" />
              {data.thesis.title}
            </h1>
            <p className="text-muted-foreground">
              Round {data.round.roundNumber} · Reviewer {data.order} · Deadline:{" "}
              {new Date(data.deadline).toLocaleString()}
            </p>
          </div>
        </div>

        {data.priorReviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Prior reviews in this round</CardTitle>
              <CardDescription>Comments from previous reviewers</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.priorReviews.map((r, i) => (
                  <li key={i} className="border-b pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{r.reviewerName}</span>
                      <span className="text-sm text-muted-foreground">
                        {r.approved ? "Approved" : "Requested changes"}
                      </span>
                    </div>
                    {r.comment && (
                      <div
                        className="text-sm text-muted-foreground pl-6 mt-1 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: r.comment }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Thesis document</CardTitle>
            <CardDescription>
              {fileUrl
                ? "Read the thesis below or open it in a new tab."
                : "No file available"}
            </CardDescription>
          </CardHeader>
          {fileUrl && (
            <CardContent>
              <div className="flex items-center justify-end mb-3">
                <Button type="button" variant="outline" size="sm" asChild>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Open in new tab
                  </a>
                </Button>
              </div>
              <div className="h-[600px] w-full rounded-md border overflow-hidden bg-muted/30">
                <object
                  data={fileUrl}
                  type="application/pdf"
                  className="h-full w-full"
                >
                  <iframe
                    src={fileUrl}
                    title="Thesis PDF"
                    className="h-full w-full"
                  />
                  <div className="p-4 text-sm">
                    Unable to display PDF preview. You can
                    <button
                      type="button"
                      className="ml-1 underline"
                      onClick={() => window.open(fileUrl, "_blank")}
                    >
                      open it in a new tab
                    </button>
                    .
                  </div>
                </object>
              </div>
            </CardContent>
          )}
        </Card>

        {canSubmit && (
          <Card>
            <CardHeader>
              <CardTitle>Submit your review</CardTitle>
              <CardDescription>
                Add comments and approve or request changes. Submitting will pass the thesis to the next reviewer or complete the round.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Comments / revision suggestions</Label>
                  <RichTextEditor
                    value={comment}
                    onChange={setComment}
                    placeholder="Optional feedback for the author... (you can format text and add emphasis)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Decision</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="approved"
                        checked={approved === true}
                        onChange={() => setApproved(true)}
                      />
                      Approve
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="approved"
                        checked={approved === false}
                        onChange={() => setApproved(false)}
                      />
                      Request changes
                    </label>
                  </div>
                </div>
                <Button type="submit" disabled={submitting}>
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Submitting..." : "Submit review"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {!canSubmit && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                This assignment is already completed ({data.status}).
                {data.comment && (
                  <span
                    className="block mt-2 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: data.comment }}
                  />
                )}
              </p>
            </CardContent>
          </Card>
        )}

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit review?</AlertDialogTitle>
              <AlertDialogDescription>
                This will save your decision as{" "}
                <strong>{approved ? "Approve" : "Request changes"}</strong>
                {comment && (
                  <>
                    {" "}
                    with your comments:
                    <br />
                    <span className="italic block mt-1">
                      (Rich text preview will appear in the history after saving.)
                    </span>
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Yes, submit review"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
