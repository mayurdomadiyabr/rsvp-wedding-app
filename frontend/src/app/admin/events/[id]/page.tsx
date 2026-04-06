"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BarChart3, Copy, Download, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  useGetEventQuery,
  useGetGuestsQuery,
  useExportGuestsMutation,
  useCheckinGuestMutation,
} from "@/store/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: event } = useGetEventQuery(eventId, { skip: !isAuthenticated });
  const { data: guestData } = useGetGuestsQuery(
    {
      eventId,
      page,
      status: statusFilter || undefined,
      search: debouncedSearch || undefined,
    },
    {
      skip: !isAuthenticated,
      pollingInterval: 5000, // real-time polling every 5s
    }
  );
  const [exportGuests, { isLoading: isExporting }] = useExportGuestsMutation();
  const [checkinGuest] = useCheckinGuestMutation();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/admin/login");
  }, [isAuthenticated, router]);

  // Debounce search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isAuthenticated || !event) return null;

  const handleExport = async () => {
    try {
      const result = await exportGuests(eventId).unwrap();
      toast.success("Export started");

      // Poll for file readiness, then trigger download
      setTimeout(() => {
        const url = `${API_BASE}/api/events/${eventId}/guests/export/${result.filename}/`;
        window.open(url, "_blank");
      }, 2000);
    } catch {
      toast.error("Export failed");
    }
  };

  const handleCheckin = async (guestId: string) => {
    try {
      await checkinGuest({ eventId, guestId }).unwrap();
      toast.success("Guest checked in");
    } catch {
      toast.error("Check-in failed");
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/event/${eventId}`;
    navigator.clipboard.writeText(url);
    toast.success("RSVP link copied to clipboard");
  };

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
        <Link href="/admin/dashboard" className="hover:text-gray-700">Events</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{event.title}</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <p className="text-sm text-gray-500">
            {event.accepted_count}
            {event.max_capacity && ` / ${event.max_capacity}`} guests confirmed
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyShareLink}>
            <Copy className="w-4 h-4 mr-1" />
            Share RSVP Link
          </Button>
          <Link href={`/admin/events/${eventId}/analytics`}>
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-1" />
              Analytics
            </Button>
          </Link>
        </div>
      </div>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle>Guest List</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-1" />
                {isExporting ? "Exporting…" : "Export .xlsx"}
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                <SelectTrigger className="w-[180px]">
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
          </CardHeader>

          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dietary</TableHead>
                    <TableHead>+1</TableHead>
                    <TableHead>Checked In</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guestData?.results.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No guests found
                      </TableCell>
                    </TableRow>
                  )}
                  {guestData?.results.map((guest) => (
                    <TableRow key={guest.id}>
                      <TableCell className="font-medium">{guest.name}</TableCell>
                      <TableCell>{guest.email}</TableCell>
                      <TableCell>{statusBadge(guest.rsvp_status)}</TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {guest.dietary_preferences || "—"}
                      </TableCell>
                      <TableCell>{guest.plus_one_name || "—"}</TableCell>
                      <TableCell>
                        {guest.checked_in ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {guest.rsvp_status === "accepted" && !guest.checked_in && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckin(guest.id)}
                          >
                            Check In
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {guestData?.count} total guests
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center text-sm px-2">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
