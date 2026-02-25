"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "react-toastify"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GradientBadge } from "@/components/ui/gradient-badge"
import { ArrowLeft, FileText, User, RefreshCw } from "lucide-react"

interface Assignment {
  id: string
  reviewer: { id: string; name: string; email: string }
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
    user: { name: string; email: string }
  }
  admin: { name: string; email: string }
  startDate: string
  status: string
  rounds: Round[]
}

export default function AdminRoutingDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSchedule = async (advance = false) => {
    try {
      if (advance) {
        await fetch(`/api/routing/${id}/advance-deadlines`, { method: "POST" })
      }
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
    fetchSchedule(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- id is the only needed dependency
  }, [id])

  const statusColor = (s: string) => {
    if (s === "COMPLETED" || s === "APPROVED") return "default"
    if (s === "IN_PROGRESS" || s === "PENDING") return "secondary"
    if (s === "SKIPPED" || s === "REJECTED") return "destructive"
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/routing">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="h-6 w-6" />
                {schedule.thesis?.title}
              </h1>
              <p className="text-muted-foreground flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1">
                  Schedule status:
                  <GradientBadge variant="default">{schedule.status}</GradientBadge>
                </span>
                <span className="flex items-center gap-1">
                  Thesis:
                  <GradientBadge variant="default">{schedule.thesis?.routingStatus}</GradientBadge>
                </span>
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchSchedule(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Check deadlines
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Schedule Info</CardTitle>
            <CardDescription>
              Start: {new Date(schedule.startDate).toLocaleString()} · Admin: {schedule.admin?.name} · Owner: {schedule.thesis?.user?.name}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {schedule.rounds?.map((round) => (
            <Card key={round.id}>
              <CardHeader>
                <CardTitle>Round {round.roundNumber}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1">
                    Status:
                    <GradientBadge variant="default">{round.status}</GradientBadge>
                  </span>
                  {round.startedAt && ` · Started: ${new Date(round.startedAt).toLocaleDateString()}`}
                  {round.completedAt && ` · Completed: ${new Date(round.completedAt).toLocaleDateString()}`}
                  {round.thesisFileUrl && (
                    <span className="block mt-1">
                      <a href={round.thesisFileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        View PDF
                      </a>
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {round.assignments?.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-2 border-b pb-2 last:border-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{a.reviewer.name}</span>
                      <Badge variant={statusColor(a.status)}>{a.status}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Deadline: {new Date(a.deadline).toLocaleString()}
                      </span>
                      {a.reviewedAt && (
                        <span className="text-sm">Reviewed: {new Date(a.reviewedAt).toLocaleString()}</span>
                      )}
                      {a.comment && (
                        <div className="w-full text-sm text-muted-foreground mt-1 pl-6">
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
