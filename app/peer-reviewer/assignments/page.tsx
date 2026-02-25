"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { FileText, Eye, Calendar } from "lucide-react"

interface AssignmentRow {
  assignmentId: string
  scheduleId: string
  thesisTitle: string
  roundNumber: number
  order: number
  deadline: string
  status: string
}

export default function PeerReviewerAssignmentsPage() {
  const { data: session } = useSession()
  const [rows, setRows] = useState<AssignmentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const myUserId = session?.user?.id

    fetch("/api/routing")
      .then((res) => (res.ok ? res.json() : []))
      .then((schedules: Array<{
        id: string
        thesis: { title: string }
        rounds: Array<{
          roundNumber: number
          assignments: Array<{
            id: string
            reviewerId: string
            order: number
            deadline: string
            status: string
          }>
        }>
      }>) => {
        const flat: AssignmentRow[] = []
        schedules.forEach((s) => {
          s.rounds?.forEach((r) => {
            r.assignments?.forEach((a) => {
              if (myUserId && a.reviewerId !== myUserId) return
              flat.push({
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
        setRows(flat)
      })
      .finally(() => setLoading(false))
  }, [session?.user?.id])

  const columns: ColumnDef<AssignmentRow>[] = [
    {
      accessorKey: "thesisTitle",
      header: "Thesis",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.thesisTitle}</span>
        </div>
      ),
    },
    {
      accessorKey: "roundNumber",
      header: "Round",
    },
    {
      accessorKey: "order",
      header: "Order",
      cell: ({ row }) => `Reviewer ${row.original.order}`,
    },
    {
      accessorKey: "deadline",
      header: "Deadline",
      cell: ({ row }) => (
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {new Date(row.original.deadline).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "IN_PROGRESS"
              ? "default"
              : row.original.status === "PENDING"
                ? "secondary"
                : "outline"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        (row.original.status === "IN_PROGRESS" || row.original.status === "PENDING") ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/peer-reviewer/assignments/${row.original.assignmentId}`}>
              <Eye className="h-4 w-4 mr-1" />
              Review
            </Link>
          </Button>
        ) : null,
    },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">
            All your peer review assignments across schedules.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Review list</CardTitle>
            <CardDescription>Click Review to open an assignment and submit your feedback.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground py-8 text-center">Loading...</p>
            ) : rows.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No assignments yet.
              </p>
            ) : (
              <DataTable columns={columns} data={rows} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
