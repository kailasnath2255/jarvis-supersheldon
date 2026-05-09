# Super Sheldon — Sales-to-Onboarding Automation

A two-page Next.js 14 web app that replaces 15+ minutes of post-payment manual work with a 2-minute form. The frontend talks to three n8n webhooks; n8n handles Airtable, Twilio (WhatsApp), Gmail, and Google Calendar.

This repo is **frontend only**. Backend lives in n8n — see `SHELDON_SALES_AUTOMATION_BUILD_GUIDE.md` for the full setup.

## What it does

- `/sales-form` — sales agent fills student/parent/course/payment details after a sale closes. Submits to n8n.
- `/confirm/[token]` — parent opens this from a magic link in WhatsApp/email. They pick a tutor + slot, accept terms, and get a Google Meet link.
- `/` — landing page that points sales agents to the form.

The app **runs in mock mode** when n8n webhook env vars are unset or still hold the `https://your-n8n-url/...` placeholders. A yellow banner shows when mock mode is active.

## Stack

- Next.js 14 (App Router) + TypeScript (strict)
- Tailwind CSS with the Super Sheldon design tokens (see `DESIGN.md`)
- Lucide React icons
- React Hook Form + Zod for form validation
- Sonner for toasts
- date-fns for date formatting
- canvas-confetti for the celebration

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Both pages work without any backend (mock data).

## Configure the backend

After you build the three n8n workflows (see the build guide), copy `.env.example` to `.env.local` and fill the three webhook URLs:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_N8N_NEW_ENROLLMENT_URL=https://<your-n8n>/webhook/new-enrollment
NEXT_PUBLIC_N8N_GET_ENROLLMENT_URL=https://<your-n8n>/webhook/get-enrollment
NEXT_PUBLIC_N8N_CONFIRM_URL=https://<your-n8n>/webhook/parent-confirm
```

Restart the dev server. The yellow mock banner should disappear.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, "New Project" → import the repo. Framework auto-detects as Next.js.
3. Add the three `NEXT_PUBLIC_N8N_*` env vars in Project Settings → Environment Variables.
4. Deploy. Subsequent pushes redeploy automatically.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Run the production build locally |
| `npm run typecheck` | TypeScript check, no emit |
| `npm run lint` | Next.js ESLint |

## Project layout

```
app/
  layout.tsx              # Fonts + Toaster
  page.tsx                # Landing
  sales-form/page.tsx     # Page 1
  confirm/[token]/page.tsx# Page 2
  globals.css
components/shared/        # SectionHeader, FormField, LoadingState, Logo, MockBanner
lib/
  api.ts                  # Webhook calls + mock fallback
  schemas.ts              # Zod schemas
  types.ts                # Shared types + enums
  format.ts               # Date / currency helpers
public/logo.svg
DESIGN.md                 # Design tokens + voice
```

## Design system

See `DESIGN.md`. Tokens live in `tailwind.config.ts`. Don't hardcode hex values outside those two files.
