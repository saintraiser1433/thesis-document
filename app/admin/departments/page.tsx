"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "react-toastify"
import { Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

interface Department {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments")
      if (!res.ok) {
        toast.error("Failed to fetch departments")
        return
      }
      const data = await res.json()
      setDepartments(data)
    } catch (error) {
      console.error("Error fetching departments:", error)
      toast.error("Failed to fetch departments")
    }
  }

  const handleSave = async (name: string) => {
    try {
      const payload = { name }
      let res: Response

      if (editingDepartment) {
        res = await fetch(`/api/departments/${editingDepartment.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Failed to save department")
        return
      }

      toast.success(editingDepartment ? "Department updated" : "Department created")
      setIsDialogOpen(false)
      setEditingDepartment(null)
      fetchDepartments()
    } catch (error) {
      console.error("Error saving department:", error)
      toast.error("Failed to save department")
    }
  }

  const handleDelete = async () => {
    if (!departmentToDelete) return
    try {
      const res = await fetch(`/api/departments/${departmentToDelete.id}`, {
        method: "DELETE",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Failed to delete department")
        return
      }
      toast.success("Department deleted")
      setDeleteDialogOpen(false)
      setDepartmentToDelete(null)
      fetchDepartments()
    } catch (error) {
      console.error("Error deleting department:", error)
      toast.error("Failed to delete department")
    }
  }

  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Name
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => <span className="text-sm">{new Date(row.original.createdAt).toLocaleDateString()}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              setEditingDepartment(row.original)
              setIsDialogOpen(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="text-red-600 border-red-200"
            onClick={() => {
              setDepartmentToDelete(row.original)
              setDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) setEditingDepartment(null)
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingDepartment ? "Edit Department" : "Add Department"}</DialogTitle>
                <DialogDescription>
                  {editingDepartment
                    ? "Update the department name."
                    : "Create a new department that can be assigned to program heads and theses."}
                </DialogDescription>
              </DialogHeader>
              <DepartmentForm
                initialName={editingDepartment?.name ?? ""}
                onSubmit={handleSave}
                onCancel={() => {
                  setIsDialogOpen(false)
                  setEditingDepartment(null)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Departments</CardTitle>
            <CardDescription>Manage departments used to scope program heads and theses.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={departments} searchKey="name" searchPlaceholder="Search departments..." />
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete department?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. You can only delete a department that is not assigned to any users or
                theses.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}

function DepartmentForm({
  initialName,
  onSubmit,
  onCancel,
}: {
  initialName: string
  onSubmit: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialName)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(name.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Department name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Computer Science Department"
          required
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

