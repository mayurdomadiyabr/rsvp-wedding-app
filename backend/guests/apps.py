from django.apps import AppConfig


class GuestsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'guests'

    def ready(self):
        import guests.signals  # noqa: F401 — register post_save signal
