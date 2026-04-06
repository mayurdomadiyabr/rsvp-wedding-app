from rest_framework import serializers

from events.models import Event

from .models import Guest, RsvpStatus


class GuestSerializer(serializers.ModelSerializer):
    """Full guest serializer used in admin guest list views."""

    qr_code_url = serializers.SerializerMethodField()

    class Meta:
        model = Guest
        fields = (
            "id",
            "event",
            "name",
            "email",
            "rsvp_status",
            "dietary_preferences",
            "plus_one_name",
            "qr_code_url",
            "checked_in",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "qr_code_url", "created_at", "updated_at")

    def get_qr_code_url(self, obj):
        if obj.qr_code:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.qr_code.url)
            return obj.qr_code.url
        return None


class RSVPSerializer(serializers.Serializer):
    """
    Public RSVP form submission.

    Validates input, enforces unique email per event, handles capacity logic,
    and creates the Guest record with an auto-generated QR code on acceptance.
    """

    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    attending = serializers.BooleanField()
    dietary_preferences = serializers.CharField(
        required=False, allow_blank=True, default=""
    )
    plus_one_name = serializers.CharField(
        required=False, allow_blank=True, default=""
    )

    def validate_email(self, value):
        """Ensure this email hasn't already RSVP'd for this event."""
        event = self.context["event"]
        if Guest.objects.filter(event=event, email=value).exists():
            raise serializers.ValidationError(
                "This email has already been used to RSVP for this event."
            )
        return value

    def validate_plus_one_name(self, value):
        """Only allow +1 if the event permits it."""
        event = self.context["event"]
        if value and not event.plus_one_allowed:
            raise serializers.ValidationError(
                "This event does not allow plus-ones."
            )
        return value

    def create(self, validated_data):
        event = self.context["event"]
        attending = validated_data.pop("attending")

        if not attending:
            guest = Guest.objects.create(
                event=event,
                rsvp_status=RsvpStatus.DECLINED,
                **validated_data,
            )
            return guest

        # Determine status based on capacity
        if event.is_at_capacity:
            status = RsvpStatus.WAITLISTED
        else:
            status = RsvpStatus.ACCEPTED

        guest = Guest(event=event, rsvp_status=status, **validated_data)

        if status == RsvpStatus.ACCEPTED:
            guest.generate_qr_code()

        guest.save()
        return guest


class AnalyticsSerializer(serializers.Serializer):
    """Read-only analytics summary for an event."""

    total_guests = serializers.IntegerField()
    accepted = serializers.IntegerField()
    declined = serializers.IntegerField()
    waitlisted = serializers.IntegerField()
    plus_ones = serializers.IntegerField()
    dietary_breakdown = serializers.DictField(child=serializers.IntegerField())
    rsvp_rate = serializers.FloatField()
    plus_one_rate = serializers.FloatField()
