# Super Sheldon — Sales-to-Onboarding Automation

A Next.js 14 + n8n + Airtable stack that turns 15+ minutes of post-payment manual work into a 2-minute form. Sales agents submit an enrollment, parents pick a time slot from a magic link, Google Calendar + Meet + WhatsApp + email are auto-created.

**Live demo:** https://jarvis-supersheldon.vercel.app
**Repo:** https://github.com/kailasnath2255/jarvis-supersheldon

## What's in this repo

Frontend only. Backend lives in:
- **n8n Cloud** workspace (workflow JSONs exported to [`n8n/`](n8n/))
- **Airtable** base (`Sheldon Sales Pipeline`)
- **Twilio** sandbox (WhatsApp)
- **Google Calendar + Gmail** (via OAuth)

Full backend wiring is in [BACKEND_SETUP.md](BACKEND_SETUP.md).

---

## Pages (Next.js App Router)

| Path | Purpose |
|---|---|
| `/` | Landing page — links to sales form + enrollments dashboard |
| `/sales-form` | The After Sales master form (4 sections, dynamic multi-batch support, student auto-fill, country-code phone, payment-mode dropdown) |
| `/enrollments` | Ops dashboard — list of every enrollment with status badges + delivery indicators |
| `/enrollments/[token]` | Full admin detail view for one enrollment — every field, additional-batch breakdown, Meet link |
| `/confirm/[token]` | Parent confirmation flow — pick a time slot, agree to terms, get Google Meet link |

---

## Project layout

```
app/
  layout.tsx                           # Fonts (loaded via <link>), Toaster, favicon
  page.tsx                             # Landing
  globals.css                          # Tailwind base + body styles
  sales-form/page.tsx                  # Master sales form
  confirm/[token]/page.tsx             # Parent confirmation
  enrollments/page.tsx                 # Ops dashboard (card grid)
  enrollments/[token]/page.tsx         # Admin detail view (full enrollment)

components/shared/
  Logo.tsx                             # Brand logo (image-based)
  MockBanner.tsx                       # "Running in mock mode" banner
  SectionHeader.tsx                    # eyebrow + h1 + subtitle pattern
  FormField.tsx                        # label + child + hint/error
  LoadingState.tsx                     # Skeleton + SkeletonCard
  StudentPicker.tsx                    # Searchable student dropdown w/ autofill
  PhoneInput.tsx                       # Country-code select + national-number input
  MultiSelect.tsx                      # Chip-based multi-select
  AdditionalEnrollments.tsx            # Dynamic multi-batch UI (FRD)

lib/
  api.ts                               # n8n webhook wrappers (with mock-mode fallback)
  schemas.ts                           # Zod schemas (incl. conditional superRefine)
  types.ts                             # Shared types + enum constants
  format.ts                            # Date / currency helpers

n8n/
  workflow-1-new-enrollment.json       # POST /webhook/new-enrollment
  workflow-2-get-enrollment.json       # GET  /webhook/get-enrollment?token=
  workflow-3-parent-confirm.json       # POST /webhook/parent-confirm
  workflow-4-list-enrollments.json     # GET  /webhook/list-enrollments
  workflow-5-list-students.json        # GET  /webhook/list-students

airtable/
  enrollments-seed.csv                 # Schema-bootstrap CSV
  tutors-seed.csv                      # 3 sample tutors
  slots-seed.csv                       # 15 future slots
  bookings-seed.csv                    # Schema bootstrap
  communications-seed.csv              # Schema bootstrap

scripts/
  test-airtable.sh                     # 4-step PAT diagnostic
  test-twilio.sh                       # Direct Twilio sandbox test (bypasses n8n)
  debug-slots.sh                       # Inspect AvailableSlots + tutor links
  link-slots.sh                        # Auto-link orphan slots to tutors
  seed-tutors.sh                       # Seeds 30 tutors + 150 future slots via API
  seed-students.sh                     # Seeds 30 demo students with COUNTRY-NUMBER-NAME ids

public/
  logo.webp                            # Super Sheldon brand logo
  logo.svg                             # Legacy placeholder (unused)

BACKEND_SETUP.md                       # Step-by-step n8n + Airtable + Twilio + Google setup
DESIGN.md                              # Design tokens, voice rules, component patterns
SHELDON_SALES_AUTOMATION_BUILD_GUIDE.md # Original build guide
```

---

## Stack

- **Next.js 14** (App Router) + **TypeScript** strict mode
- **Tailwind CSS** with Super Sheldon design tokens
- **React Hook Form** + **Zod** (validation, conditional `superRefine`)
- **Sonner** (toasts), **Lucide** (icons), **date-fns** (dates), **canvas-confetti** (celebrations)
- **Vercel** for hosting (auto-deploys from `main`)
- **n8n Cloud** for backend workflows
- **Airtable** as source-of-truth database
- **Twilio** (WhatsApp sandbox), **Gmail OAuth2**, **Google Calendar OAuth2** (auto Meet links)

