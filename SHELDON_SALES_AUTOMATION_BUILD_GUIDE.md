# Super Sheldon — Sales-to-Onboarding Automation
## Complete Hackathon Build Guide (Single Source of Truth)

> Read this whole doc once. Then follow it top-to-bottom. Don't skip steps. Total build time: ~10–14 hours of work spread across the hackathon window.

---

## TABLE OF CONTENTS

1. What you are building (the flow, in plain English)
2. The full stack (what runs where)
3. Free-tier budget (what costs nothing, what runs out)
4. PHASE 1 — Manual setup you do BEFORE pasting the AI prompt (~90 min)
5. PHASE 2 — The Master AI Prompt (paste this into Bolt / v0 / Cursor / Lovable)
6. PHASE 3 — Build the n8n workflows (after AI finishes the frontend)
7. PHASE 4 — Wire it all together (environment variables, deploy)
8. PHASE 5 — Demo-day checklist
9. APPENDIX A — Airtable schema (every field, every type)
10. APPENDIX B — Webhook contracts (request/response JSON)
11. APPENDIX C — Full DESIGN.md verbatim (paste into your repo as `DESIGN.md`)

---

## 1. WHAT YOU ARE BUILDING

A web app that takes the **15–25 minutes** of post-payment manual work the sales agent does today and compresses it to **2 minutes** of form-filling. The rest happens automatically.

### The flow (end-to-end, in 9 beats)

```
1. Sales agent fills ONE master form on the web app             [Next.js page]
2. Form submission writes a row to Airtable                     [Airtable Enrollments table]
3. n8n is triggered by webhook                                  [n8n Workflow 1]
4. n8n generates a unique magic_token, sends:
     a) WhatsApp message to parent (via Twilio)
     b) Email to parent (via Gmail)
   Both contain a link: yourapp.vercel.app/confirm/<token>
5. Parent clicks link → opens our web app's confirmation page   [Next.js parent page]
   They see: course details, agreement text, tutor list, slot picker.
6. Parent picks tutor + slot, accepts agreement, submits.       [POST to n8n Workflow 2]
7. n8n creates a Google Calendar event with auto-generated 
   Google Meet link. Updates Airtable.                          [n8n Workflow 2]
8. n8n sends the Meet link + booking confirmation back to 
   parent (WhatsApp + Email) and to the assigned tutor.
9. The Airtable Interface dashboard shows every stage going 
   green in real time. Sales/Ops see the whole pipeline live.   [Airtable Interface]
```

### Why each tool

