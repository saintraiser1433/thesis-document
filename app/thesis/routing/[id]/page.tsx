"use client"

import { useState, useEffect, useRef } from "react"
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
  routingFileUrl?: string | null
  routingFileMime?: string | null
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
  const revisionFileInputRef = useRef<HTMLInputElement>(null)
  const [archiveUploading, setArchiveUploading] = useState(false)
  const [archivePdf, setArchivePdf] = useState<File | null>(null)
  const archivePdfInputRef = useRef<HTMLInputElement>(null)

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
    if (
      !revisionFile ||
      !["application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(
        revisionFile.type
      )
    ) {
      toast.error("Please select a DOCX file")
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

  const canUploadArchivePdf =
    schedule?.thesis?.userId === session?.user?.id &&
    schedule?.thesis?.routingStatus === "PENDING_ARCHIVE"
  const archivalUploadLocked = Boolean(schedule?.thesis?.fileUrl)

  const handleUploadArchivePdf = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!archivePdf || archivePdf.type !== "application/pdf") {
      toast.error("Please select a PDF file")
      return
    }
    if (archivePdf.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB")
      return
    }

    setArchiveUploading(true)
    try {
      const form = new FormData()
      form.append("file", archivePdf)
      const res = await fetch(`/api/archive/${schedule.thesis.id}/upload-pdf`, {
        method: "POST",
        body: form,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Failed to upload archival PDF")
        return
      }
      toast.success("Archival PDF uploaded. Awaiting program head approval.")
      setArchivePdf(null)
      fetchSchedule()
    } catch {
      toast.error("Failed to upload archival PDF")
    } finally {
      setArchiveUploading(false)
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
                Round {nextRoundNumber - 1} is complete. Upload your revised DOCX to start round {nextRoundNumber}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitRevision} className="space-y-4">
                <div className="space-y-2">
                  <Label>Revised thesis (DOCX only, max 10MB)</Label>
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-4 bg-muted/20">
                    <input
                      ref={revisionFileInputRef}
                      type="file"
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => setRevisionFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-3 text-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => revisionFileInputRef.current?.click()}
                      >
                        Choose DOCX file
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Drag-and-drop style uploader for routing revisions.
                      </p>
                      {revisionFile && (
                        <span className="text-sm text-muted-foreground">{revisionFile.name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button type="submit" disabled={uploading || !revisionFile}>
                  {uploading ? "Uploading..." : "Submit revision"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {canUploadArchivePdf && (
          <Card>
            <CardHeader>
              <CardTitle>Upload archival PDF</CardTitle>
              <CardDescription>
                Your thesis is pending archive approval. Upload the final PDF for archiving so the Program Head can review and approve.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 px-4 py-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Status: </span>
                  {schedule.thesis.fileUrl ? (
                    <span className="font-medium">Uploaded</span>
                  ) : (
                    <span className="font-medium">Not uploaded</span>
                  )}
                </div>
                {schedule.thesis.fileUrl && (
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a
                      href={schedule.thesis.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View uploaded PDF
                    </a>
                  </Button>
                )}
              </div>
              <form onSubmit={handleUploadArchivePdf} className="space-y-4">
                <div className="space-y-2">
                  <Label>Final thesis (PDF only, max 10MB)</Label>
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-4 bg-muted/20">
                    <input
                      ref={archivePdfInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => setArchivePdf(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-3 text-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => archivePdfInputRef.current?.click()}
                        disabled={archivalUploadLocked}
                      >
                        Choose PDF file
                      </Button>
                      {archivePdf && (
                        <span className="text-sm text-muted-foreground">{archivePdf.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {archivalUploadLocked && (
                  <p className="text-xs text-muted-foreground">
                    Upload is disabled because a final archival PDF is already uploaded. You can upload again only after archive rejection.
                  </p>
                )}
                <Button type="submit" disabled={archivalUploadLocked || archiveUploading || !archivePdf}>
                  {archiveUploading ? "Uploading..." : "Upload archival PDF"}
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
                  {(round.routingFileUrl || round.thesisFileUrl) && (
                    <a
                      href={round.routingFileUrl || round.thesisFileUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-primary underline"
                    >
                      View document
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
