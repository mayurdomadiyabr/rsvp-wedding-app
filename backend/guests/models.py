import uuid
from io import BytesIO

import qrcode
from django.core.files.base import ContentFile
from django.db import models

from events.models import Event


class RsvpStatus(models.TextChoices):
    ACCEPTED = "accepted", "Accepted"
    DECLINED = "declined", "Declined"
    WAITLISTED = "waitlisted", "Waitlisted"


class Guest(models.Model):
    """
    Represents a guest who has RSVP'd to an event.

    Business rules:
    - Email must be unique per event.
    - When the event is at capacity, the RSVP status is set to 'waitlisted'.
    - A QR code is generated automatically when status is 'accepted'.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="guests",
    )
    name = models.CharField(max_length=255)
    email = models.EmailField()
    rsvp_status = models.CharField(
        max_length=20,
        choices=RsvpStatus.choices,
        default=RsvpStatus.ACCEPTED,
    )
    dietary_preferences = models.TextField(blank=True, default="")
    plus_one_name = models.CharField(max_length=255, blank=True, default="")
    qr_code = models.ImageField(upload_to="qr_codes/", blank=True)
    checked_in = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["event", "email"],
                name="unique_guest_per_event",
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.email}) — {self.rsvp_status}"

    def generate_qr_code(self):
        """
        Create a QR code image containing the check-in URL for this guest
        and attach it to the `qr_code` field.
        """
        checkin_data = f"checkin:{self.event_id}:{self.id}"

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(checkin_data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")

        filename = f"qr_{self.id}.png"
        self.qr_code.save(filename, ContentFile(buffer.getvalue()), save=False)
