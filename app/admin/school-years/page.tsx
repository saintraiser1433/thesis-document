"use client"

import { useEffect, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { toast } from "react-toastify"
import { MoreHorizontal, Plus, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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

type SchoolYear = { id: string; name: string; createdAt: string }

export default function AdminSchoolYearsPage() {
  const [items, setItems] = useState<SchoolYear[]>([])
  const [name, setName] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<SchoolYear | null>(null)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    const r = await fetch("/api/school-years")
    if (r.ok) setItems(await r.json())
  }

  async function createItem() {
    if (!name.trim()) return
    const r = await fetch("/api/school-years", { method: "POST", body: JSON.stringify({ name }), headers: { "Content-Type": "application/json" } })
    if (r.ok) { const created = await r.json(); setItems([created, ...items]); setName(""); toast.success("School year added") } else toast.error("Failed to add")
  }

  const columns: ColumnDef<SchoolYear>[] = [
    { id: "index", header: "#", cell: ({ row }) => <div className="font-medium">{row.index + 1}</div> },
    { accessorKey: "name", header: "School Year", cell: ({ row }) => (
      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        {row.getValue("name") as string}
      </span>
    ) },
    { accessorKey: "createdAt", header: "Created", cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString() },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.name)}><Edit className="mr-2 h-4 w-4" /> Copy name</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => { setToDelete(row.original); setDeleteOpen(true) }}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">School Year Management</h1>
          <p className="text-muted-foreground">Create and organize school years used by thesis records.</p>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All School Years</CardTitle>
              <CardDescription>Manage all school years in the system.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., 2024-2025" className="h-8 w-40" />
              <Button size="sm" onClick={createItem}><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={items} searchKey="name" searchPlaceholder="Search school year..." />
          </CardContent>
        </Card>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete school year?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={async () => { if (!toDelete) return; const r = await fetch(`/api/school-years/${toDelete.id}`, { method: "DELETE" }); if (r.ok) { setItems(items.filter(i => i.id !== toDelete.id)); toast.success("Deleted") } else toast.error("Failed"); setDeleteOpen(false); setToDelete(null) }}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}


