"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, MapPin, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/store";
import { useGetEventsQuery, useDeleteEventMutation } from "@/store/api";

export default function EventsListPage() {
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
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Link href="/admin/dashboard" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Events</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Events</h1>
        <Link href="/admin/events/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add event
          </Button>
        </Link>
      </div>

      {isLoading && (
        <p className="text-center text-gray-500 py-12">Loading events…</p>
      )}

      {events && events.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border">
          <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No events yet. Create your first one!</p>
          <Link href="/admin/events/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>
      )}

      {events && events.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {event.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                      {formatDate(event.date_time)}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {event.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Users className="h-3.5 w-3.5 text-gray-400" />
                      {event.accepted_count}
                      {event.max_capacity ? ` / ${event.max_capacity}` : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.is_at_capacity ? (
                      <Badge variant="destructive">Full</Badge>
                    ) : new Date(event.date_time) > new Date() ? (
                      <Badge variant="default">Upcoming</Badge>
                    ) : (
                      <Badge variant="secondary">Past</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/events/${event.id}`}>
                        <Button variant="outline" size="sm">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
