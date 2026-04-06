"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarDays, MapPin, CheckCircle2, Clock, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useGetPublicEventQuery, useSubmitRSVPMutation } from "@/store/api";
import type { Guest } from "@/types";

const rsvpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  attending: z.boolean(),
  dietary_preferences: z.string().optional(),
  plus_one_name: z.string().optional(),
});

type RSVPForm = z.infer<typeof rsvpSchema>;

export default function PublicEventPage() {
  const params = useParams();
  const eventId = params.id as string;

  const { data: event, isLoading, isError } = useGetPublicEventQuery(eventId);
  const [submitRSVP, { isLoading: isSubmitting }] = useSubmitRSVPMutation();
  const [submittedGuest, setSubmittedGuest] = useState<Guest | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RSVPForm>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: { attending: true },
  });

  const isAttending = watch("attending");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-muted-foreground">Loading event details…</p>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-lg font-medium">Event not found</p>
            <p className="text-sm text-muted-foreground mt-1">
              This event may have been removed or the link is incorrect.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const onSubmit = async (data: RSVPForm) => {
    try {
      const guest = await submitRSVP({
        eventId,
        data: {
          name: data.name,
          email: data.email,
          attending: data.attending,
          dietary_preferences: data.dietary_preferences || "",
          plus_one_name: data.plus_one_name || "",
        },
      }).unwrap();
      setSubmittedGuest(guest);
      toast.success("RSVP submitted successfully!");
    } catch (err: unknown) {
      const error = err as { data?: { email?: string[]; detail?: string } };
      const message =
        error?.data?.email?.[0] ||
        error?.data?.detail ||
        "Something went wrong. Please try again.";
      toast.error(message);
    }
  };

  // ---------- Success state ----------
  if (submittedGuest) {
    const isAccepted = submittedGuest.rsvp_status === "accepted";
    const isWaitlisted = submittedGuest.rsvp_status === "waitlisted";
    const isDeclined = submittedGuest.rsvp_status === "declined";

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            {isAccepted && (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold">You&apos;re confirmed!</h2>
                <p className="text-muted-foreground">
                  We can&apos;t wait to see you at {event.title}.
                </p>
                {submittedGuest.qr_code_url && (
                  <div className="mt-6">
                    <p className="text-sm font-medium mb-3">
                      Your Check-in QR Code
                    </p>
                    <Image
                      src={submittedGuest.qr_code_url}
                      alt="Check-in QR Code"
                      width={192}
                      height={192}
                      className="mx-auto rounded-lg border p-2"
                      unoptimized
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Save this QR code — present it at check-in
                    </p>
                  </div>
                )}
              </>
            )}

            {isWaitlisted && (
              <>
                <Clock className="w-16 h-16 text-amber-500 mx-auto" />
                <h2 className="text-2xl font-bold">You&apos;re on the waitlist</h2>
                <p className="text-muted-foreground">
                  The event is currently at capacity. We&apos;ll notify you if a
                  spot opens up.
                </p>
              </>
            )}

            {isDeclined && (
              <>
                <XCircle className="w-16 h-16 text-gray-400 mx-auto" />
                <h2 className="text-2xl font-bold">RSVP recorded</h2>
                <p className="text-muted-foreground">
                  Sorry you can&apos;t make it. We&apos;ll miss you!
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- RSVP form ----------
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Event info */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{event.title}</CardTitle>
            <CardDescription className="space-y-2 mt-3">
              <span className="flex items-center justify-center gap-2">
                <CalendarDays className="w-4 h-4" />
                {formatDate(event.date_time)}
              </span>
              <span className="flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4" />
                {event.location}
              </span>
            </CardDescription>
          </CardHeader>
          {event.description && (
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                {event.description}
              </p>
            </CardContent>
          )}
        </Card>

        {/* Capacity warning */}
        {event.is_at_capacity && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                This event is at capacity. You can still RSVP and you&apos;ll be
                placed on the waitlist.
              </p>
            </CardContent>
          </Card>
        )}

        {/* RSVP form */}
        <Card>
          <CardHeader>
            <CardTitle>RSVP</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Jane Doe" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <Separator />

              {/* Attending toggle */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={isAttending ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setValue("attending", true)}
                >
                  Joyfully Accept
                </Button>
                <Button
                  type="button"
                  variant={!isAttending ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setValue("attending", false)}
                >
                  Regretfully Decline
                </Button>
              </div>

              {isAttending && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="dietary_preferences">
                      Dietary Preferences
                    </Label>
                    <Textarea
                      id="dietary_preferences"
                      placeholder="e.g. Vegetarian, Gluten-free, Nut allergy…"
                      rows={2}
                      {...register("dietary_preferences")}
                    />
                  </div>

                  {event.plus_one_allowed && (
                    <div className="space-y-2">
                      <Label htmlFor="plus_one_name">
                        Plus-One Name (optional)
                      </Label>
                      <Input
                        id="plus_one_name"
                        placeholder="Guest name"
                        {...register("plus_one_name")}
                      />
                    </div>
                  )}
                </>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting…" : "Submit RSVP"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