---

## Features

### Sales form (`/sales-form`)
Three big sections + dynamic multi-batch handling:

**Section 1 — Student information**
- **Student ID** is a searchable combobox over a Students Airtable table (30 seeded students with IDs like `AUS-7733-Gawin`). Picking a student auto-fills name, parent name, email, WhatsApp, demo tutor, and toggles "Sale without demo" based on the student's demo status.
- **Sale without demo** (Yes/No)
- **Student name** (required)
- **Parent name** (optional)
- **Parent WhatsApp** with **country-code dropdown** (12 countries — IN, US, GB, AU, NZ, AE, SG, DE, FR, JP, CN, ZA)
- **Parent email** (required, validated)
- **Specific requirement** (required, free text)
- **Is referral lead?** (Yes/No)

**Section 2 — Enrollment details + Internal**
- Date of enrollment (defaults today)
- Type of enrolment: New Sale, Cross Sale on New enrolment, Cross Sale on existing student, Reactivation
- Course (single select), Classes in payment, Classes sold monthly (4/6/8/10/12)
- Sales agent, Sale type, Lead source (Pre sales team, DSA, Performance marketing, Referral), Demo tutor, Preferred timing
- **Multi-batch sub-section** (the FRD feature):
  - "Did this payment include enrolments for more than one batch?" YES/NO
  - If YES: pick type → "Same student, additional subject(s)", "Different student(s)", or "Both"
  - Conditional fields render dynamically with full Zod validation
  - **"+ Add another student"** repeater for multi-student situations
  - Each additional student gets 8 fields incl. multi-select courses

**Section 3 — Payment details**
- Currency (INR/GBP/USD/AUD/NZD), Collection in customer's currency
- Mode of payment (UPI, Card, Online, Others)
- Payment ID, Collection in INR, Payment screenshot

### Parent confirmation (`/confirm/<token>`)
- Loads enrollment from n8n via magic token
- Shows "What happens next" steps
- **Pick a starting time** — flat grid of all available slots across all tutors, sorted chronologically. Tutor is auto-assigned based on which slot the parent picks (no tutor-selection step).
- Agreement checkbox + "Lock it in" → confetti + Google Meet link + WhatsApp/email confirmation sent

### Ops dashboard (`/enrollments`)
- Card grid of every enrollment, newest first
- Each card: student/parent/course/amount/status, delivery indicators (WA/Email/Confirmed/Meet), time since created, Meet link if booked
- "Open" → admin detail page (NOT the parent flow)
- Refresh button

### Admin detail view (`/enrollments/<token>`)
- Hero with student name, parent name, status badge, all 4 delivery indicators, token
- "Open parent confirm flow" button to switch into the parent view if needed
- **Student information** block (8 fields)
- **Enrollment details** block (10 fields)
- **Payment details** block (5 fields)
- **Additional batch enrollments** block — parses `additional_enrollments_json` and renders same-student subjects + each different student
- **Confirmation** block with slot datetime + Meet link + copy/open buttons

---

## n8n workflows

| # | Path | Purpose |
|---|---|---|
| 1 | `POST /webhook/new-enrollment` | Receives the sales form. Generates magic_token, creates Airtable row, sends WhatsApp + email with magic link, marks sent. Handles multi-batch payload. |
| 2 | `GET /webhook/get-enrollment?token=` | Looks up enrollment for parent confirm page. Returns enrollment + all available slots across all active tutors. |
| 3 | `POST /webhook/parent-confirm` | Parent picked a slot. Creates Google Calendar event (with Meet conferencing), updates Airtable, sends confirmation WhatsApp + email. |
| 4 | `GET /webhook/list-enrollments` | Ops dashboard data source. Returns full data of all enrollments. |
| 5 | `GET /webhook/list-students` | Powers the Student Picker. Returns all rows from the Students table. |

All workflows have CORS preflight, retries with backoff, `continueOnFail` on non-critical messaging nodes, and Code-node based payload shaping for clean Airtable writes via `Map Automatically`.

---

## Airtable schema

Base: **Sheldon Sales Pipeline** (`app6o2dh6wgXwGYwr`)

