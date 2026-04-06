from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EventViewSet, PublicEventDetailView

app_name = "events"

router = DefaultRouter()
router.register("", EventViewSet, basename="event")

urlpatterns = [
    # Public event detail — must come before the router to avoid conflict
    path("<uuid:pk>/public/", PublicEventDetailView.as_view(), name="event-public"),
    # Nested guest routes under each event
    path("<uuid:event_pk>/", include("guests.urls")),
    # Admin CRUD
    path("", include(router.urls)),
]
