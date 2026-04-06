from django.urls import path

from .views import (
    GuestListView,
    RSVPCreateView,
    checkin_guest,
    download_export,
    event_analytics,
    export_guests,
)

app_name = "guests"

urlpatterns = [
    # Admin — guest management
    path("guests/", GuestListView.as_view(), name="guest-list"),
    path("guests/export/", export_guests, name="guest-export"),
    path("guests/export/<str:filename>/", download_export, name="guest-export-download"),
    path("checkin/<uuid:guest_pk>/", checkin_guest, name="guest-checkin"),
    path("analytics/", event_analytics, name="event-analytics"),
    # Public — RSVP submission
    path("rsvp/", RSVPCreateView.as_view(), name="rsvp-create"),
]
