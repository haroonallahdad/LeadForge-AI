# LeadForge AI

> **B2B Lead Intelligence Platform for Tech Harbor**

LeadForge AI helps discover, analyze, and score potential B2B clients across any industry and location. It combines automated lead discovery, website crawling, intelligent scoring, and manual outreach tooling — built with a clean, modular architecture.

**Philosophy:** Find high-quality leads → Analyze them → Provide insights → Enable manual personalized outreach.

---

## Features

- 🔍 **Lead Discovery** — Search businesses by industry + location using pluggable adapters
- 🌐 **Website Crawling** — Extract emails, phones, and social links from public pages
- 📊 **Lead Scoring** — 0–500 score based on digital presence, reviews, and opportunities
- 📝 **Opportunity Insights** — AI-generated notes explaining why each lead is valuable
- 📧 **Email Draft Generator** — Personalized templates for manual outreach (no sending)
- 📤 **Export** — CSV and Excel with all lead data
- 📈 **Analytics Dashboard** — Charts, KPIs, and conversion tracking
- 🔐 **JWT Authentication** — Secure multi-user access
- ⚙️ **Background Jobs** — Celery + Redis for non-blocking searches

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, TailwindCSS, shadcn/ui |
| Backend | Python FastAPI |
| Database | PostgreSQL + SQLAlchemy (async) |
| Jobs | Celery + Redis |
| Crawling | Playwright + BeautifulSoup + httpx |
| Export | openpyxl, pandas |
| Auth | JWT (python-jose) + bcrypt |
| Deployment | Docker + Docker Compose + Nginx |

---

## Quick Start

### Prerequisites

- Docker & Docker Compose installed
- Git

### 1. Clone the repository

```bash
git clone <repo-url>
cd leadforge-ai
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your settings (optional — defaults work out of the box)
```

### 3. Start all services

```bash
docker-compose up --build
```

Services start at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Celery Flower:** http://localhost:5555

### 4. Create your first account

Visit http://localhost:3000/login and register a new account.

> Default demo credentials: `demo@techarbor.com` / `demo1234`

---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium

# Set environment variables
cp .env.example .env
# Edit DATABASE_URL and REDIS_URL to point to local services

# Start FastAPI
uvicorn app.main:app --reload --port 8000

# Start Celery worker (in another terminal)
celery -A app.workers.celery_app worker --loglevel=info
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `SECRET_KEY` | JWT signing key | change in production |
| `DATABASE_URL` | PostgreSQL async connection string | see .env.example |
| `REDIS_URL` | Redis connection string | redis://localhost:6379/0 |
| `GOOGLE_PLACES_API_KEY` | Google Maps Places API key (optional) | empty → uses Mock |
| `OPENAI_API_KEY` | OpenAI key for AI features (optional) | empty → uses templates |
| `USE_MOCK_ADAPTER` | Force mock adapter (true/false) | true |
| `CRAWL_DELAY_SECONDS` | Delay between page requests | 2.0 |

---

## Architecture

```
leadforge-ai/
├── backend/
│   ├── app/
│   │   ├── domain/          # Entities, value objects
│   │   ├── application/     # Services (auth, scoring, email, export)
│   │   ├── infrastructure/  # DB, repositories, adapters, crawlers
│   │   ├── api/             # FastAPI routes
│   │   └── workers/         # Celery tasks
│   └── alembic/             # Database migrations
└── frontend/
    └── src/
        ├── app/             # Next.js App Router pages
        ├── components/      # UI components
        ├── lib/             # API client, utilities
        └── types/           # TypeScript definitions
```

**Patterns used:**
- Clean Architecture (domain → application → infrastructure)
- Repository Pattern (database access abstraction)
- Service Layer Pattern (business logic)
- Adapter Pattern (pluggable data sources)
- Dependency Injection (FastAPI Depends)

---

## Lead Scoring

| Signal | Points |
|---|---|
| No website | +100 |
| Outdated website (score < 50) | +50 |
| No SSL | +20 |
| Rating ≥ 4.0 | +30 |
| Review count > 20 | +20 |
| No contact form | +15 |
| Missing SEO metadata | +15 |
| Not mobile responsive | +20 |
| Active social media | +10 |
| No CTA button | +10 |
| **Maximum** | **500** |

---

## Industry Database

100+ built-in industries across 10+ categories:
- Healthcare, Legal, Construction, Real Estate, Financial
- Automotive, Food & Hospitality, Beauty & Wellness
- Retail, Education, Industrial, Professional Services

Custom industries can be added via the dashboard or API.

---

## Data Sources

### Phase 1 (Current)
- **Mock Adapter** — Deterministic realistic fake data for development/testing
- **Google Places** — Real businesses (requires API key)

### Phase 2+
- Yelp, Yellow Pages, Bing Places, Facebook Business

---

## Ethical Compliance

LeadForge AI is designed for **ethical, compliant lead research**:

- ✅ Only publicly available business data
- ✅ No private or personal individual data
- ✅ No automated mass email sending
- ✅ No authentication bypass
- ✅ Rate limited crawling (2s delays, bot User-Agent)
- ✅ Draft-only email generation — user sends manually

---

## Database Migrations

```bash
# Create a new migration
cd backend
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## Development Roadmap

| Phase | Status | Features |
|---|---|---|
| Phase 1 | ✅ Current | Google adapter, crawler, scoring, export, dashboard |
| Phase 2 | 🔲 Planned | Website analyzer, full CRM, tags, contact history |
| Phase 3 | 🔲 Planned | Executive discovery, AI email (OpenAI), analytics |
| Phase 4 | 🔲 Planned | Admin panel, multiple adapters, webhooks, Zapier |

---

## Support Services

LeadForge AI is built to identify prospects for:

- Web Development
- Mobile Application Development
- Custom Software Development
- Graphic Designing
- Social Media Management
- Ads Marketing
- SEO Services
- Cybersecurity Services
- Automation Solutions

---

Built with ❤️ by **Tech Harbor**
