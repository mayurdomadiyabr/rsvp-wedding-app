import uuid

from django.conf import settings
from django.db import models


class Event(models.Model):
    """
    Represents a wedding event that guests can RSVP to.

    Each event belongs to an admin user who created it and has optional
    capacity limits that trigger waitlist behaviour when reached.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    date_time = models.DateTimeField()
    location = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    plus_one_allowed = models.BooleanField(default=False)
    max_capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Leave blank for unlimited capacity.",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="events",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_time"]

    def __str__(self):
        return f"{self.title} — {self.date_time:%Y-%m-%d %H:%M}"

    @property
    def accepted_count(self):
        """Number of guests who have confirmed attendance."""
        return self.guests.filter(rsvp_status="accepted").count()

    @property
    def is_at_capacity(self):
        """True when no more accepted RSVPs can be added."""
        if self.max_capacity is None:
            return False
        return self.accepted_count >= self.max_capacity
