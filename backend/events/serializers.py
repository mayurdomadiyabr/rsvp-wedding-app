from rest_framework import serializers

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    """Full event serializer for admin operations (CRUD)."""

    accepted_count = serializers.IntegerField(read_only=True)
    is_at_capacity = serializers.BooleanField(read_only=True)

    class Meta:
        model = Event
        fields = (
            "id",
            "title",
            "date_time",
            "location",
            "description",
            "plus_one_allowed",
            "max_capacity",
            "created_by",
            "accepted_count",
            "is_at_capacity",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_by", "created_at", "updated_at")


class PublicEventSerializer(serializers.ModelSerializer):
    """
    Limited event details shown to public visitors on the RSVP landing page.
    Hides internal admin data while exposing capacity status.
    """

    is_at_capacity = serializers.BooleanField(read_only=True)

    class Meta:
        model = Event
        fields = (
            "id",
            "title",
            "date_time",
            "location",
            "description",
            "plus_one_allowed",
            "is_at_capacity",
        )
