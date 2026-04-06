from django.contrib import admin

from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "date_time", "location", "max_capacity", "created_by")
    list_filter = ("date_time", "plus_one_allowed")
    search_fields = ("title", "location")
    readonly_fields = ("id", "created_at", "updated_at")
