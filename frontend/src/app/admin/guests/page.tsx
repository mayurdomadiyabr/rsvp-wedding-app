"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/store";
import { useGetEventsQuery, useGetGuestsQuery } from "@/store/api";

export default function GuestsOverviewPage() {
  const router = useRouter();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data: events } = useGetEventsQuery(undefined, { skip: !isAuthenticated });

  const [selectedEvent, setSelectedEvent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Auto-select first event
  useEffect(() => {
    if (events && events.length > 0 && !selectedEvent) {
      setSelectedEvent(events[0].id);
    }
  }, [events, selectedEvent]);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/admin/login");
  }, [isAuthenticated, router]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: guestData } = useGetGuestsQuery(
    {
      eventId: selectedEvent,
      page,
      status: statusFilter || undefined,
      search: debouncedSearch || undefined,
    },
    {
      skip: !isAuthenticated || !selectedEvent,
      pollingInterval: 5000,
    }
  );

  if (!isAuthenticated) return null;

  const statusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      accepted: "default",
      declined: "secondary",
      waitlisted: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const totalPages = guestData ? Math.ceil(guestData.count / 20) : 1;

  return (
    <div className="p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Link href="/admin/dashboard" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Guests</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Guests</h1>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select
          value={selectedEvent}
          onValueChange={(val) => {
            setSelectedEvent(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Select event" />
          </SelectTrigger>
          <SelectContent>
            {events?.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or email…"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val === "all" ? "" : val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="waitlisted">Waitlisted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!selectedEvent && events && events.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border">
          <p className="text-gray-500">No events yet. Create events to see guests.</p>
        </div>
      )}

      {selectedEvent && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dietary</TableHead>
                <TableHead>+1</TableHead>
                <TableHead>Checked In</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guestData?.results.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No guests found
                  </TableCell>
                </TableRow>
              )}
              {guestData?.results.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell className="font-medium">{guest.name}</TableCell>
                  <TableCell className="text-gray-600">{guest.email}</TableCell>
                  <TableCell>{statusBadge(guest.rsvp_status)}</TableCell>
                  <TableCell className="text-gray-600 max-w-[150px] truncate">
                    {guest.dietary_preferences || "—"}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {guest.plus_one_name || "—"}
                  </TableCell>
                  <TableCell>
                    {guest.checked_in ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">{guestData?.count} total guests</p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="flex items-center text-sm px-2">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
