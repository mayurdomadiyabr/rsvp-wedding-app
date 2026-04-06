import logging

from django.conf import settings
from django.core.mail import EmailMessage
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Guest

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Guest)
def send_rsvp_confirmation_email(sender, instance, created, **kwargs):
    """
    Send a confirmation email after a new Guest record is created.

    - Accepted guests receive a confirmation with their QR code attached.
    - Waitlisted guests get a waitlist notification.
    - Declined guests get a brief acknowledgement.

    Fails silently so RSVP submission is never blocked by email errors.
    """
    if not created:
        return

    event = instance.event
    guest = instance

    subject_map = {
        "accepted": f"You're confirmed for {event.title}!",
        "waitlisted": f"You're on the waitlist for {event.title}",
        "declined": f"RSVP received — {event.title}",
    }

    subject = subject_map.get(guest.rsvp_status, f"RSVP update — {event.title}")

    # Build plain-text body (no HTML template dependency)
    if guest.rsvp_status == "accepted":
        body = (
            f"Hi {guest.name},\n\n"
            f"Great news! Your RSVP for \"{event.title}\" has been confirmed.\n\n"
            f"Event Details:\n"
            f"  Date: {event.date_time.strftime('%A, %B %d, %Y at %I:%M %p')}\n"
            f"  Location: {event.location}\n"
        )
        if guest.plus_one_name:
            body += f"  Plus-One: {guest.plus_one_name}\n"
        if guest.dietary_preferences:
            body += f"  Dietary Preferences: {guest.dietary_preferences}\n"
        body += (
            "\nYour check-in QR code is attached to this email. "
            "Please present it at the venue entrance.\n\n"
            "We can't wait to see you!\n"
        )
    elif guest.rsvp_status == "waitlisted":
        body = (
            f"Hi {guest.name},\n\n"
            f"Thank you for your interest in \"{event.title}\".\n\n"
            f"The event is currently at capacity, so you've been placed on "
            f"the waitlist. We'll reach out if a spot opens up.\n\n"
            f"Event Details:\n"
            f"  Date: {event.date_time.strftime('%A, %B %d, %Y at %I:%M %p')}\n"
            f"  Location: {event.location}\n"
        )
    else:
        body = (
            f"Hi {guest.name},\n\n"
            f"We've received your RSVP for \"{event.title}\". "
            f"Sorry you can't make it — we'll miss you!\n"
        )

    try:
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[guest.email],
        )

        # Attach the QR code for accepted guests
        if guest.rsvp_status == "accepted" and guest.qr_code:
            guest.qr_code.seek(0)
            email.attach(
                filename=f"checkin_qr_{guest.name.replace(' ', '_')}.png",
                content=guest.qr_code.read(),
                mimetype="image/png",
            )

        email.send(fail_silently=True)
        logger.info(
            "Confirmation email sent to %s for event %s",
            guest.email,
            event.title,
        )
    except Exception:
        logger.exception(
            "Failed to send confirmation email to %s for event %s",
            guest.email,
            event.title,
        )
