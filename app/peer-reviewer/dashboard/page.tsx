"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GradientBadge } from "@/components/ui/gradient-badge"
import { ClipboardList, FileText, ArrowRight } from "lucide-react"

interface Assignment {
  id: string
  reviewerId: string
  order: number
  deadline: string
  status: string
  round: { roundNumber: number }
}

interface Schedule {
  id: string
  thesisId: string
  thesis: { title: string; routingStatus: string }
  status: string
  rounds: Array<{
    roundNumber: number
    status: string
    assignments: Array<Assignment & { round: { roundNumber: number } }>
  }>
}

export default function PeerReviewerDashboardPage() {
  const { data: session } = useSession()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/routing")
      .then((res) => (res.ok ? res.json() : []))
      .then(setSchedules)
      .finally(() => setLoading(false))
  }, [])

  const myUserId = session?.user?.id

  const allAssignments: Array<{
    assignmentId: string
    scheduleId: string
    thesisTitle: string
    roundNumber: number
    order: number
    deadline: string
    status: string
  }> = []
  schedules.forEach((s) => {
    s.rounds?.forEach((r) => {
      r.assignments?.forEach((a) => {
        if (myUserId && a.reviewerId !== myUserId) return
        allAssignments.push({
          assignmentId: a.id,
          scheduleId: s.id,
          thesisTitle: s.thesis?.title ?? "",
          roundNumber: r.roundNumber,
          order: a.order,
          deadline: a.deadline,
          status: a.status,
        })
      })
    })
  })

  const active = allAssignments.filter((a) => a.status === "IN_PROGRESS")
  const completed = allAssignments.filter(
    (a) =>
      a.status === "APPROVED" ||
      a.status === "REJECTED" ||
      a.status === "SKIPPED"
  )

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Peer Reviewer Dashboard
          </h1>
          <p className="text-muted-foreground">
            View your review assignments and submit feedback.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Active</CardTitle>
              <CardDescription>Assignments pending your review</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : active.length === 0 ? (
                <p className="text-muted-foreground">No active assignments.</p>
              ) : (
                <ul className="space-y-2">
                  {active.map((a) => (
                    <li key={a.assignmentId}>
                      <Button variant="outline" className="w-full justify-between" asChild>
                        <Link href={`/peer-reviewer/assignments/${a.assignmentId}?scheduleId=${a.scheduleId}`}>
                          <span className="truncate">{a.thesisTitle}</span>
                          <ArrowRight className="h-4 w-4 ml-2 shrink-0" />
                        </Link>
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Round {a.roundNumber} · Deadline:{" "}
                        {new Date(a.deadline).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
              <CardDescription>Reviews you have submitted</CardDescription>
            </CardHeader>
            <CardContent>
              {completed.length === 0 ? (
                <p className="text-muted-foreground">None yet.</p>
              ) : (
                <ul className="space-y-2">
                  {completed.slice(0, 5).map((a) => (
                    <li
                      key={a.assignmentId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate">{a.thesisTitle}</span>
                      <GradientBadge variant="default">{a.status}</GradientBadge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All assignments</CardTitle>
            <CardDescription>View and manage all your review assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/peer-reviewer/assignments">
                <FileText className="h-4 w-4 mr-2" />
                View assignments
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
