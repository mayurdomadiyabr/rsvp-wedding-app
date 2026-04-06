import threading
from collections import Counter
from pathlib import Path

from django.conf import settings
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from openpyxl import Workbook
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from events.models import Event

from .models import Guest
from .serializers import AnalyticsSerializer, GuestSerializer, RSVPSerializer


# ---------------------------------------------------------------------------
# Helper — resolve event from URL kwargs
# ---------------------------------------------------------------------------

def _get_event(kwargs):
    """Fetch the event from the URL or raise 404."""
    return get_object_or_404(Event, pk=kwargs["event_pk"])


# ---------------------------------------------------------------------------
# Admin — paginated guest list with filtering & search
# ---------------------------------------------------------------------------

class GuestListView(generics.ListAPIView):
    """
    Paginated list of guests for a specific event.

    Supports:
    - `?status=accepted` / `declined` / `waitlisted` — filter by RSVP status
    - `?search=jane` — search by guest name or email
    - `?ordering=-created_at` — sort results
    """

    serializer_class = GuestSerializer
    permission_classes = (permissions.IsAuthenticated,)
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter)
    filterset_fields = ("rsvp_status",)
    search_fields = ("name", "email")
    ordering_fields = ("name", "created_at", "rsvp_status")
    ordering = ("-created_at",)

    def get_queryset(self):
        event = _get_event(self.kwargs)
        return Guest.objects.filter(event=event)


# ---------------------------------------------------------------------------
# Public — RSVP submission (no auth required)
# ---------------------------------------------------------------------------

class RSVPCreateView(generics.CreateAPIView):
    """
    Public endpoint for guests to submit their RSVP.

    Handles capacity checks and QR code generation transparently.
    Returns the created guest record including QR code URL on acceptance.
    """

    serializer_class = RSVPSerializer
    permission_classes = (permissions.AllowAny,)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["event"] = _get_event(self.kwargs)
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        guest = serializer.save()

        # Return the full guest details including QR code
        output = GuestSerializer(guest, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Admin — check-in a guest via their QR code UUID
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def checkin_guest(request, event_pk, guest_pk):
    """Mark a guest as checked in at the event."""
    guest = get_object_or_404(Guest, pk=guest_pk, event_id=event_pk)

    if guest.checked_in:
        return Response(
            {"detail": "Guest has already been checked in."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    guest.checked_in = True
    guest.save(update_fields=["checked_in", "updated_at"])
    return Response({"detail": "Guest checked in successfully."})


# ---------------------------------------------------------------------------
# Admin — export guest list to .xlsx (background thread)
# ---------------------------------------------------------------------------

def _generate_xlsx(event_id, filepath):
    """
    Worker function that generates an xlsx file for the given event.
    Runs in a background thread so the HTTP response returns immediately.
    """
    guests = Guest.objects.filter(event_id=event_id).order_by("name")

    wb = Workbook()
    ws = wb.active
    ws.title = "Guest List"

    headers = [
        "Name", "Email", "RSVP Status", "Dietary Preferences",
        "Plus-One Name", "Checked In", "RSVP Date",
    ]
    ws.append(headers)

    for guest in guests:
        ws.append([
            guest.name,
            guest.email,
            guest.get_rsvp_status_display(),
            guest.dietary_preferences,
            guest.plus_one_name,
            "Yes" if guest.checked_in else "No",
            guest.created_at.strftime("%Y-%m-%d %H:%M"),
        ])

    # Auto-size columns for readability
    for col in ws.columns:
        max_length = max(len(str(cell.value or "")) for cell in col) + 2
        ws.column_dimensions[col[0].column_letter].width = max_length

    wb.save(filepath)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def export_guests(request, event_pk):
    """
    Trigger an async xlsx export.

    Returns a task-like identifier (the filename) that the client uses
    to poll the download endpoint.
    """
    event = get_object_or_404(Event, pk=event_pk)

    export_dir = Path(settings.EXPORT_ROOT)
    export_dir.mkdir(parents=True, exist_ok=True)
    filename = f"guests_{event_pk}.xlsx"
    filepath = export_dir / filename

    # Run generation in a background thread
    thread = threading.Thread(
        target=_generate_xlsx,
        args=(event_pk, filepath),
        daemon=True,
    )
    thread.start()

    return Response({
        "detail": "Export started. Poll the download endpoint.",
        "filename": filename,
    })


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def download_export(request, event_pk, filename):
    """Serve a previously generated xlsx file for download."""
    filepath = Path(settings.EXPORT_ROOT) / filename

    if not filepath.exists():
        return Response(
            {"detail": "File not ready yet. Please try again shortly."},
            status=status.HTTP_202_ACCEPTED,
        )

    return FileResponse(
        open(filepath, "rb"),
        as_attachment=True,
        filename=filename,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


# ---------------------------------------------------------------------------
# Admin — analytics endpoint
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def event_analytics(request, event_pk):
    """
    Return aggregated RSVP statistics for an event.
    """
    event = get_object_or_404(Event, pk=event_pk)
    guests = Guest.objects.filter(event=event)

    total = guests.count()
    accepted = guests.filter(rsvp_status="accepted").count()
    declined = guests.filter(rsvp_status="declined").count()
    waitlisted = guests.filter(rsvp_status="waitlisted").count()
    plus_ones = guests.exclude(plus_one_name="").count()

    # Build dietary breakdown from non-empty preferences
    dietary_values = (
        guests.exclude(dietary_preferences="")
        .values_list("dietary_preferences", flat=True)
    )
    dietary_breakdown = dict(Counter(dietary_values))

    data = {
        "total_guests": total,
        "accepted": accepted,
        "declined": declined,
        "waitlisted": waitlisted,
        "plus_ones": plus_ones,
        "dietary_breakdown": dietary_breakdown,
        "rsvp_rate": round(accepted / total * 100, 1) if total else 0.0,
        "plus_one_rate": round(plus_ones / total * 100, 1) if total else 0.0,
    }

    serializer = AnalyticsSerializer(data)
    return Response(serializer.data)
