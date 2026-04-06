import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  Analytics,
  Event,
  EventFormData,
  ExportResponse,
  Guest,
  LoginRequest,
  PaginatedResponse,
  PublicEvent,
  RSVPRequest,
  TokenResponse,
  User,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE}/api/`,
    prepareHeaders: (headers) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ["Event", "Guests"],
  endpoints: (builder) => ({
    // -----------------------------------------------------------------------
    // Auth
    // -----------------------------------------------------------------------
    login: builder.mutation<TokenResponse, LoginRequest>({
      query: (credentials) => ({
        url: "auth/login/",
        method: "POST",
        body: credentials,
      }),
    }),

    getMe: builder.query<User, void>({
      query: () => "auth/me/",
    }),

    // -----------------------------------------------------------------------
    // Events — admin (authenticated)
    // -----------------------------------------------------------------------
    getEvents: builder.query<Event[], void>({
      query: () => "events/",
      transformResponse: (response: PaginatedResponse<Event>) => response.results,
      providesTags: ["Event"],
    }),

    getEvent: builder.query<Event, string>({
      query: (id) => `events/${id}/`,
      providesTags: (_result, _err, id) => [{ type: "Event", id }],
    }),

    createEvent: builder.mutation<Event, EventFormData>({
      query: (data) => ({
        url: "events/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Event"],
    }),

    updateEvent: builder.mutation<Event, { id: string; data: Partial<EventFormData> }>({
      query: ({ id, data }) => ({
        url: `events/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: "Event", id }, "Event"],
    }),

    deleteEvent: builder.mutation<void, string>({
      query: (id) => ({
        url: `events/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Event"],
    }),

    // -----------------------------------------------------------------------
    // Events — public
    // -----------------------------------------------------------------------
    getPublicEvent: builder.query<PublicEvent, string>({
      query: (id) => `events/${id}/public/`,
    }),

    // -----------------------------------------------------------------------
    // Guests
    // -----------------------------------------------------------------------
    getGuests: builder.query<
      PaginatedResponse<Guest>,
      { eventId: string; page?: number; status?: string; search?: string }
    >({
      query: ({ eventId, page = 1, status, search }) => {
        const params = new URLSearchParams({ page: String(page) });
        if (status) params.set("rsvp_status", status);
        if (search) params.set("search", search);
        return `events/${eventId}/guests/?${params.toString()}`;
      },
      providesTags: ["Guests"],
    }),

    // -----------------------------------------------------------------------
    // RSVP — public
    // -----------------------------------------------------------------------
    submitRSVP: builder.mutation<Guest, { eventId: string; data: RSVPRequest }>({
      query: ({ eventId, data }) => ({
        url: `events/${eventId}/rsvp/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Guests"],
    }),

    // -----------------------------------------------------------------------
    // Export
    // -----------------------------------------------------------------------
    exportGuests: builder.mutation<ExportResponse, string>({
      query: (eventId) => ({
        url: `events/${eventId}/guests/export/`,
        method: "POST",
      }),
    }),

    // -----------------------------------------------------------------------
    // Analytics
    // -----------------------------------------------------------------------
    getAnalytics: builder.query<Analytics, string>({
      query: (eventId) => `events/${eventId}/analytics/`,
    }),

    // -----------------------------------------------------------------------
    // Check-in
    // -----------------------------------------------------------------------
    checkinGuest: builder.mutation<
      { detail: string },
      { eventId: string; guestId: string }
    >({
      query: ({ eventId, guestId }) => ({
        url: `events/${eventId}/checkin/${guestId}/`,
        method: "POST",
      }),
      invalidatesTags: ["Guests"],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useGetEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useGetPublicEventQuery,
  useGetGuestsQuery,
  useSubmitRSVPMutation,
  useExportGuestsMutation,
  useGetAnalyticsQuery,
  useCheckinGuestMutation,
} = api;