Tables:
- **Enrollments** — primary table. ~35 fields incl. magic_token (primary), all form fields, status, delivery flags, meet_link, and new multi-batch fields (`has_additional_enrollments`, `additional_type`, `additional_enrollments_json`).
- **Tutors** — name (primary), email, phone, subjects (multi-select), bio. Reverse-linked from AvailableSlots.
- **AvailableSlots** — slot_id (autonumber primary), tutor (link), slot_datetime, is_booked.
- **Students** — student_id (primary, e.g. `AUS-7733-Gawin`), name, country, age, grade, parent contact info, interested_in, demo_completed, demo_tutor, demo_date, notes.
- **Bookings** — booking_id (primary), enrollment (link), tutor (link), slot_datetime, meet_link, status, created_at.
- **Communications** — (not currently used by workflows; reserved for future delivery callbacks)

See [BACKEND_SETUP.md](BACKEND_SETUP.md) for the full field-by-field schema and Cobuilder prompts.

---

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. App runs in **mock mode** if env vars aren't set — shows a yellow banner, returns sample data.

### Connect to live n8n

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill the 5 webhook URLs:

```
NEXT_PUBLIC_N8N_NEW_ENROLLMENT_URL=https://<your-n8n>/webhook/new-enrollment
NEXT_PUBLIC_N8N_GET_ENROLLMENT_URL=https://<your-n8n>/webhook/get-enrollment
NEXT_PUBLIC_N8N_CONFIRM_URL=https://<your-n8n>/webhook/parent-confirm
NEXT_PUBLIC_N8N_LIST_ENROLLMENTS_URL=https://<your-n8n>/webhook/list-enrollments
NEXT_PUBLIC_N8N_LIST_STUDENTS_URL=https://<your-n8n>/webhook/list-students
```

Restart `npm run dev`. The mock banner disappears.

## Production deploy (Vercel)

Push to `main` — Vercel auto-deploys. Environment variables are set in the Vercel project (Settings → Environment Variables) for all 5 `NEXT_PUBLIC_N8N_*` URLs.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run typecheck` | Strict TypeScript check, no emit |
| `npm run lint` | Next.js ESLint |

## Backend helper scripts (under `scripts/`)

Run from repo root:

```bash
bash scripts/test-airtable.sh <PAT>      # Diagnose PAT permissions + base access
bash scripts/test-twilio.sh <SID> <TOK>  # Send a test WhatsApp directly via Twilio (bypasses n8n)
bash scripts/debug-slots.sh <PAT>        # List + analyze AvailableSlots
bash scripts/link-slots.sh <PAT>         # Auto-link unlinked slots to the 3 main tutors
bash scripts/seed-tutors.sh <PAT>        # +30 tutors + 150 future slots
bash scripts/seed-students.sh <PAT>      # +30 demo students with COUNTRY-NUMBER-NAME ids
```

PAT = your Airtable Personal Access Token (`pat...`). Keep it out of chat/screenshots — it's like a password.

---

## Design system

Tokens live in [tailwind.config.ts](tailwind.config.ts). Don't hardcode hex values outside of that file. Voice rules + components in [DESIGN.md](DESIGN.md).

- Primary orange `#FF6B1F`
- Off-white page bg `#FFF8F2`
- Cards `rounded-2xl shadow-ss border-ss-ink-200`
- Buttons `rounded-full`
- Fonts: Plus Jakarta Sans (display) + Inter (body), loaded via `<link>` in `app/layout.tsx`

## Mock mode

Each function in [lib/api.ts](lib/api.ts) falls back to mock data when the corresponding env var is unset or still holds the `https://your-n8n-url/...` placeholder. The `<MockBanner />` component renders a yellow notice on the form, dashboard, and detail pages whenever any URL is in mock mode.

This means the app boots and looks correct even before n8n is wired — useful for design reviews and first-time setup.

---

## Status (as of latest commit)

- ✅ Frontend deployed to Vercel
- ✅ All 5 n8n workflows live on n8n Cloud (`sheldon-sales.app.n8n.cloud`)
- ✅ Airtable base wired with 6 tables, 30 tutors + 150 slots seeded, 30 students seeded
- ✅ Twilio WhatsApp sandbox + Gmail + Google Calendar OAuth all connected
- ✅ End-to-end flow tested: form → magic link → slot pick → Meet event + confirmation messages
- 📌 Production WhatsApp (Meta Cloud API or WATI) — not yet migrated; sandbox still in use for hackathon scope

---

## Known scope cuts (deferred features)

- Production WhatsApp via Meta Cloud API (replace Twilio sandbox)
- Splitting multi-batch additional rows into separate Airtable Enrollment records (currently stored as JSON on primary row)
- Follow-up message asking parent about retaining demo tutor vs picking a new one
- Delivery confirmation events (Twilio status callbacks → Airtable Communications table)
- Production-grade auth on the list-enrollments + list-students endpoints (currently public webhooks)

---

## License

Internal hackathon project. Don't redistribute the Super Sheldon brand assets.
