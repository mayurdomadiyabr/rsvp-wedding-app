"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/store";
import { useGetEventsQuery } from "@/store/api";
import { cn } from "@/lib/utils";
import type { Event } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const EVENT_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-orange-100 text-orange-700 border-orange-200",
];


function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday = 0 ... Sunday = 6
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const days: { date: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

  // Previous month fill
  const prevMonthLast = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      date: prevMonthLast - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: d, month, year, isCurrentMonth: true });
  }

  // Next month fill
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      days.push({
        date: d,
        month: month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false,
      });
    }
  }

  return days;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

type FilterTab = "all" | "upcoming" | "past";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const router = useRouter();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data: events, isLoading } = useGetEventsQuery(undefined, {
    skip: !isAuthenticated,
  });

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAuthenticated) router.replace("/admin/login");
  }, [isAuthenticated, router]);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let list = [...events];
    if (filter === "upcoming") list = list.filter((e) => new Date(e.date_time) >= now);
    if (filter === "past") list = list.filter((e) => new Date(e.date_time) < now);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [events, filter, search]);

  // Map events to calendar day keys
  const eventsByDay = useMemo(() => {
    const map: Record<string, Event[]> = {};
    filteredEvents.forEach((event) => {
      const d = new Date(event.date_time);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [filteredEvents]);

  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const goToday = () => {
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
  };

  const goPrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  if (!isAuthenticated) return null;

  const isToday = (day: { date: number; month: number; year: number }) =>
    day.date === now.getDate() &&
    day.month === now.getMonth() &&
    day.year === now.getFullYear();

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <span>Home</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Dashboard</span>
      </div>

      {/* Page title row */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search"
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6">
        {(["all", "upcoming", "past"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              filter === tab
                ? "bg-white text-gray-900 shadow-sm border"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab === "all" ? "All events" : tab === "upcoming" ? "Upcoming" : "Past"}
          </button>
        ))}
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-xl border shadow-sm">
        {/* Calendar header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 border-b gap-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center bg-gray-50 rounded-lg border px-3 py-1.5">
              <span className="text-[10px] font-semibold uppercase text-gray-500">
                {MONTH_NAMES[currentMonth].slice(0, 3)}
              </span>
              <span className="text-lg font-bold text-gray-900 leading-none">
                {now.getDate()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <p className="text-xs text-gray-500">
                {MONTH_NAMES[currentMonth].slice(0, 3)} 1, {currentYear} –{" "}
                {MONTH_NAMES[currentMonth].slice(0, 3)}{" "}
                {new Date(currentYear, currentMonth + 1, 0).getDate()},{" "}
                {currentYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg">
              <button onClick={goPrev} className="p-2 hover:bg-gray-50 rounded-l-lg">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goToday}
                className="px-3 py-1.5 text-sm font-medium hover:bg-gray-50 border-x"
              >
                Today
              </button>
              <button onClick={goNext} className="p-2 hover:bg-gray-50 rounded-r-lg">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Link href="/admin/events/new">
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add event
              </Button>
            </Link>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {/* Day headers */}
          {DAYS.map((day) => (
            <div
              key={day}
              className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-center border-b bg-gray-50/50"
            >
              {day}
            </div>
          ))}

          {/* Day cells */}
          {calendarDays.map((day, idx) => {
            const key = `${day.year}-${day.month}-${day.date}`;
            const dayEvents = eventsByDay[key] || [];
            const today = isToday(day);

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[100px] lg:min-h-[120px] border-b border-r p-1.5 transition-colors",
                  !day.isCurrentMonth && "bg-gray-50/50",
                  idx % 7 === 0 && "border-l-0"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium",
                      today
                        ? "bg-gray-900 text-white"
                        : day.isCurrentMonth
                        ? "text-gray-700"
                        : "text-gray-400"
                    )}
                  >
                    {day.date}
                  </span>
                </div>

                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((event, eIdx) => (
                    <Link
                      key={event.id}
                      href={`/admin/events/${event.id}`}
                      className={cn(
                        "block truncate rounded px-1.5 py-0.5 text-[11px] font-medium border",
                        EVENT_COLORS[eIdx % EVENT_COLORS.length]
                      )}
                    >
                      {event.title}{" "}
                      <span className="text-[10px] opacity-75">
                        {formatTime(event.date_time)}
                      </span>
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-[10px] text-gray-500 pl-1.5">
                      +{dayEvents.length - 3} more…
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12 text-gray-500">
          Loading events…
        </div>
      )}

      {/* Empty state */}
      {events && events.length === 0 && (
        <div className="text-center py-16">
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
    </div>
  );
}
