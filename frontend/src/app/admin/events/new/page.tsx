"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAppSelector } from "@/store";
import { useCreateEventMutation } from "@/store/api";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date_time: z.string().min(1, "Date & time is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().optional(),
  plus_one_allowed: z.boolean(),
  max_capacity: z.string().optional(),
});

type EventForm = z.infer<typeof eventSchema>;

export default function CreateEventPage() {
  const router = useRouter();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [createEvent, { isLoading }] = useCreateEventMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      plus_one_allowed: false,
      max_capacity: "",
      description: "",
    },
  });

  const plusOneAllowed = watch("plus_one_allowed");

  useEffect(() => {
    if (!isAuthenticated) router.replace("/admin/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const onSubmit = async (data: EventForm) => {
    try {
      const capacity = data.max_capacity?.trim();
      const payload = {
        title: data.title,
        location: data.location,
        description: data.description || "",
        plus_one_allowed: data.plus_one_allowed,
        max_capacity: capacity ? Number(capacity) : null,
        date_time: new Date(data.date_time).toISOString(),
      };
      await createEvent(payload).unwrap();
      toast.success("Event created successfully");
      router.push("/admin/dashboard");
    } catch {
      toast.error("Failed to create event");
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Link href="/admin/dashboard" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/admin/dashboard" className="hover:text-gray-700">Events</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Create</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Event</h1>
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Sarah & John's Wedding"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_time">Date & Time</Label>
                  <Input
                    id="date_time"
                    type="datetime-local"
                    {...register("date_time")}
                  />
                  {errors.date_time && (
                    <p className="text-sm text-red-500">{errors.date_time.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Venue name or address"
                    {...register("location")}
                  />
                  {errors.location && (
                    <p className="text-sm text-red-500">{errors.location.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add details about the event…"
                  rows={3}
                  {...register("description")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_capacity">Max Capacity (optional)</Label>
                <Input
                  id="max_capacity"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  {...register("max_capacity")}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium text-sm">Allow Plus-Ones</p>
                  <p className="text-xs text-muted-foreground">
                    Guests can bring a +1 to the event
                  </p>
                </div>
                <Switch
                  checked={plusOneAllowed}
                  onCheckedChange={(val) => setValue("plus_one_allowed", val)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating…" : "Create Event"}
              </Button>
            </form>
          </CardContent>
        </Card>
    </div>
  );
}
