"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { UserCheck, Mail, User } from "lucide-react"

interface PeerReviewer {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  thesisCount: number
}

export default function AdminPeerReviewersPage() {
  const [reviewers, setReviewers] = useState<PeerReviewer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.ok ? res.json() : [])
      .then((data: PeerReviewer[]) => {
        setReviewers(data.filter((u) => u.role === "PEER_REVIEWER"))
      })
      .finally(() => setLoading(false))
  }, [])

  const columns: ColumnDef<PeerReviewer>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          {row.getValue("name")}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          {row.getValue("email")}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Added",
      cell: ({ row }) => new Date(row.getValue("createdAt") as string).toLocaleDateString(),
    },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserCheck className="h-6 w-6" />
            Peer Reviewers
          </h1>
          <p className="text-muted-foreground">
            Users with the Peer Reviewer role. Assign them when creating routing schedules. Manage roles in User Management.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reviewer pool</CardTitle>
            <CardDescription>
              These users can be assigned as panel members for thesis routing. Add or change roles in User Management.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground py-8 text-center">Loading...</p>
            ) : reviewers.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No peer reviewers yet. Create users and set their role to &quot;Peer Reviewer&quot; in User Management.
              </p>
            ) : (
              <DataTable columns={columns} data={reviewers} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
