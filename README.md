# RSVP Wedding App

A full-stack wedding RSVP platform built with **Django + DRF** (backend) and **Next.js + React + Redux + shadcn/ui** (frontend).

## Features

### Admin Flow (Protected)
- JWT-based authentication
- Create events with title, date/time, location, description, +1 toggle, and max capacity
- Paginated guest list with filter by RSVP status and search by name/email
- Export guest list to `.xlsx` (generated in a background thread)
- Real-time guest list updates via 5-second polling
- Analytics dashboard with RSVP breakdown, +1 rates, and dietary charts (Recharts)
- Check-in guests via the admin panel
- Email confirmations with QR code attached (via SendGrid/Mailgun)

### Participant Flow (Public)
- Dynamic event landing page at `/event/<uuid>`
- RSVP form with name, email (unique per event), dietary preferences, and +1 support
- Automatic waitlist when event reaches capacity
- QR code generated on accepted RSVP for check-in
- Clear success, waitlist, and error feedback

### API Documentation
- Auto-generated Swagger UI at `http://localhost:8000/api/docs/`
- ReDoc at `http://localhost:8000/api/redoc/`

---

## Tech Stack

| Layer      | Technology                                         |
|------------|---------------------------------------------------|
| Frontend   | Next.js 14, React, Redux Toolkit (RTK Query), Tailwind CSS, shadcn/ui |
| Backend    | Python, Django 5.1, Django REST Framework          |
| Database   | SQLite (dev) / PostgreSQL (prod/Docker)            |
| Charts     | Recharts                                           |
| QR Codes   | qrcode + Pillow                                    |
| Export     | openpyxl (background thread)                       |
| API Docs   | drf-spectacular (Swagger/OpenAPI)                  |

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create an admin user
python manage.py createsuperuser

# Start the server
python manage.py runserver
```

Backend runs at **http://localhost:8000**

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## Docker Setup

Spin up everything with one command:

```bash
docker-compose up --build
```

This starts:
- **PostgreSQL** on port 5432
- **Django backend** on port 8000
- **Next.js frontend** on port 3000

Create an admin user inside the container:

```bash
docker-compose exec backend python manage.py createsuperuser
```

---

## Project Structure

```
rsvp-wedding-app/
├── backend/
│   ├── config/               # Django settings, root URLs, WSGI
│   ├── accounts/             # JWT auth (login, refresh, /me)
│   ├── events/               # Event model, CRUD API, public endpoint
│   ├── guests/               # Guest model, RSVP, QR, export, analytics
│   ├── requirements.txt
│   ├── Dockerfile
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages (App Router)
│   │   │   ├── admin/        # Login, dashboard, event management
│   │   │   └── event/[id]/   # Public RSVP page
│   │   ├── components/ui/    # shadcn/ui components
│   │   ├── store/            # Redux Toolkit + RTK Query
│   │   ├── types/            # TypeScript interfaces
│   │   └── lib/              # Utilities
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## API Endpoints

### Auth
| Method | Endpoint             | Description              |
|--------|---------------------|--------------------------|
| POST   | `/api/auth/login/`   | Get JWT token pair       |
| POST   | `/api/auth/refresh/` | Refresh access token     |
| GET    | `/api/auth/me/`      | Current user profile     |

### Events (Admin)
| Method | Endpoint                   | Description            |
|--------|---------------------------|------------------------|
| GET    | `/api/events/`             | List admin's events    |
| POST   | `/api/events/`             | Create event           |
| GET    | `/api/events/<uuid>/`      | Event detail           |
| PATCH  | `/api/events/<uuid>/`      | Update event           |
| DELETE | `/api/events/<uuid>/`      | Delete event           |

### Events (Public)
| Method | Endpoint                          | Description              |
|--------|----------------------------------|--------------------------|
| GET    | `/api/events/<uuid>/public/`      | Public event details     |

### Guests
| Method | Endpoint                                        | Description                |
|--------|-------------------------------------------------|----------------------------|
| GET    | `/api/events/<uuid>/guests/`                     | Paginated guest list       |
| POST   | `/api/events/<uuid>/rsvp/`                       | Submit RSVP (public)       |
| POST   | `/api/events/<uuid>/guests/export/`              | Trigger xlsx export        |
| GET    | `/api/events/<uuid>/guests/export/<filename>/`   | Download exported file     |
| POST   | `/api/events/<uuid>/checkin/<guest_uuid>/`       | Check in a guest           |
| GET    | `/api/events/<uuid>/analytics/`                  | RSVP analytics             |

---

## Environment Variables

### Backend
| Variable               | Default                              | Description             |
|-----------------------|--------------------------------------|-------------------------|
| `DJANGO_SECRET_KEY`    | dev key                              | Django secret key       |
| `DJANGO_DEBUG`         | `True`                               | Debug mode              |
| `DJANGO_ALLOWED_HOSTS` | `*`                                  | Allowed hosts           |
| `DB_ENGINE`            | `django.db.backends.sqlite3`         | Database engine         |
| `DB_NAME`              | `db.sqlite3`                         | Database name           |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000`              | CORS origins            |
| `EMAIL_BACKEND`        | `console.EmailBackend`               | Email backend           |
| `EMAIL_HOST`           | `localhost`                          | SMTP host               |
| `EMAIL_PORT`           | `587`                                | SMTP port               |
| `EMAIL_HOST_USER`      | (empty)                              | SMTP username           |
| `EMAIL_HOST_PASSWORD`  | (empty)                              | SMTP password/API key   |
| `DEFAULT_FROM_EMAIL`   | `noreply@rsvpwedding.app`            | Sender email address    |

### Frontend
| Variable              | Default                  | Description        |
|----------------------|--------------------------|---------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000`  | Backend API URL     |
