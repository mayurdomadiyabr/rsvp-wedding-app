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

# Entrypoint: migrate, seed admin, then start gunicorn
COPY <<EOF /app/entrypoint.sh
#!/bin/bash
set -e
python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py seed_admin
exec gunicorn config.wsgi:application --bind 0.0.0.0:\${PORT:-8000} --workers 2
EOF
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

CMD ["/app/entrypoint.sh"]
