"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { useGetAnalyticsQuery, useGetEventQuery } from "@/store/api";

const RSVP_COLORS = ["#22c55e", "#ef4444", "#f59e0b"]; // green, red, amber
const DIET_COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4"];

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const { data: event } = useGetEventQuery(eventId, { skip: !isAuthenticated });
  const { data: analytics, isLoading } = useGetAnalyticsQuery(eventId, {
    skip: !isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) router.replace("/admin/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !analytics) return null;

  const rsvpData = [
    { name: "Accepted", value: analytics.accepted },
    { name: "Declined", value: analytics.declined },
    { name: "Waitlisted", value: analytics.waitlisted },
  ];

  const dietaryData = Object.entries(analytics.dietary_breakdown).map(
    ([name, value]) => ({ name, value })
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Link href="/admin/dashboard" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href={`/admin/events/${eventId}`} className="hover:text-gray-700">Event</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Analytics</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Analytics — {event?.title || "Event"}
      </h1>
        {isLoading && <p className="text-muted-foreground">Loading…</p>}

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Guests", value: analytics.total_guests },
            { label: "RSVP Rate", value: `${analytics.rsvp_rate}%` },
            { label: "Plus-Ones", value: analytics.plus_ones },
            { label: "+1 Rate", value: `${analytics.plus_one_rate}%` },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* RSVP breakdown pie chart */}
          <Card>
            <CardHeader>
              <CardTitle>RSVP Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={rsvpData}
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
                    {rsvpData.map((_, idx) => (
                      <Cell key={idx} fill={RSVP_COLORS[idx % RSVP_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Dietary preferences bar chart */}
          <Card>
            <CardHeader>
              <CardTitle>Dietary Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              {dietaryData.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">
                  No dietary data yet
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dietaryData} layout="vertical">
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {dietaryData.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={DIET_COLORS[idx % DIET_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
