"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type PieLabelRenderProps,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppSelector } from "@/store";
import { useGetEventsQuery } from "@/store/api";

const COLORS = ["#22c55e", "#ef4444", "#f59e0b", "#6366f1", "#ec4899"];

export default function AnalyticsOverviewPage() {
  const router = useRouter();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data: events, isLoading } = useGetEventsQuery(undefined, {
    skip: !isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) router.replace("/admin/login");
  }, [isAuthenticated, router]);

  const stats = useMemo(() => {
    if (!events || events.length === 0) return null;
    const now = new Date();
    const totalEvents = events.length;
    const upcomingEvents = events.filter((e) => new Date(e.date_time) > now).length;
    const pastEvents = totalEvents - upcomingEvents;
    const totalGuests = events.reduce((sum, e) => sum + e.accepted_count, 0);
    const totalCapacity = events.reduce((sum, e) => sum + (e.max_capacity || 0), 0);
    const atCapacity = events.filter((e) => e.is_at_capacity).length;

    const eventBreakdown = events.map((e) => ({
      name: e.title.length > 20 ? e.title.slice(0, 20) + "…" : e.title,
      guests: e.accepted_count,
      capacity: e.max_capacity || 0,
    }));

    const statusData = [
      { name: "Upcoming", value: upcomingEvents },
      { name: "Past", value: pastEvents },
    ];

    return {
      totalEvents,
      upcomingEvents,
      pastEvents,
      totalGuests,
      totalCapacity,
      atCapacity,
      eventBreakdown,
      statusData,
    };
  }, [events]);

  if (!isAuthenticated) return null;

  return (
    <div className="p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Link href="/admin/dashboard" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Analytics</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics Overview</h1>

      {isLoading && <p className="text-gray-500 py-12 text-center">Loading…</p>}

      {stats && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: "Total Events", value: stats.totalEvents },
              { label: "Upcoming", value: stats.upcomingEvents },
              { label: "Past", value: stats.pastEvents },
              { label: "Total Guests", value: stats.totalGuests },
              { label: "At Capacity", value: stats.atCapacity },
              { label: "Total Capacity", value: stats.totalCapacity || "∞" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-5 pb-4">
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Event status pie chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Event Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={stats.statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={(props: PieLabelRenderProps) => {
                        const { name, percent } = props;
                        return `${name ?? ""} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`;
                      }}
                    >
                      {stats.statusData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Guests per event bar chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Guests per Event</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.eventBreakdown.length === 0 ? (
                  <p className="text-gray-500 text-center py-12">No event data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={stats.eventBreakdown} layout="vertical">
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="guests" name="Confirmed" fill="#22c55e" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="capacity" name="Capacity" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Per-event analytics links */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Event-specific Analytics</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {events?.map((event) => (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}/analytics`}
                  className="flex items-center justify-between rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow"
                >
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-500">
                      {event.accepted_count} guests confirmed
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">→</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {events && events.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border">
          <p className="text-gray-500">No events yet. Create events to see analytics.</p>
        </div>
      )}
    </div>
  );
}
