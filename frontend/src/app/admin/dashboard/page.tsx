"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, MapPin, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppSelector } from "@/store";
import { useGetEventsQuery, useDeleteEventMutation } from "@/store/api";

export default function DashboardPage() {
  const router = useRouter();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data: events, isLoading } = useGetEventsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [deleteEvent] = useDeleteEventMutation();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/admin/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteEvent(id).unwrap();
      toast.success("Event deleted");
    } catch {
      toast.error("Failed to delete event");
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Wedding RSVP Admin</h1>
          <Link href="/admin/events/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {isLoading && (
          <p className="text-center text-muted-foreground">Loading events…</p>
        )}

        {events && events.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No events yet. Create your first one!
              </p>
              <Link href="/admin/events/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events?.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg leading-tight">
                    {event.title}
                  </CardTitle>
                  {event.is_at_capacity && (
                    <Badge variant="destructive">Full</Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {formatDate(event.date_time)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {event.location}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  {event.accepted_count}
                  {event.max_capacity && ` / ${event.max_capacity}`} guests
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/admin/events/${event.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Manage
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(event.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
