"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check } from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  thesisId: string | null
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : []))
      .then(setNotifications)
      .finally(() => setLoading(false))
  }, [])

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PUT" })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} unread</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Routing assignments, round updates, and archive status.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All notifications</CardTitle>
            <CardDescription>Latest first</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground py-8 text-center">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No notifications yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`flex items-start justify-between gap-4 rounded-lg border p-4 ${
                      !n.isRead ? "bg-muted/50" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{n.title}</p>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                      {n.thesisId && (
                        <Link
                          href={`/thesis/routing`}
                          className="text-xs text-primary underline mt-1 inline-block"
                        >
                          View routing
                        </Link>
                      )}
                    </div>
                    {!n.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markRead(n.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Mark read
                      </Button>
                    )}
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
