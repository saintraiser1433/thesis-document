"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { toast } from "react-toastify"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ArrowLeft, FileText, User, Upload } from "lucide-react"

interface Assignment {
  id: string
  reviewer: { name: string; email: string }
  order: number
  deadline: string
  status: string
  comment: string | null
  approved: boolean | null
  reviewedAt: string | null
}

interface Round {
  id: string
  roundNumber: number
  status: string
  thesisFileUrl: string | null
  startedAt: string | null
  completedAt: string | null
  assignments: Assignment[]
}

interface Schedule {
  id: string
  thesisId: string
  thesis: {
    id: string
    title: string
    routingStatus: string
    fileUrl: string | null
  }
  status: string
  rounds: Round[]
}

export default function ThesisRoutingDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { data: session } = useSession()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [revisionFile, setRevisionFile] = useState<File | null>(null)

  const fetchSchedule = async () => {
    try {
      const res = await fetch(`/api/routing/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSchedule(data)
      } else {
        toast.error("Failed to load schedule")
      }
    } catch {
      toast.error("Failed to load schedule")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedule()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- id is the only needed dependency
  }, [id])

  const completedRounds = schedule?.rounds?.filter((r) => r.status === "COMPLETED") ?? []
  const nextRoundNumber = completedRounds.length + 1
  const canSubmitRevision =
    schedule?.thesis?.userId === session?.user?.id &&
    schedule?.status === "ACTIVE" &&
    nextRoundNumber <= 3 &&
    completedRounds.length > 0

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!revisionFile || revisionFile.type !== "application/pdf") {
      toast.error("Please select a PDF file")
      return
    }
    if (revisionFile.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB")
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", revisionFile)
      const res = await fetch(`/api/routing/${id}/submit-revision`, {
        method: "POST",
        body: form,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Failed to upload revision")
        return
      }
      toast.success("Revision submitted for round " + data.roundNumber)
      setRevisionFile(null)
      fetchSchedule()
    } catch {
      toast.error("Failed to upload revision")
    } finally {
      setUploading(false)
    }
  }

  const statusColor = (s: string) => {
    if (s === "COMPLETED" || s === "APPROVED") return "default"
    if (s === "IN_PROGRESS" || s === "PENDING") return "secondary"
    return "outline"
  }

  if (loading || !schedule) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/thesis/routing">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6" />
              {schedule.thesis?.title}
            </h1>
            <p className="text-muted-foreground">
              Routing progress · Schedule: <Badge variant="outline">{schedule.status}</Badge>
              {" · "}
              Thesis: <Badge variant="outline">{schedule.thesis?.routingStatus}</Badge>
            </p>
          </div>
        </div>

        {canSubmitRevision && (
          <Card>
            <CardHeader>
              <CardTitle>Submit revision for Round {nextRoundNumber}</CardTitle>
              <CardDescription>
                Round {nextRoundNumber - 1} is complete. Upload your revised PDF to start round {nextRoundNumber}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitRevision} className="space-y-4">
                <div className="space-y-2">
                  <Label>Revised thesis (PDF, max 10MB)</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      id="revision-file"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setRevisionFile(e.target.files?.[0] ?? null)}
                      className="sr-only"
                    />
                    <Label
                      htmlFor="revision-file"
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Upload className="h-4 w-4" />
                      Choose file
                    </Label>
                    {revisionFile && (
                      <span className="text-sm text-muted-foreground">
                        {revisionFile.name}
                      </span>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={uploading || !revisionFile}>
                  {uploading ? "Uploading..." : "Submit revision"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {schedule.rounds?.map((round) => (
            <Card key={round.id}>
              <CardHeader>
                <CardTitle>Round {round.roundNumber}</CardTitle>
                <CardDescription>
                  <Badge variant={statusColor(round.status)}>{round.status}</Badge>
                  {round.thesisFileUrl && (
                    <a
                      href={round.thesisFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-primary underline"
                    >
                      View PDF
                    </a>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {round.assignments?.map((a) => (
                    <li key={a.id} className="border-b pb-3 last:border-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{a.reviewer.name}</span>
                        <Badge variant={statusColor(a.status)}>{a.status}</Badge>
                        {a.reviewedAt && (
                          <span className="text-sm text-muted-foreground">
                            {new Date(a.reviewedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {a.comment && (
                        <div className="mt-2 text-sm text-muted-foreground pl-6">
                          <span className="font-semibold">Comment:</span>
                          <div
                            className="prose prose-sm max-w-none mt-1"
                            dangerouslySetInnerHTML={{ __html: a.comment }}
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
