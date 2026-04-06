// ---------------------------------------------------------------------------
// Domain types — mirrors the Django models
// ---------------------------------------------------------------------------

export interface Event {
  id: string;
  title: string;
  date_time: string;
  location: string;
  description: string;
  plus_one_allowed: boolean;
  max_capacity: number | null;
  created_by: number;
  accepted_count: number;
  is_at_capacity: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicEvent {
  id: string;
  title: string;
  date_time: string;
  location: string;
  description: string;
  plus_one_allowed: boolean;
  is_at_capacity: boolean;
}

export interface Guest {
  id: string;
  event: string;
  name: string;
  email: string;
  rsvp_status: "accepted" | "declined" | "waitlisted";
  dietary_preferences: string;
  plus_one_name: string;
  qr_code_url: string | null;
  checked_in: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// API request / response shapes
// ---------------------------------------------------------------------------

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface RSVPRequest {
  name: string;
  email: string;
  attending: boolean;
  dietary_preferences?: string;
  plus_one_name?: string;
}

export interface EventFormData {
  title: string;
  date_time: string;
  location: string;
  description: string;
  plus_one_allowed: boolean;
  max_capacity: number | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Analytics {
  total_guests: number;
  accepted: number;
  declined: number;
  waitlisted: number;
  plus_ones: number;
  dietary_breakdown: Record<string, number>;
  rsvp_rate: number;
  plus_one_rate: number;
}

export interface ExportResponse {
  detail: string;
  filename: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}
