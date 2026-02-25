"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GradientBadge } from "@/components/ui/gradient-badge"
import { FileText, Download, ExternalLink, Inbox } from "lucide-react"

interface Thesis {
  id: string
  title: string
  abstract?: string
  fileUrl: string | null
  routingStatus: string
  user?: { name: string; email?: string }
  category?: string
  course?: string
  schoolYear?: string
}

export default function ProgramHeadPresentedThesesPage() {
  const [theses, setTheses] = useState<Thesis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/theses")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Thesis[]) => {
        setTheses(
          data.filter(
            (t) =>
              t.routingStatus === "PENDING_ARCHIVE" ||
              t.routingStatus === "ARCHIVED"
          )
        )
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Presented Thesis
          </h1>
          <p className="text-muted-foreground">
            Thesis that have completed routing (pending archive or archived). View and download thesis files. Approve archiving from Archive Approvals.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Thesis presented for archive</CardTitle>
            <CardDescription>
              Pending archive: completed 3 routing rounds, awaiting your approval. Archived: approved and stored.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground py-8 text-center">Loading...</p>
            ) : theses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground/60 mb-3" />
                <p className="text-muted-foreground">
                  No presented thesis yet.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {theses.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-4 border rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{t.title}</p>
                        {t.user?.name && (
                          <p className="text-sm text-muted-foreground">
                            {t.user.name}
                            {t.schoolYear && ` · ${t.schoolYear}`}
                          </p>
                        )}
                      </div>
                      <GradientBadge
                        variant={
                          t.routingStatus === "ARCHIVED" ? "published" : "default"
                        }
                        className="shrink-0"
                      >
                        {t.routingStatus === "ARCHIVED"
                          ? "Archived"
                          : "Pending approval"}
                      </GradientBadge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {t.fileUrl && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a
                              href={t.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a
                              href={t.fileUrl}
                              download={
                                t.fileUrl.split("/").pop() || "thesis.pdf"
                              }
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        </>
                      )}
                      {!t.fileUrl && (
                        <span className="text-sm text-muted-foreground">
                          No file
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
