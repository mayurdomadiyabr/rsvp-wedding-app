from django.contrib import admin

from .models import Guest


@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "event", "rsvp_status", "checked_in", "created_at")
    list_filter = ("rsvp_status", "checked_in")
    search_fields = ("name", "email")
    readonly_fields = ("id", "qr_code", "created_at", "updated_at")