| Concern | Tool | Why this one |
|---|---|---|
| Database (the source of truth) | **Airtable** | Beginners already use it. Has built-in dashboards. Free for up to 1000 records per base. |
| Workflow brain (replaces a custom backend) | **n8n** | Drag-and-drop. Has Airtable, Twilio, Gmail, Google Calendar as native nodes. Self-hosted = unlimited free. |
| Sales form + parent confirmation page | **Next.js 14 (App Router) on Vercel** | Two pages. Free hosting. AI builders write Next.js best. |
| Ops dashboard | **Airtable Interface Designer** | Zero code. Drag-drop kanban + filters. Looks professional. |
| WhatsApp delivery | **Twilio WhatsApp Sandbox** | Truly free. Parent sends `join <code>` once to opt in. |
| Email | **Gmail** (via n8n's Gmail node) | No domain verification. OAuth in n8n once. |
| Calendar + Meet link | **Google Calendar API** (via n8n's node) | Auto-generates Meet link with the event. |
| Frontend hosting | **Vercel** | Free. One-click GitHub deploy. |
| n8n hosting | **Railway** (1-click n8n template) | $5 free credit covers ~3 weeks. Or use n8n Cloud free trial. |

---

## 2. THE FULL STACK

```
┌─────────────────────────────────────────────────────────────────┐
│  Sales Agent's Browser                  Parent's Browser        │
│  (fills sales form)                     (clicks magic link)     │
│         │                                       │               │
└─────────┼───────────────────────────────────────┼───────────────┘
          │                                       │
          ▼                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Next.js 14 app on VERCEL                                        │
│   - /sales-form    (sales agent fills this)                      │
│   - /confirm/[token]  (parent confirms this)                     │
│   - Tailwind CSS, shadcn/ui, Lucide icons                        │
│   - Reads NEXT_PUBLIC_N8N_*_WEBHOOK env vars                     │
└────────────────────────────────────┬─────────────────────────────┘
                                     │ HTTPS POST/GET
                                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  n8n on RAILWAY (or n8n Cloud trial)                             │
│   - Workflow 1: New Enrollment                                   │
│       Webhook → Set token → Airtable Create → Twilio + Gmail     │
│                                                                   │
│   - Workflow 2: Parent Confirmation                              │
│       Webhook → Airtable Get → Google Calendar Create →          │
│       Airtable Update → Twilio + Gmail (send Meet link)          │
│                                                                   │
│   - Workflow 3: Get Enrollment By Token (helper, GET)            │
│       Webhook → Airtable Get → Returns enrollment + tutors       │
└──┬─────────────┬─────────────┬─────────────────┬────────────────┘
   │             │             │                 │
   ▼             ▼             ▼                 ▼
┌──────┐   ┌──────────┐   ┌──────────┐   ┌────────────────────┐
│Airtable│  │ Twilio   │  │ Gmail    │  │ Google Calendar    │
│        │  │ Sandbox  │  │ (OAuth)  │  │ + Meet (OAuth)     │
│- Enroll│  │(WhatsApp)│  │          │  │                    │
│- Tutors│  └──────────┘  └──────────┘  └────────────────────┘
│- Slots │
│- Comms │       ▲
│- Books │       │  Ops team sees live pipeline
│        │       │  via Airtable Interface dashboard
└────────┘───────┘
```

---

## 3. FREE-TIER BUDGET

| Service | Free tier | Will you exceed it for the hackathon? |
|---|---|---|
| Vercel | Unlimited static sites, 100 GB bandwidth/mo | No |
| Airtable | 1000 records per base, 5 editors | No (you'll have ~10 demo rows) |
| Railway | $5 free credit/mo (n8n uses ~$3-4) | No, runs ~3 weeks free |
| n8n Cloud (alternative) | 14-day free trial, then paid | Use for 14 days, then move to Railway |
| Twilio | $15 free trial credit. Sandbox WhatsApp = free | No |
| Gmail | Free (no quota issue at hackathon scale) | No |
| Google Calendar API | Free (no quota issue) | No |
| **Bolt.new** (AI builder option) | Free with daily token cap | Maybe — split prompt into 2 if hit |
| **v0.dev** (AI builder option) | Free 200 messages/mo | No |
| **Cursor** (AI builder option) | 14-day Pro trial, then limited free | No |
| **Lovable** (AI builder option) | Free tier with daily limit | No |

**Total cost for the hackathon: $0.**

---

## 4. PHASE 1 — MANUAL SETUP (do this BEFORE pasting the AI prompt)

> Do these 9 steps yourself. They take ~90 minutes. While you're doing this, the AI cannot help — it's account creation and external service config. Once done, the AI prompt in Phase 2 will have everything it needs.

### Step 1.1 — Create Airtable account and base (~15 min)

1. Go to https://airtable.com → Sign up (free).
2. Create a new base. Name it: **`Sheldon Sales Pipeline`**.
3. You'll add 5 tables. **Use the exact field names below — the AI prompt and n8n workflows depend on them.** See **APPENDIX A** for full field types. For now, just create the table names:
   - `Enrollments`
   - `Tutors`
   - `AvailableSlots`
   - `Communications`
   - `Bookings`
4. **Generate a Personal Access Token (PAT)**:
   - Click your avatar (top right) → Builder hub → Personal access tokens.
   - Click "Create new token". Name: `Sheldon n8n`.
   - Scopes: `data.records:read`, `data.records:write`, `schema.bases:read`.
   - Access: select the `Sheldon Sales Pipeline` base.
   - Click Create. **Copy the token now — you can't see it again.** Save it as `AIRTABLE_PAT` in a notes file.
5. **Get the Base ID**:
   - Go to https://airtable.com/api → click your base → the URL contains `app...` — that's your `AIRTABLE_BASE_ID`. Save it.
6. **Build the schema using APPENDIX A** (do this carefully — wrong field types break n8n later).
7. Add 3 fake tutors and ~10 available slots for demo data.

### Step 1.2 — Twilio WhatsApp Sandbox (~10 min)

1. Go to https://www.twilio.com → Sign up (free).
2. Verify your phone number (Twilio sends a code).
3. In the Twilio console: Develop → Messaging → Try it out → **Send a WhatsApp message**.
4. You'll see a Twilio sandbox number (e.g. `+14155238886`) and a join code (e.g. `join sunny-river`).
5. **Save these values**:
   - `TWILIO_ACCOUNT_SID` (from Account Info on dashboard)
   - `TWILIO_AUTH_TOKEN` (from Account Info — click to reveal)
   - `TWILIO_WHATSAPP_FROM` = `whatsapp:+14155238886` (their sandbox number)
   - `TWILIO_SANDBOX_JOIN_CODE` = e.g. `join sunny-river`
6. **Send `join sunny-river` from the demo parent's WhatsApp to the sandbox number now.** Until you do, that phone won't receive sandbox messages. Each test phone needs to do this once.

### Step 1.3 — Gmail account (~5 min)

1. Use an existing Gmail OR create a new one (e.g. `sheldon.demo@gmail.com`).
2. You'll OAuth into n8n in Step 1.6 — no manual API key needed.
3. **Don't use 2FA-protected personal Gmail for the demo if possible** — OAuth flow is smoother on a fresh account.

### Step 1.4 — Google Cloud project for Calendar API (~15 min)

1. Go to https://console.cloud.google.com → log in with the Gmail from Step 1.3.
2. Create a new project: **`Sheldon Calendar`**.
3. APIs & Services → Library → search **`Google Calendar API`** → Enable.
4. APIs & Services → OAuth consent screen:
   - User type: **External**.
   - App name: `Sheldon Sales Bot`.
   - Support email: your Gmail.
   - Add scope: `https://www.googleapis.com/auth/calendar`.
   - Add yourself as a test user.
5. APIs & Services → Credentials → Create Credentials → OAuth client ID:
   - Type: **Web application**.
   - Authorized redirect URI: **leave blank for now** — you'll add the n8n one in Step 1.6.
   - **Save the Client ID and Client Secret.**

### Step 1.5 — Deploy n8n on Railway (~15 min)

1. Go to https://railway.app → sign up with GitHub.
2. Add a payment method (required to use the $5 free credit, but will not be charged unless you exceed it).
3. New Project → **Deploy from Template** → search `n8n` → click "n8n with Postgres" template → Deploy.
4. Wait ~3 min for it to spin up.
5. Click the n8n service → Settings → Networking → **Generate Domain**. You'll get a URL like `sheldon-n8n-production.up.railway.app`.
6. Go to that URL. n8n will ask you to create the admin account. Save those credentials.
7. **Save the URL** as `N8N_BASE_URL`.

> **Alternative if Railway is being slow:** Use n8n Cloud free trial at https://n8n.io. 14 days, no card needed. Same UX.

### Step 1.6 — Add credentials inside n8n (~20 min)

In n8n: Settings → Credentials → New. Add these four:

1. **Airtable Personal Access Token**
   - Search "Airtable" → "Airtable Personal Access Token API"
   - Paste your `AIRTABLE_PAT`. Save.

2. **Twilio**
   - Search "Twilio" → "Twilio API"
   - Account SID + Auth Token from Step 1.2. Save.

3. **Gmail OAuth2**
   - Search "Gmail" → "Gmail OAuth2 API"
   - Client ID and Client Secret: Reuse the ones from Step 1.4 (Calendar OAuth client works for Gmail too if you add the scope).
     - **OR** create a separate Web Application OAuth client in Google Cloud Console.
   - Copy the **OAuth Redirect URL** that n8n shows (something like `https://your-n8n.up.railway.app/rest/oauth2-credential/callback`).
   - Paste that URL into the Google Cloud Console OAuth client → Authorized redirect URIs → Save.
   - Back in n8n: click "Sign in with Google" → authorize → done.

4. **Google Calendar OAuth2**
   - Same as above, but choose Google Calendar OAuth2 API.
   - Same redirect URL pattern. Same OAuth client works.

### Step 1.7 — Vercel account (~3 min)

1. Go to https://vercel.com → sign up with GitHub.
2. That's it. You'll deploy from the AI builder later.

### Step 1.8 — GitHub repo (~3 min)

1. Create a new repo: **`sheldon-sales-automation`** (private is fine).
2. The AI builder will push code here OR you'll commit it manually.

### Step 1.9 — Final check before pasting the AI prompt

You should now have all of these saved in a notes file:

```
AIRTABLE_PAT=pat...
AIRTABLE_BASE_ID=app...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_SANDBOX_JOIN_CODE=join sunny-river
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
N8N_BASE_URL=https://sheldon-n8n-production.up.railway.app
GMAIL_FROM=sheldon.demo@gmail.com
```

**You don't have webhook URLs yet — you'll get those in Phase 3 after building the n8n workflows. The AI prompt expects placeholders for them, which you'll fill in afterwards.**

You're ready for Phase 2. ✅

---

## 5. PHASE 2 — THE MASTER AI PROMPT

> Paste everything between the `===PROMPT START===` and `===PROMPT END===` markers (do **not** include the markers themselves) into your AI builder. Recommended: **Bolt.new** for fastest end-to-end build, **v0.dev** for best UI quality, **Cursor** if you want the code in your local repo.
>
> **If your AI builder hits its token limit on a single prompt:** split at the `─────────── PART 2 ───────────` separator inside the prompt and send each part as a separate message in the same chat session.

```
===PROMPT START===

# PROJECT: Super Sheldon Sales-to-Onboarding Automation Web App

You are building a Next.js 14 web application for Super Sheldon, an EdTech tutoring company based in Bangalore. This app replaces a 15-minute manual sales process with a 2-minute form. Two pages, deployed on Vercel.

## TECH STACK (USE EXACTLY THESE — DO NOT SUBSTITUTE)

- Next.js 14 with App Router
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui components (`npx shadcn@latest add` for each component used)
- Lucide React icons (no other icon library)
- React Hook Form + Zod for form validation
- Sonner for toast notifications
- date-fns for date formatting
- No state management library (use React state)
- No database client (frontend talks to n8n webhooks only)

## ABSOLUTE RULES

1. NEVER hardcode hex colors anywhere except in `tailwind.config.ts` and `globals.css`. Use tokens.
2. NEVER add a "dark mode" — this app is light-mode only.
3. NEVER write backend logic in the frontend. All side effects (database writes, sending messages) happen via n8n webhook calls.
4. NEVER use a library not listed above without explicit reason.
5. ALL form copy must follow the voice cheatsheet (Section 9 of design system below). E.g. button label is "Send to parent", not "Submit".

## DESIGN SYSTEM (BAKE THESE TOKENS INTO `tailwind.config.ts` AND `globals.css`)

Primary color: orange `#FF6B1F`
Page background: off-white `#FFF8F2`
Card background: pure white `#FFFFFF`
Body text: ink-700 `#2A2E36`
Heading text: ink-900 `#0F1115`

Fonts: Plus Jakarta Sans (display, weights 600/700/800) and Inter (body, weights 400/500/600/700). Load from Google Fonts.

Radius: cards `16px` (rounded-xl), buttons `9999px` (rounded-full), inputs `10px`.
Shadows: `ss` = `0 4px 12px rgba(15,17,21,.06)`, `ss-brand` = `0 8px 24px rgba(255,107,31,.25)` (use on primary button hover).

### Full color palette (add to tailwind.config.ts):
```js
colors: {
  ss: {
    orange: { 50:'#FFF1E6', 100:'#FFE0C7', 200:'#FFC089', 300:'#FFA14B', 400:'#FF8526', 500:'#FF6B1F', 600:'#E85A12', 700:'#C24808', 800:'#8F3505', 900:'#5C2203' },
    ink:    { 100:'#F2F4F7', 200:'#E5E8EE', 300:'#C4C9D2', 400:'#8A91A1', 500:'#5B6271', 700:'#2A2E36', 900:'#0F1115' },
    bg:     { 0:'#FFFFFF', 50:'#FFF8F2' },
    success:'#16A34A', warning:'#F59E0B', error:'#DC2626', info:'#2563EB',
  }
}
```

### Component patterns (USE THESE VERBATIM, DO NOT INVENT NEW ONES):
```tsx
// Primary button
<button className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-ss-orange-500 text-white font-semibold hover:bg-ss-orange-600 hover:shadow-ss-brand active:bg-ss-orange-700 disabled:opacity-50 transition">Send to parent</button>

// Secondary button
<button className="px-5 py-3 rounded-full border-2 border-ss-orange-500 text-ss-orange-600 font-semibold hover:bg-ss-orange-50 transition">Save draft</button>

// Input
<input className="w-full px-4 py-3 rounded-[10px] border border-ss-ink-300 bg-white text-ss-ink-900 placeholder-ss-ink-400 focus:border-ss-orange-500 focus:ring-2 focus:ring-ss-orange-200 outline-none transition" />

// Card
<div className="bg-white rounded-2xl shadow-ss p-6 border border-ss-ink-200">…</div>

// Badge
<span className="px-3 py-1 rounded-full bg-ss-orange-50 text-ss-orange-700 text-xs font-semibold">New sale</span>
```

### Voice/copy rules:
- Empty: "Nothing here yet — add one." NOT "No data."
- Loading: "Getting things ready…" NOT "Loading…"
- Error: "Something broke — try again." NOT "Error 500."
- Success: "Sent!" / "Saved!" NOT "Operation successful."
- Confirm delete: "This can't be undone. Delete?" NOT "Are you sure?"

## REPO STRUCTURE TO CREATE

```
/
├── app/
│   ├── layout.tsx                       # Root layout with fonts + Toaster
│   ├── page.tsx                         # Landing page that links to /sales-form
│   ├── globals.css                      # Tailwind directives + CSS variables
│   ├── sales-form/
│   │   └── page.tsx                     # PAGE 1
│   └── confirm/
│       └── [token]/
│           └── page.tsx                 # PAGE 2
├── components/
│   ├── ui/                              # shadcn components go here
│   └── shared/
│       ├── SectionHeader.tsx
│       ├── FormField.tsx
│       └── LoadingState.tsx
├── lib/
│   ├── api.ts                           # Wrapper for n8n webhook calls
│   ├── schemas.ts                       # Zod schemas for form validation
│   └── types.ts                         # Shared TypeScript types
├── public/
│   └── logo.svg                         # Placeholder Super Sheldon logo
├── .env.example                         # Lists all env vars
├── tailwind.config.ts
├── DESIGN.md                            # Copy the design system into the repo
└── README.md
```

## ENVIRONMENT VARIABLES (in `.env.example`)

```
NEXT_PUBLIC_N8N_NEW_ENROLLMENT_URL=https://your-n8n-url/webhook/new-enrollment
NEXT_PUBLIC_N8N_GET_ENROLLMENT_URL=https://your-n8n-url/webhook/get-enrollment
NEXT_PUBLIC_N8N_CONFIRM_URL=https://your-n8n-url/webhook/parent-confirm
```

The user will fill these in after they build the n8n workflows. **Build the frontend with mock data fallback so it works without n8n connected during development.**

## ─────────── PART 1 ───────────

## PAGE 1: `/sales-form` — Sales agent fills this after taking payment

### Layout
- Centered container, max-w-3xl, py-12 px-4.
- Top: Super Sheldon logo (use a simple orange "S" SVG placeholder).
- Section header: eyebrow "AFTER SALES" in orange, h1 "New enrollment", subtitle "Fills in 2 minutes. Everything else is automated."
- The form is one card. Group fields into 4 visual sub-sections with subtle dividers (`border-t border-ss-ink-200`):

### Sub-section 1: Student & Parent
- `student_name` (text, required, label "Student's name")
- `parent_name` (text, required, label "Parent's name")
- `parent_whatsapp` (tel, required, label "Parent's WhatsApp number", placeholder "+91 98XXXXXXXX", helper text "Include country code")
- `parent_email` (email, required, label "Parent's email")

### Sub-section 2: Course
- `course` (select dropdown, required, options: "Maths", "English", "Science", "Coding", "Public Speaking", "Reasoning", "Chess")
- `classes_count` (number, required, label "Number of classes purchased", min 1)
- `sale_type` (radio pill group, required, options: "New sale", "Cross sale")

### Sub-section 3: Payment
- `amount` (number, required, label "Amount received", prefix "₹")
- `currency` (select, default "INR", options: "INR", "GBP", "USD", "AUD", "NZD")
- `payment_screenshot` (file upload, required, accept image/* and pdf, label "Payment screenshot")

### Sub-section 4: Internal
- `sales_agent` (text, required, label "Your name")
- `lead_source` (select, required, options: "Instagram", "Facebook", "Google Ads", "Referral", "Website", "Other")
- `demo_tutor` (text, required, label "Demo session tutor")
- `preferred_timing` (text, optional, label "Preferred class timing (parent's note)")

### Submit button
- Primary button, full-width on mobile, "Send to parent" label.
- On click: validate with Zod. POST to `NEXT_PUBLIC_N8N_NEW_ENROLLMENT_URL`. Use multipart/form-data because of the file upload.
- During submit: button shows spinner + "Sending…".
- On success: replace the form with a success card showing:
  - Big green check icon (Lucide CheckCircle2).
  - "Sent! 👏 [Parent name] will get a WhatsApp + email in a few seconds."
  - Show the magic_token returned by n8n (small monospace text, "Track this enrollment with token: abc123").
  - Button "New enrollment" that resets the form.
- On error: toast (Sonner) "Something broke — try again." and re-enable the button.

### Mock-mode fallback
If `NEXT_PUBLIC_N8N_NEW_ENROLLMENT_URL` is empty or starts with `https://your-n8n-url`, mock the response: wait 1.5s, return `{ success: true, magic_token: "mock_" + Date.now() }`. Show a yellow warning bar at the top of the page: "⚠ Running in mock mode — n8n not connected yet."

## ─────────── PART 2 ───────────

## PAGE 2: `/confirm/[token]` — Parent clicks magic link from WhatsApp/email

### Behavior on page load
- Read `token` from URL params.
- GET `NEXT_PUBLIC_N8N_GET_ENROLLMENT_URL?token={token}`.
- If response is 404: render an error card "This link is invalid or expired."
- If response is OK: render the confirmation flow described below.
- Show a skeleton loader (orange shimmer bars on top of `bg-ss-ink-200`) while loading.

### Layout
- Centered container, max-w-2xl, py-8 px-4.
- Hero card with student's name: "Welcome, [parent_name]! 👋 Let's get [student_name] started in [course]."
- Below it, 4 collapsible-but-default-expanded sections:

### Section 1: "Your purchase"
Read-only summary card. Shows:
- Course, classes count, amount paid (in original currency).
- Demo tutor name.
- A green badge "Payment confirmed".

### Section 2: "What happens next"
Static info card explaining:
1. You'll be assigned a tutor.
2. You'll pick a starting time.
3. You'll get a Google Meet link by WhatsApp + email.
4. Class begins.

### Section 3: "Pick your tutor"
- Render a list of `available_tutors` from the API response.
- Each tutor is a card showing: avatar (initial in orange circle), name, subjects (badges), and a "Choose" button.
- Selected tutor card shows a checked state (green border + checkmark).
- Only one tutor can be selected.

### Section 4: "Pick a starting time"
- Show ONLY after a tutor is selected.
- Render the selected tutor's `available_slots` as a grid of pill buttons (3 cols on desktop, 2 on mobile).
- Each pill shows day + date + time, e.g. "Mon 12 May · 4:00 PM".
- Selected slot has orange filled background, others have white background with border.

### Final section: Agreement + submit
- After tutor + slot picked, show:
- Checkbox: "I agree to Sheldon Labs' tutoring terms and class schedule." (required)
- Button: "Lock it in" (primary, full-width on mobile).
- On click: POST to `NEXT_PUBLIC_N8N_CONFIRM_URL` with `{ magic_token, selected_tutor_id, selected_slot_id, agreement_accepted: true }`.
- During submit: button shows spinner + "Setting up your class…".
- On success: replace page contents with a celebration card:
  - Confetti effect (use canvas-confetti, small import).
  - Big "You're all set! 🎉"
  - "Your Google Meet link has been sent to your WhatsApp and email."
  - Show the meet link as a copyable URL block.
  - Show formatted slot date + tutor name.

### Mock-mode fallback
If env URLs are unset, return mock data: 3 tutors with 5 slots each. After confirm submit, return mock meet link `https://meet.google.com/mock-abc-defg`.

## SHARED CONCERNS

### `lib/api.ts`
Single file with three functions:
- `submitEnrollment(formData: FormData): Promise<{ success: boolean; magic_token: string }>`
- `getEnrollmentByToken(token: string): Promise<EnrollmentDetails>`
- `submitConfirmation(payload: ConfirmPayload): Promise<{ success: boolean; meet_link: string; slot_datetime: string; tutor_name: string }>`

Each function checks the env var. If unset or placeholder, returns mock data. Otherwise calls the real webhook. This lets the AI builder finish the frontend before n8n is wired.

### `lib/types.ts`
```ts
export type Tutor = {
  id: string;
  name: string;
  subjects: string[];
  available_slots: Slot[];
};

export type Slot = {
  id: string;
  datetime: string; // ISO 8601
};

export type EnrollmentDetails = {
  student_name: string;
  parent_name: string;
  course: string;
  classes_count: number;
  amount: number;
  currency: string;
  demo_tutor: string;
  available_tutors: Tutor[];
};

export type ConfirmPayload = {
  magic_token: string;
  selected_tutor_id: string;
  selected_slot_id: string;
  agreement_accepted: true;
};
```

### Loading / empty / error states
Build all three for both pages. Don't ship just the happy path. Per design system:
- Loading: orange skeleton bars (bg-ss-ink-200 animate-pulse).
- Empty (e.g. tutor has no slots): icon + "Nothing here yet — add one." copy.
- Error: red left border + plain explanation + retry button.

### Accessibility
- Every input has a visible `<label>`.
- Focus rings: `focus:ring-2 focus:ring-ss-orange-200`.
- Tap targets ≥ 44px on mobile.
- Test on 360px width.

## DELIVERABLES (in this order)

1. Set up Next.js 14 + Tailwind + shadcn/ui + write `tailwind.config.ts` with the full token palette.
2. Add fonts (Plus Jakarta Sans + Inter) in `app/layout.tsx`.
3. Build `lib/types.ts`, `lib/schemas.ts` (Zod), `lib/api.ts` with mock fallbacks.
4. Build shared components: `SectionHeader`, `FormField`, `LoadingState`.
5. Build `/sales-form` page.
6. Build `/confirm/[token]` page.
7. Build `/` (landing) — just a hero linking to `/sales-form` with copy "Sales team — start here →".
8. Add `DESIGN.md` to repo root with the verbatim design system.
9. Add `README.md` with: what it does, stack, run locally (`npm install && npm run dev`), env var setup, deploy to Vercel instructions.
10. Add `.env.example` with the three NEXT_PUBLIC_N8N_* vars.

## ACCEPTANCE CRITERIA

- App runs with `npm install && npm run dev` without any env vars set (uses mock data).
- All copy follows the voice rules (no "Submit", no "Loading…", no "Error 500").
- Form validation shows inline errors in red, not just colors.
- Both pages work on a 360px-wide mobile viewport.
- No hardcoded hex colors outside `tailwind.config.ts` and `globals.css`.
- No icon libraries other than Lucide.
- TypeScript: no `any`, no `@ts-ignore`.

Build the entire project. Don't ask follow-up questions — make sensible choices and proceed.

===PROMPT END===
```

> **What to do once the AI finishes:** Test the app locally with mock mode (`npm run dev`). Both pages should work without n8n. If something looks off, ask the AI to fix it specifically — don't restart the prompt. Then move to Phase 3.

---

## 6. PHASE 3 — BUILD THE n8n WORKFLOWS

> Now that your frontend works in mock mode, build the three n8n workflows. Each replaces a function in your `lib/api.ts`.

### Workflow 1 — New Enrollment

**Purpose:** Receive form submission → save to Airtable → send WhatsApp + email with magic link.

#### Nodes (left to right):

**1. Webhook (trigger)**
- HTTP Method: `POST`
- Path: `new-enrollment`
- Response Mode: "Using 'Respond to Webhook' node"
- (After save, copy the **Production URL** — this becomes `NEXT_PUBLIC_N8N_NEW_ENROLLMENT_URL`.)

**2. Code (generate magic token)**
- Language: JavaScript
- Code:
```js
const token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
return [{ json: { ...$input.first().json.body, magic_token: token } }];
```

**3. Airtable — Create Record (in Enrollments table)**
- Operation: Create
- Base: select your `Sheldon Sales Pipeline`
- Table: `Enrollments`
- Map every field from the input (`={{ $json.student_name }}`, etc.).
- Set `status` = `Pending`.
- Set `magic_token` = `={{ $json.magic_token }}`.
- The output gives you the new Airtable record ID.

**4. (Parallel branch A) Twilio — Send Message**
- Operation: Send Message
- From: your Twilio sandbox WhatsApp number, prefixed with `whatsapp:` (e.g. `whatsapp:+14155238886`).
- To: `whatsapp:={{ $('Webhook').item.json.body.parent_whatsapp }}`
- Message: 
```
Hi {{ $('Webhook').item.json.body.parent_name }}! 🎉

Welcome to Super Sheldon. We've received your payment for {{ $('Webhook').item.json.body.student_name }}'s {{ $('Webhook').item.json.body.course }} classes.

Tap to confirm your tutor and class timing:
https://your-vercel-url.vercel.app/confirm/{{ $('Code').item.json.magic_token }}

— Team Super Sheldon
```

**5. (Parallel branch B) Gmail — Send Message**
- Send To: `={{ $('Webhook').item.json.body.parent_email }}`
- Subject: `Welcome to Super Sheldon — confirm your class for {{ $('Webhook').item.json.body.student_name }}`
- Email Type: HTML
- Message: Use the same content as the WhatsApp but in HTML, with the orange branding. Template the magic link the same way.

**6. Airtable — Update Record (mark sent)**
- Update the same record (use `={{ $('Airtable').item.json.id }}` as Record ID).
- Set `whatsapp_sent` = `true`, `email_sent` = `true`, `status` = `Notified`.

**7. Respond to Webhook**
- Response Body:
```json
{
  "success": true,
  "magic_token": "={{ $('Code').item.json.magic_token }}",
  "enrollment_id": "={{ $('Airtable').item.json.id }}"
}
```

**Save the workflow → toggle it ACTIVE → copy the Production URL of the Webhook node.**

### Workflow 2 — Get Enrollment by Token (helper for parent page)

**Purpose:** Parent page calls this on load to fetch enrollment details + available tutors.

#### Nodes:

**1. Webhook**
- HTTP Method: `GET`
- Path: `get-enrollment`
- Response Mode: "Using 'Respond to Webhook' node"

**2. Airtable — Search Records (Enrollments)**
- Filter By Formula: `={"magic_token = '" + $json.query.token + "'"}`
- Limit: 1

**3. IF (was a record found?)**
- Condition: `{{ $('Airtable').item.json.id }}` is not empty.
- True branch → continues. False branch → "Respond to Webhook" with status 404 + `{ "error": "not found" }`.

**4. Airtable — List Records (Tutors)**
- List all tutors. Limit 50.

**5. Airtable — List Records (AvailableSlots)**
- Filter By Formula: `={is_booked = FALSE()}`
- Sort by `slot_datetime` asc.

**6. Code — Shape the response**
- JavaScript that combines the enrollment data, groups slots by tutor, returns the `EnrollmentDetails` object.
```js
const enrollment = $('Airtable').item.json.fields;
const tutors = $('Airtable1').all().map(t => t.json);
const slots = $('Airtable2').all().map(s => s.json);

const available_tutors = tutors.map(tutor => ({
  id: tutor.id,
  name: tutor.fields.name,
  subjects: tutor.fields.subjects || [],
  available_slots: slots
    .filter(s => (s.fields.tutor || []).includes(tutor.id))
    .map(s => ({ id: s.id, datetime: s.fields.slot_datetime }))
}));

return [{
  json: {
    student_name: enrollment.student_name,
    parent_name: enrollment.parent_name,
    course: enrollment.course,
    classes_count: enrollment.classes_count,
    amount: enrollment.amount,
    currency: enrollment.currency,
    demo_tutor: enrollment.demo_tutor,
    available_tutors
  }
}];
```

**7. Respond to Webhook**
- Response Body: `={{ $json }}`

**Activate. Copy URL → `NEXT_PUBLIC_N8N_GET_ENROLLMENT_URL`.**

### Workflow 3 — Parent Confirmation

**Purpose:** Parent picked tutor + slot → create Google Meet → notify everyone → close loop.

#### Nodes:

**1. Webhook**
- HTTP Method: `POST`
- Path: `parent-confirm`
- Response Mode: "Using 'Respond to Webhook' node"

**2. Airtable — Search (Enrollments by token)**
- Filter formula: `={magic_token = '" + $json.body.magic_token + "'"}`

**3. Airtable — Get (Tutor by ID)**
- Record ID: `={{ $json.body.selected_tutor_id }}`

**4. Airtable — Get (Slot by ID)**
- Record ID: `={{ $json.body.selected_slot_id }}`

**5. Google Calendar — Create Event**
- Calendar: primary
- Start: `={{ $('Airtable2').item.json.fields.slot_datetime }}`
- End: 60 minutes after start (use expression: `={{ DateTime.fromISO($('Airtable2').item.json.fields.slot_datetime).plus({ hours: 1 }).toISO() }}`).
- Summary: `Super Sheldon: {{ $('Airtable').item.json.fields.course }} class`
- Description: `Tutor: {{ $('Airtable1').item.json.fields.name }} | Student: {{ $('Airtable').item.json.fields.student_name }}`
- Attendees: parent email, tutor email
- **Use Conferencing**: Toggle ON → "Hangouts Meet". This auto-generates the Meet link.
- Send Updates: All

**6. Airtable — Update Enrollment**
- Set `selected_tutor` = the tutor record link, `selected_slot` = slot datetime, `meet_link` = `={{ $('Google Calendar').item.json.hangoutLink }}`, `parent_confirmed` = true, `meet_created` = true, `status` = `Booked`.

**7. Airtable — Update Slot**
- Set `is_booked` = true.

**8. Airtable — Create Booking record**
- Link to enrollment, tutor, slot. Save the Meet link.

**9. (Parallel A) Twilio — Send Confirmation WhatsApp**
- Message:
```
🎉 You're all set, {{ parent_name }}!

{{ student_name }}'s {{ course }} class is booked.

🗓 {{ formatted slot datetime }}
👩‍🏫 Tutor: {{ tutor_name }}
🔗 Google Meet: {{ meet_link }}

We'll send a reminder before class. Reply here if you need to reschedule.
```

**10. (Parallel B) Gmail — Send Confirmation Email**
- Same content in HTML.

**11. Respond to Webhook**
- Response Body:
```json
{
  "success": true,
  "meet_link": "={{ $('Google Calendar').item.json.hangoutLink }}",
  "slot_datetime": "={{ $('Airtable2').item.json.fields.slot_datetime }}",
  "tutor_name": "={{ $('Airtable1').item.json.fields.name }}"
}
```

**Activate. Copy URL → `NEXT_PUBLIC_N8N_CONFIRM_URL`.**

---

## 7. PHASE 4 — WIRE IT ALL TOGETHER

### Step 4.1 — Add the three webhook URLs to Vercel

1. In Vercel dashboard → your project → Settings → Environment Variables.
2. Add these three:
   - `NEXT_PUBLIC_N8N_NEW_ENROLLMENT_URL` = (from Workflow 1 production URL)
   - `NEXT_PUBLIC_N8N_GET_ENROLLMENT_URL` = (from Workflow 2 production URL)
   - `NEXT_PUBLIC_N8N_CONFIRM_URL` = (from Workflow 3 production URL)
3. Redeploy (Vercel does this automatically when you save env vars, or click "Redeploy" manually).

### Step 4.2 — Build the Airtable Interface dashboard

1. Go to your Airtable base → top right → **Interfaces** → Create new interface.
2. Choose template: **"Record review"**.
3. Source table: `Enrollments`.
4. Add views:
   - **Pipeline kanban**: group by `status` (Pending / Notified / Confirmed / Booked).
   - **Today's bookings**: filter `slot_datetime` is within next 7 days.
   - **Stuck enrollments**: filter where `email_sent = false` AND `created_at` > 1 hour ago.
5. Color the status badges: Pending = grey, Notified = orange, Confirmed = blue, Booked = green.
6. Share the interface with the ops team.

### Step 4.3 — End-to-end test

1. From a fresh phone (one that already sent `join sunny-river` to the Twilio sandbox number), open the Vercel URL → `/sales-form`.
2. Fill the form with that phone's number as parent's WhatsApp, and a real email address.
3. Submit.
4. Verify within 30 seconds: WhatsApp message arrives, email arrives.
5. Click the magic link in either.
6. Pick a tutor, pick a slot, accept agreement, click "Lock it in".
7. Verify: Google Calendar event appears, Meet link works, parent gets confirmation WhatsApp + email.
8. Verify: Airtable Interface dashboard shows the enrollment moving through statuses.

If any step fails: check the **n8n executions tab** — it shows the exact node that errored.

---

## 8. PHASE 5 — DEMO-DAY CHECKLIST

The morning of the demo:

- [ ] Re-test end-to-end with a fresh enrollment.
- [ ] Have **two** demo phones ready (one as "parent", one as "agent").
- [ ] Both demo phones must have already sent `join sunny-river` to the Twilio sandbox number — Twilio drops messages to numbers that haven't opted in.
- [ ] Charge laptop. Open: Vercel URL, Airtable Interface dashboard, n8n executions tab — three tabs, ready to switch.
- [ ] **Backup plan:** record a 2-min screen recording of the working flow now, in case live demo's network fails.
- [ ] If you used n8n on Railway and it's been more than 14 days: confirm Railway hasn't burned through the $5 credit.
- [ ] If using Twilio sandbox: the join code expires after 72 hours of inactivity — re-join the sandbox an hour before demo.

### Demo script (90 seconds)

1. (15s) "Sales agent finishes a sale. Today, this triggers 15 minutes of manual work. Let me show you what we built." Open `/sales-form`.
2. (20s) Fill the form live. Submit. Show the success card.
3. (15s) Switch to demo "parent" phone — show WhatsApp + email arriving.
4. (15s) Click the magic link on the parent's phone. Pick tutor + slot. Submit.
5. (15s) Show Google Calendar event with Meet link auto-created.
6. (10s) Switch back to laptop — show Airtable Interface dashboard with the new row, all green checkmarks.
7. "What used to take 15 minutes now takes 2."

---

## 9. APPENDIX A — AIRTABLE SCHEMA (BUILD THIS EXACTLY)

### Table: `Enrollments`

| Field name | Type | Notes |
|---|---|---|
| `record_id` | (auto) | Airtable's hidden internal ID |
| `magic_token` | Single line text | Generated by n8n; primary lookup key |
| `student_name` | Single line text | |
| `parent_name` | Single line text | |
| `parent_whatsapp` | Phone number | E.164 format e.g. +919876543210 |
| `parent_email` | Email | |
| `course` | Single select | Maths, English, Science, Coding, Public Speaking, Reasoning, Chess |
| `classes_count` | Number (integer) | |
| `amount` | Currency | precision: 2 |
| `currency` | Single select | INR, GBP, USD, AUD, NZD |
| `payment_screenshot` | Attachment | |
| `sales_agent` | Single line text | |
| `lead_source` | Single select | Instagram, Facebook, Google Ads, Referral, Website, Other |
| `sale_type` | Single select | New sale, Cross sale |
| `demo_tutor` | Single line text | |
| `preferred_timing` | Long text | |
| `status` | Single select | Pending (grey), Notified (orange), Confirmed (blue), Booked (green), Completed (purple) |
| `whatsapp_sent` | Checkbox | |
| `whatsapp_delivered` | Checkbox | (optional, set by Twilio webhook later) |
| `email_sent` | Checkbox | |
| `email_opened` | Checkbox | (optional) |
| `parent_confirmed` | Checkbox | |
| `meet_created` | Checkbox | |
| `selected_tutor` | Link to another record | → `Tutors` table |
| `selected_slot_datetime` | Date (with time) | |
| `meet_link` | URL | |
| `created_at` | Created time | |

**Set the primary field of the table to `magic_token`** so n8n's lookup-by-token works cleanly.

### Table: `Tutors`

| Field name | Type | Notes |
|---|---|---|
| `name` | Single line text | (primary field) |
| `email` | Email | |
| `phone` | Phone number | |
| `subjects` | Multi-select | Maths, English, Science, Coding, etc |
| `bio` | Long text | optional |
| `available_slots` | Link | → `AvailableSlots` (auto-created reverse link) |

### Table: `AvailableSlots`

| Field name | Type | Notes |
|---|---|---|
| `slot_id` | Autonumber | (primary field) |
| `tutor` | Link to another record | → `Tutors` |
| `slot_datetime` | Date (with time, GMT) | |
| `is_booked` | Checkbox | |

### Table: `Communications`

| Field name | Type | Notes |
|---|---|---|
| `comm_id` | Autonumber | (primary field) |
| `enrollment` | Link to another record | → `Enrollments` |
| `channel` | Single select | WhatsApp, Email |
| `event_type` | Single select | sent, delivered, read, clicked, failed |
| `message_preview` | Long text | |
| `timestamp` | Date with time | |

### Table: `Bookings`

| Field name | Type | Notes |
|---|---|---|
| `booking_id` | Autonumber | (primary field) |
| `enrollment` | Link | → `Enrollments` |
| `tutor` | Link | → `Tutors` |
| `slot_datetime` | Date with time | |
| `meet_link` | URL | |
| `status` | Single select | Scheduled, Completed, Rescheduled, No-show |
| `created_at` | Created time | |

---

## 10. APPENDIX B — WEBHOOK CONTRACTS (the source of truth between frontend and n8n)

### `POST /webhook/new-enrollment` — called by `/sales-form` on submit

**Request body (multipart/form-data):**
```
student_name: string
parent_name: string
parent_whatsapp: string  // E.164
parent_email: string
course: string
classes_count: number
amount: number
currency: string  // ISO 4217 code
sales_agent: string
lead_source: string
sale_type: "New sale" | "Cross sale"
demo_tutor: string
preferred_timing: string  // optional
payment_screenshot: File  // image or pdf
```

**Response (200):**
```json
{
  "success": true,
  "magic_token": "abc12345xy",
  "enrollment_id": "rec5xX9Y0aBcDeFgH"
}
```

### `GET /webhook/get-enrollment?token={magic_token}` — called by `/confirm/[token]` on load

**Response (200):**
```json
{
  "student_name": "Aarav Sharma",
  "parent_name": "Rohit Sharma",
  "course": "Maths",
  "classes_count": 12,
  "amount": 5400,
  "currency": "INR",
  "demo_tutor": "Sannya Gupta",
  "available_tutors": [
    {
      "id": "rec_tutor1",
      "name": "Priya Iyer",
      "subjects": ["Maths", "Science"],
      "available_slots": [
        { "id": "rec_slot1", "datetime": "2026-05-15T14:00:00.000Z" },
        { "id": "rec_slot2", "datetime": "2026-05-16T16:00:00.000Z" }
      ]
    }
  ]
}
```

**Response (404):**
```json
{ "error": "not_found" }
```

### `POST /webhook/parent-confirm` — called by `/confirm/[token]` on submit

**Request body (JSON):**
```json
{
  "magic_token": "abc12345xy",
  "selected_tutor_id": "rec_tutor1",
  "selected_slot_id": "rec_slot1",
  "agreement_accepted": true
}
```

**Response (200):**
```json
{
  "success": true,
  "meet_link": "https://meet.google.com/aaa-bbbb-ccc",
  "slot_datetime": "2026-05-15T14:00:00.000Z",
  "tutor_name": "Priya Iyer"
}
```

---

## 11. APPENDIX C — DESIGN.md (drop this into the repo root unchanged)

```markdown
# Super Sheldon — Design Core

One file. Drop it in any repo. Any framework, any AI tool. Don't deviate.

## 0. AI Prompt (paste at start of every session)

Build for **Super Sheldon**. Use only the tokens, components, and rules in this file. Primary = orange #FF6B1F. Fonts = Plus Jakarta Sans (display) + Inter (UI). Cards = rounded-xl + soft shadow. Buttons = rounded-full. Icons = Lucide only. White/off-white bg, never dark mode unless asked. Copy-paste components from §4 — don't invent new ones.

## 1. Hackathon Workflow

| Step | Tool | Purpose |
|---|---|---|
| 1 | Claude | Design → wireframe, screen layouts, copy |
| 2 | GitHub Copilot / Cursor / Bolt | Build → frontend + integration |
| 3 | n8n | Backend logic → workflows, automations |
| 4 | Hugging Face | LLM, audio, vision via Inference API |
| 5 | Render / Railway | Deploy frontend + n8n |

## 2. Brand
- Name: Super Sheldon · Site: supersheldon.com · Logo: orange "S" + wordmark, never recolor.
- Voice: warm tutor-friend. Short sentences. No jargon. Encourage, don't scold.
- Audience: student (playful) · parent (clear) · teacher (factual) · internal (dense, fast).

## 3. Tokens

```json
{
  "color": {
    "orange": { "50":"#FFF1E6","100":"#FFE0C7","200":"#FFC089","300":"#FFA14B","400":"#FF8526","500":"#FF6B1F","600":"#E85A12","700":"#C24808","800":"#8F3505","900":"#5C2203" },
    "ink":    { "100":"#F2F4F7","200":"#E5E8EE","300":"#C4C9D2","400":"#8A91A1","500":"#5B6271","700":"#2A2E36","900":"#0F1115" },
    "bg":     { "0":"#FFFFFF","50":"#FFF8F2" },
    "status": { "success":"#16A34A","warning":"#F59E0B","error":"#DC2626","info":"#2563EB" }
  },
  "font": {
    "display": "\"Plus Jakarta Sans\", Inter, system-ui, sans-serif",
    "body":    "Inter, system-ui, sans-serif"
  },
  "radius": { "sm":"6px","md":"10px","lg":"12px","xl":"16px","2xl":"24px","full":"9999px" }
}
```

## 4. Type Scale

| Token | Size | Weight | Use |
|---|---|---|---|
| display | 2.5–3.5rem | 800 | hero |
| h1 | 2–2.5rem | 700 | page title |
| h2 | 1.5–1.875rem | 700 | section |
| h3 | 1.25rem | 600 | card title |
| body | 1rem | 400 | default |
| small | 0.875rem | 400 | helper |
| caption | 0.75rem | 500 | labels |

Line-height: 1.25 headings, 1.55 body.

## 5. Components (copy-paste, don't invent)

```tsx
// Primary
<button className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-ss-orange-500 text-white font-semibold hover:bg-ss-orange-600 hover:shadow-ss-brand active:bg-ss-orange-700 disabled:opacity-50 transition">Action</button>

// Secondary
<button className="px-5 py-3 rounded-full border-2 border-ss-orange-500 text-ss-orange-600 font-semibold hover:bg-ss-orange-50 transition">Action</button>

// Input
<input className="w-full px-4 py-3 rounded-[10px] border border-ss-ink-300 bg-white text-ss-ink-900 placeholder-ss-ink-400 focus:border-ss-orange-500 focus:ring-2 focus:ring-ss-orange-200 outline-none transition" />

// Card
<div className="bg-white rounded-2xl shadow-ss p-6 border border-ss-ink-200">…</div>

// Badge
<span className="px-3 py-1 rounded-full bg-ss-orange-50 text-ss-orange-700 text-xs font-semibold">New</span>
```

## 6. Layout
- App shell: sticky top bar (h=64, white) · sidebar 240px · content bg-ss-bg-50.
- Container: max-w-6xl mx-auto px-4 md:px-8.
- Mobile: min 360px, tap target ≥ 44px.

## 7. Voice Cheatsheet
| Context | Say | Don't |
|---|---|---|
| Empty | "Nothing here yet — add one." | "No data found." |
| Loading | "Getting things ready…" | "Loading…" |
| Error | "Something broke — try again." | "Error 500" |
| Success | "Sent!" / "Saved!" | "Operation successful" |
| Confirm delete | "This can't be undone. Delete?" | "Are you sure?" |

## 8. Accessibility
- Contrast ≥ 4.5:1 (use ink-700 on white, not ink-500).
- Every input has a label. Errors in text, not color alone.
- Keyboard reachable. Focus ring: ring-2 ring-ss-orange-200.
- Alt on every image. aria-label on icon-only buttons.

v1.2 · Super Sheldon · Sheldon Labs
```

---

## END

That's the full guide. Print it, bookmark it, paste sections into Slack — whatever helps.

**Remember the order:**
1. Phase 1 manual setup (~90 min) → 2. AI prompt (~30 min wait + review) → 3. n8n workflows (~2 hrs) → 4. Wire env vars (~10 min) → 5. Demo-day prep.

If anything in Phases 3–5 fails, the n8n **Executions** tab is your debugger — it shows the exact node and field that errored.

Good luck. Build it. Ship it. Demo it.
