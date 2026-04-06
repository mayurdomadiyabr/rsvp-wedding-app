from rest_framework import permissions, viewsets
from rest_framework.generics import RetrieveAPIView

from .models import Event
from .serializers import EventSerializer, PublicEventSerializer


class EventViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for events.

    - Only authenticated admin users can list, create, update, or delete.
    - The queryset is scoped to the current user's events.
    - `created_by` is set automatically from the request user.
    """

    serializer_class = EventSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = "pk"

    def get_queryset(self):
        return Event.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PublicEventDetailView(RetrieveAPIView):
    """
    Public endpoint that returns event details for the RSVP landing page.
    No authentication required.
    """

    queryset = Event.objects.all()
    serializer_class = PublicEventSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = "pk"
