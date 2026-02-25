"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { toast } from "react-toastify"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GradientBadge } from "@/components/ui/gradient-badge"
import { ClipboardList, FileText, Send, Eye } from "lucide-react"

interface Thesis {
  id: string
  title: string
  fileUrl: string | null
  routingStatus: string
  user?: { id: string; name: string }
}

interface Schedule {
  id: string
  thesisId: string
  thesis: { title: string; routingStatus: string }
  status: string
  rounds: Array<{ roundNumber: number; status: string }>
}

export default function ThesisRoutingPage() {
  const { data: session } = useSession()
  const [theses, setTheses] = useState<Thesis[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelLoadingId, setCancelLoadingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetch("/api/theses"), fetch("/api/routing")])
      .then(async ([tRes, rRes]) => {
        if (tRes.ok) {
          const tData = await tRes.json()
          const myId = session?.user?.id
          setTheses(myId ? tData.filter((t: Thesis) => t.user?.id === myId) : [])
        }
        if (rRes.ok) {
          const rData = await rRes.json()
          setSchedules(rData)
        }
      })
      .finally(() => setLoading(false))
  }, [session?.user?.id])

  const handleSubmitRouting = async (thesisId: string) => {
    try {
      const res = await fetch(`/api/theses/${thesisId}/submit-routing`, {
        method: "POST",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Failed to submit")
        return
      }
      toast.success("Thesis submitted for routing")
      setTheses((prev) =>
        prev.map((t) =>
          t.id === thesisId ? { ...t, routingStatus: "PENDING_REVIEW" } : t
        )
      )
    } catch {
      toast.error("Failed to submit")
    }
  }

  const handleCancelRouting = async (thesisId: string) => {
    setCancelLoadingId(thesisId)
    try {
      const res = await fetch(`/api/theses/${thesisId}/cancel-routing`, {
        method: "POST",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Failed to cancel routing")
        return
      }
      toast.success("Routing request cancelled")
      setTheses((prev) =>
        prev.map((t) =>
          t.id === thesisId ? { ...t, routingStatus: "NONE" } : t
        )
      )
    } catch {
      toast.error("Failed to cancel routing")
    } finally {
      setCancelLoadingId(null)
    }
  }

  const routingStatusLabel: Record<string, string> = {
    NONE: "Not submitted",
    PENDING_REVIEW: "Pending admin assignment",
    IN_ROUTING: "In progress",
    PENDING_ARCHIVE: "Awaiting archive approval",
    ARCHIVED: "Archived",
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Thesis Routing
          </h1>
          <p className="text-muted-foreground">
            Submit your thesis for routing and monitor progress. Three rounds of peer review are required.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My thesis</CardTitle>
            <CardDescription>
              Submit a thesis for routing or view progress. You need a PDF file uploaded first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground py-6 text-center">Loading...</p>
            ) : theses.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center">
                You have no thesis. Upload one first (as Program Head) or browse existing thesis.
              </p>
            ) : (
              <ul className="space-y-4">
                {theses.map((t) => {
                  const schedule = schedules.find((s) => s.thesisId === t.id)
                  return (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-4 border rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{t.title}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            Status:
                            <GradientBadge variant="default">
                              {routingStatusLabel[t.routingStatus] ?? t.routingStatus}
                            </GradientBadge>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.routingStatus === "NONE" && t.fileUrl && (
                          <Button
                            size="sm"
                            onClick={() => handleSubmitRouting(t.id)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Submit for routing
                          </Button>
                        )}
                        {t.routingStatus === "PENDING_REVIEW" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelRouting(t.id)}
                            disabled={cancelLoadingId === t.id}
                          >
                            {cancelLoadingId === t.id ? "Cancelling..." : "Cancel routing"}
                          </Button>
                        )}
                        {(t.routingStatus === "IN_ROUTING" ||
                          t.routingStatus === "PENDING_ARCHIVE") &&
                          schedule && (
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/thesis/routing/${schedule.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View progress
                              </Link>
                            </Button>
                          )}
                        {t.routingStatus === "NONE" && !t.fileUrl && (
                          <span className="text-sm text-muted-foreground">
                            Add a PDF file first
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
