FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/media /app/exports /app/staticfiles

# Create entrypoint script that runs migrations before starting
RUN printf '#!/bin/bash\nset -e\npython manage.py migrate --noinput\npython manage.py collectstatic --noinput\npython manage.py shell -c "\nfrom django.contrib.auth.models import User\nif not User.objects.filter(username=\x27admin\x27).exists():\n    User.objects.create_superuser(\x27admin\x27, \x27admin@rsvpwedding.app\x27, \x27admin123\x27)\n" 2>/dev/null || true\nexec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 8000

CMD ["/app/entrypoint.sh"]
