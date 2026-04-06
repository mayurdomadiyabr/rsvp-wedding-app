#!/usr/bin/env bash
# Render build script for Django backend
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --noinput
python manage.py migrate --noinput

# Create default superuser if it doesn't exist
python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@rsvpwedding.app', 'admin123')
    print('Superuser created')
else:
    print('Superuser already exists')
"
