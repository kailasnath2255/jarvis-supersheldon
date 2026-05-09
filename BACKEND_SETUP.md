# Backend Setup — Airtable + n8n + Twilio + Gmail + Google Calendar + Vercel

The frontend is already built and runs in **mock mode** today. This doc walks you through wiring the real backend so submissions actually save records, send WhatsApp/email, and create Google Meet events.

**Time required:** ~90 min the first time. ~10 min if you've done it before.

> Files referenced from this doc:
> - [n8n/workflow-1-new-enrollment.json](n8n/workflow-1-new-enrollment.json)
> - [n8n/workflow-2-get-enrollment.json](n8n/workflow-2-get-enrollment.json)
> - [n8n/workflow-3-parent-confirm.json](n8n/workflow-3-parent-confirm.json)
> - [airtable/tutors-seed.csv](airtable/tutors-seed.csv)
> - [airtable/slots-seed.csv](airtable/slots-seed.csv)

---

## Quick map of what connects to what

```
                                    Browser (sales agent)
                                            │  POST multipart/form-data
                                            ▼
                            ┌────────────────────────────────┐
                            │  Vercel — Next.js frontend     │
                            │  /sales-form                   │
                            │  /confirm/[token]              │
                            └────────────────┬───────────────┘
                                             │
                                             │ NEXT_PUBLIC_N8N_*_URL
                                             ▼
       ┌─────────────────────────────────────────────────────────────┐
       │ n8n (Railway / n8n Cloud / self-hosted)                     │
       │                                                             │
       │  Workflow 1: POST /webhook/new-enrollment                   │
       │  Workflow 2: GET  /webhook/get-enrollment?token=…           │
       │  Workflow 3: POST /webhook/parent-confirm                   │
       └──┬─────────────┬───────────────┬────────────────┬───────────┘
          │             │               │                │
          ▼             ▼               ▼                ▼
       Airtable      Twilio          Gmail        Google Calendar
       (PAT)         (sandbox)       (OAuth2)      (OAuth2 + Meet)
```

---

## STEP 0 — What you need before you start

Open a notes file and keep these collected as you go. You'll paste them in later.

```
AIRTABLE_PAT=
AIRTABLE_BASE_ID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_SANDBOX_JOIN_CODE=join your-code-here
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
N8N_BASE_URL=
GMAIL_FROM=
VERCEL_APP_URL=https://your-app.vercel.app
```

---

## STEP 1 — Airtable (15 min)

### 1.1 Create the base

1. Sign up at https://airtable.com (free).
2. **Add base → Start from scratch**. Name it **`Sheldon Sales Pipeline`**.
3. The base will start with one table called `Table 1`. **Rename it to `Enrollments`** (right-click tab → Rename).
4. Add 4 more tables (the `+` next to the tab row): `Tutors`, `AvailableSlots`, `Communications`, `Bookings`.

### 1.2 Build the schema

For each table, **delete the default fields you don't need** (`Name`, `Notes`, `Attachments`) and add the fields below in order. Field names must match exactly — n8n looks them up by name.

> Tip: Airtable's "+" → field type dropdown is your friend. For every Single Select, click **Customize field options** and add the listed choices.

#### Table `Enrollments`

| Field | Type | Notes / options |
|---|---|---|
| `magic_token` | Single line text | **Set this as the primary field** (drag it leftmost) |
| `student_name` | Single line text | |
| `parent_name` | Single line text | |
| `parent_whatsapp` | Phone number | |
| `parent_email` | Email | |
| `course` | Single select | Maths, English, Science, Coding, Public Speaking, Reasoning, Chess |
| `classes_count` | Number | Integer, no decimals |
| `amount` | Currency | INR symbol, 2 decimals |
| `currency` | Single select | INR, GBP, USD, AUD, NZD |
| `payment_screenshot` | Attachment | |
| `sales_agent` | Single line text | |
| `lead_source` | Single select | Instagram, Facebook, Google Ads, Referral, Website, Other |
| `sale_type` | Single select | New sale, Cross sale |
| `demo_tutor` | Single line text | |
| `preferred_timing` | Long text | |
| `status` | Single select | Pending (grey), Notified (orange), Confirmed (blue), Booked (green), Completed (purple) |
| `whatsapp_sent` | Checkbox | |
| `email_sent` | Checkbox | |
| `parent_confirmed` | Checkbox | |
| `meet_created` | Checkbox | |
| `selected_tutor` | Link to another record → `Tutors` | |
| `selected_slot_datetime` | Date | Include time, GMT |
| `meet_link` | URL | |
| `created_at` | Created time | |

#### Table `Tutors`

| Field | Type | Notes |
|---|---|---|
| `name` | Single line text | **Primary field** |
| `email` | Email | |
| `phone` | Phone number | |
| `subjects` | Multiple select | Maths, English, Science, Coding, Public Speaking, Reasoning, Chess |
| `bio` | Long text | |

#### Table `AvailableSlots`

| Field | Type | Notes |
|---|---|---|
| `slot_id` | Autonumber | **Primary field** |
| `tutor` | Link to another record → `Tutors` | |
| `slot_datetime` | Date | Include time, **GMT** |
| `is_booked` | Checkbox | |

#### Table `Communications`

| Field | Type | Notes |
|---|---|---|
| `comm_id` | Autonumber | Primary |
| `enrollment` | Link → `Enrollments` | |
| `channel` | Single select | WhatsApp, Email |
| `event_type` | Single select | sent, delivered, read, clicked, failed |
| `message_preview` | Long text | |
| `timestamp` | Date | with time |

#### Table `Bookings`

| Field | Type | Notes |
|---|---|---|
| `booking_id` | Autonumber | Primary |
| `enrollment` | Link → `Enrollments` | |
| `tutor` | Link → `Tutors` | |
| `slot_datetime` | Date | with time |
| `meet_link` | URL | |
| `status` | Single select | Scheduled, Completed, Rescheduled, No-show |
| `created_at` | Created time | |

### 1.3 Seed demo data

Use the CSVs in this repo:

- [airtable/tutors-seed.csv](airtable/tutors-seed.csv) — 3 tutors
- [airtable/slots-seed.csv](airtable/slots-seed.csv) — 15 future slots (5 per tutor)

**Import the tutors first:**
1. Open `Tutors` table → top-right `⋯` → **Import data → CSV file**.
2. Pick `tutors-seed.csv`. Map columns to fields. **Skip** the header row option ON.
3. Confirm import. You should see 3 rows.

**Then import slots:**
1. Open `AvailableSlots` → import `slots-seed.csv`.
2. The CSV uses a `tutor_name` column (a name string). After import, you'll need to **link** each slot to a tutor:
   - Click the `tutor` field cell on each row → start typing the tutor name → pick from dropdown.
   - Or skip this if the linking-from-name worked automatically (Airtable sometimes auto-resolves links from text).
3. Confirm `is_booked` is unchecked on all rows.

### 1.4 Get your Personal Access Token (PAT) and Base ID

**PAT:**
1. Click avatar (top right) → **Builder hub** → **Personal access tokens**.
2. **Create new token**. Name: `Sheldon n8n`.
3. Scopes: tick `data.records:read`, `data.records:write`, `schema.bases:read`.
4. Access: **Add a base** → pick `Sheldon Sales Pipeline`.
5. Click **Create token**. **Copy it immediately**. Save as `AIRTABLE_PAT`.

**Base ID:**
1. Visit https://airtable.com/api → click your base.
2. The intro page shows the Base ID — starts with `app...`. Save as `AIRTABLE_BASE_ID`.

---

## STEP 2 — Twilio WhatsApp Sandbox (10 min)

1. Sign up at https://www.twilio.com (free).
2. Verify your phone (Twilio sends an SMS code).
3. Console → **Develop → Messaging → Try it out → Send a WhatsApp message**.
4. You'll see a **sandbox WhatsApp number** (usually `+14155238886`) and a **join code** like `join sunny-river`.
5. Save:
   - `TWILIO_ACCOUNT_SID` (top of dashboard, starts with `AC…`)
   - `TWILIO_AUTH_TOKEN` (click to reveal)
   - `TWILIO_WHATSAPP_FROM` = `whatsapp:+14155238886` (note the `whatsapp:` prefix)
   - `TWILIO_SANDBOX_JOIN_CODE` = e.g. `join sunny-river`
6. **Opt the demo phone in** — from the parent's WhatsApp, send `join sunny-river` to `+14155238886`. Until you do this, that phone number won't receive any sandbox messages. Each test phone needs to do this once.

> **Demo-day reminder:** sandbox opt-ins expire after 72 hours of silence. Re-send the join code an hour before the demo from any phone you'll use.

---

## STEP 3 — Google Cloud (Calendar + Meet + Gmail OAuth) (15 min)

1. Go to https://console.cloud.google.com (use the same Google account that'll send the emails and own the calendar).
2. **Create project** → name `Sheldon Calendar`.
3. **APIs & Services → Library**:
   - Search **Google Calendar API** → Enable.
   - Search **Gmail API** → Enable.
4. **APIs & Services → OAuth consent screen**:
   - User type: **External**.
   - App name: `Sheldon Sales Bot`. Support email: your Gmail.
   - Scopes — click **Add or remove scopes**, add:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
     - `https://www.googleapis.com/auth/gmail.send`
   - Test users — **Add yourself** (whatever Gmail you'll send from).
   - Save.
5. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Type: **Web application**.
   - Name: `Sheldon n8n`.
   - **Leave Authorized redirect URIs blank for now** — you'll add the n8n callback URL after Step 4.
   - Save.
   - **Copy** Client ID and Client Secret. Save as `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET`.

---

## STEP 4 — Deploy n8n (15 min)

Pick **one** option:

### Option A — Railway (recommended, ~3 weeks free)

1. https://railway.app → sign in with GitHub.
2. Add a payment method (mandatory to use the $5/month free credit; nothing's charged unless you exceed it).
3. **New project → Deploy from Template** → search `n8n` → pick **n8n with Postgres** → Deploy.
4. Wait ~3 min for the build.
5. Click the n8n service → **Settings → Networking → Generate Domain**. You'll get a URL like `sheldon-n8n-production.up.railway.app`.
6. Open that URL → create the n8n admin account (email + password).
7. Save the URL as `N8N_BASE_URL`.

### Option B — n8n Cloud (no card, 14-day trial)

1. https://n8n.io → start free trial.
2. You'll land in a hosted n8n instance. Save the workspace URL as `N8N_BASE_URL`.

### Option C — Local for testing only

```bash
docker run -it --rm \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

Open http://localhost:5678. **Webhooks won't be reachable from Vercel** unless you tunnel via ngrok — only use this for local end-to-end testing, not for the deployed site.

---

## STEP 5 — Add credentials inside n8n (15 min)

In n8n: **Settings (bottom-left gear) → Credentials → New**. Add four:

### 5.1 Airtable Personal Access Token

1. Search "Airtable" → pick **Airtable Personal Access Token API**.
2. Paste `AIRTABLE_PAT`. Save as `Airtable account`.

### 5.2 Twilio API

1. Search "Twilio" → pick **Twilio API**.
2. Account SID + Auth Token from Step 2. Save.

### 5.3 Gmail OAuth2

1. Search "Gmail" → pick **Gmail OAuth2 API**.
2. Paste `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.
3. **Copy the OAuth Redirect URL** that n8n displays (looks like `https://YOUR-N8N-URL/rest/oauth2-credential/callback`).
4. Open Google Cloud Console → APIs & Services → Credentials → click your OAuth client → **Authorized redirect URIs → Add URI** → paste that URL → Save.
5. Back in n8n credential modal: click **Sign in with Google** → pick the Gmail account → "Continue" past the unverified app warning ("Advanced" → "Go to Sheldon Sales Bot (unsafe)") → Allow.
6. The credential should turn green. Save.

### 5.4 Google Calendar OAuth2

1. Search "Google Calendar" → pick **Google Calendar OAuth2 API**.
2. **Reuse the same Client ID/Secret** as Gmail — the redirect URL is identical and the OAuth client already has both Calendar and Gmail scopes.
3. Click Sign in → Allow → Save.

---

## STEP 6 — Import the three workflows (10 min)

For each of the three JSON files in `n8n/`:

1. n8n top bar → **Workflows → ⋯ menu → Import from file**.
2. Pick `n8n/workflow-1-new-enrollment.json` (then 2, then 3).
3. After import, you'll see red error badges on each Airtable, Twilio, Gmail, and Calendar node — that's expected. They need credentials and a base/table picked.

### 6.1 Wire each Airtable node

For every Airtable node in all three workflows:

1. Open the node.
2. **Credential to connect with** → pick `Airtable account` (the one you saved in 5.1).
3. **Base** → click the dropdown → pick **Sheldon Sales Pipeline**. (The placeholder text `REPLACE_WITH_AIRTABLE_BASE_ID` in the JSON gets replaced as soon as you pick from the dropdown.)
4. **Table** → pick the table the node is meant to operate on (`Enrollments`, `Tutors`, etc — the node name tells you).
5. Save the workflow (Ctrl/Cmd-S).

### 6.2 Wire each Twilio node

1. Open the Twilio node.
2. **Credential** → `Twilio account`.
3. Verify **From** = `whatsapp:+14155238886` (or whatever your sandbox number is).

### 6.3 Wire each Gmail node

1. Open the node.
2. **Credential** → `Gmail account`.

### 6.4 Wire the Google Calendar node (Workflow 3 only)

1. **Credential** → `Google Calendar account`.
2. **Calendar** → pick `primary` (your main calendar).

### 6.5 Replace the Vercel URL placeholder

In **Workflow 1** open the **Twilio: Send WhatsApp** and **Gmail: Send welcome** nodes — the message body contains `https://REPLACE_WITH_VERCEL_URL/confirm/...`. Replace `REPLACE_WITH_VERCEL_URL` with your Vercel domain (or `localhost:3000` for local testing). Save.

> If you don't know the Vercel URL yet, leave it as `localhost:3000` for now. You'll come back after Step 7.

### 6.6 Activate the workflows

For each of the three workflows: top-right toggle → **Active**.

### 6.7 Copy the production webhook URLs

For each workflow, click the **Webhook** node and you'll see two URLs: **Test URL** and **Production URL**. Copy the **Production URLs**:

```
NEXT_PUBLIC_N8N_NEW_ENROLLMENT_URL = https://YOUR-N8N-URL/webhook/new-enrollment
NEXT_PUBLIC_N8N_GET_ENROLLMENT_URL  = https://YOUR-N8N-URL/webhook/get-enrollment
NEXT_PUBLIC_N8N_CONFIRM_URL         = https://YOUR-N8N-URL/webhook/parent-confirm
```

These are exactly the env vars the frontend reads.

---

## STEP 7 — Connect the frontend (5 min)

### 7.1 Local dev

```bash
cp .env.example .env.local
```

Edit `.env.local` and paste the three URLs from Step 6.7. Restart `npm run dev`. The yellow "Mock mode" banner should disappear.

### 7.2 Vercel deploy

1. Push this repo to GitHub (`git init && git add . && git commit -m "init" && git push`).
2. https://vercel.com → **Add New → Project** → import the repo. Framework auto-detects as Next.js.
3. **Project Settings → Environment Variables** — add the same three:
   - `NEXT_PUBLIC_N8N_NEW_ENROLLMENT_URL`
   - `NEXT_PUBLIC_N8N_GET_ENROLLMENT_URL`
   - `NEXT_PUBLIC_N8N_CONFIRM_URL`
   Set them for **Production** and **Preview**.
4. Deploy. Copy the production URL (e.g. `https://sheldon.vercel.app`).
5. **Go back to n8n Workflow 1** and update the `REPLACE_WITH_VERCEL_URL` in the Twilio + Gmail message bodies to the real URL. Save & re-activate.

---

## STEP 8 — End-to-end test (5 min)

> Pre-flight: the demo phone you'll use as "parent" must have already sent the Twilio join code (`join sunny-river` or whatever yours is) to the sandbox number.

1. Open `https://YOUR-VERCEL-URL/sales-form`.
2. Fill the form with:
   - Parent's WhatsApp = the opted-in demo phone, in `+91…` format.
   - Parent's email = a real inbox you can check.
3. Submit. The success card should show a magic token like `b7f2e1a8c9d0e3f4`.
4. Within ~30 seconds:
   - WhatsApp arrives on the demo phone.
   - Email arrives in the inbox.
5. Tap the magic link in either message. The parent confirmation page loads with real tutors/slots from Airtable.
6. Pick a tutor → pick a slot → tick the checkbox → **Lock it in**.
7. Verify:
   - Confetti card appears with a real `meet.google.com/...` link.
   - Confirmation WhatsApp + email arrive.
   - Google Calendar shows a new event with a Meet link, and the parent + tutor are invited.
   - Airtable: the `Enrollments` row shows `status = Booked`, `meet_link` filled, `parent_confirmed` and `meet_created` checked. The slot in `AvailableSlots` is `is_booked = true`. A new `Bookings` row exists.

### If something fails

- Open n8n → **Executions** (left sidebar). Click the failing run → it shows you the exact node and the input/output JSON. Most issues are: a typo in an Airtable field name, a missing credential pick, or the parent phone not opted into the Twilio sandbox.
- Look for the **red badge** — it tells you which node errored.
- Common gotchas:
  - **Airtable error "Could not find field XYZ"** → field name in your Airtable doesn't exactly match the node's column key. Open the Airtable node, click into Columns, retype the name.
  - **Twilio 21408** → "Permission to send an SMS has not been enabled for the region indicated." Means the parent phone didn't send the `join` code yet, or the join expired.
  - **Calendar 401** → re-authorize the Google Calendar credential in n8n (token expired).
  - **CORS errors in browser console** → the `Access-Control-Allow-Origin: *` header is set in the Respond nodes already, but if you used the **Test URL** instead of **Production URL** in your Vercel env vars, the webhook won't fire. Always use the production URL for deployed environments.

---

## STEP 9 — Build the Airtable Interface dashboard (10 min, optional but impressive)

1. Airtable base → top-right **Interfaces** → **Create interface**.
2. Template: **Record review** (or **Dashboard** if you want charts).
3. Source table: `Enrollments`.
4. Add views:
   - **Pipeline kanban** — group by `status` (Pending/Notified/Confirmed/Booked).
   - **Today's bookings** — filter `selected_slot_datetime` is within next 7 days.
   - **Stuck enrollments** — filter `email_sent = false` AND `created_at` > 1 hour ago.
5. Pick colors for the status badges. Click **Publish**.
6. Share the URL with the ops team — they don't need an editor seat to view.

---

## STEP 10 — Demo-day checklist

- [ ] Re-test end-to-end the morning of the demo.
- [ ] Both demo phones have re-sent the Twilio sandbox join code (it expires after 72 h of silence).
- [ ] Vercel URL, Airtable Interface, n8n Executions tab — three browser tabs ready.
- [ ] Recorded a 90-sec backup screen capture of the working flow in case the live demo's network fails.
- [ ] Railway $5 credit hasn't been burned through (check the Railway dashboard).

---

## Appendix — Webhook contracts (what the frontend sends)

### `POST /webhook/new-enrollment` — multipart form
```
student_name, parent_name, parent_whatsapp, parent_email,
course, classes_count, amount, currency,
sales_agent, lead_source, sale_type, demo_tutor, preferred_timing,
payment_screenshot (file)
```
Returns: `{ success, magic_token, enrollment_id }`

### `GET /webhook/get-enrollment?token=…`
Returns: `{ student_name, parent_name, course, classes_count, amount, currency, demo_tutor, available_tutors: [{ id, name, subjects, available_slots: [{ id, datetime }] }] }`
Returns 404 with `{ error: "not_found" }` if token doesn't exist.

### `POST /webhook/parent-confirm` — JSON body
```json
{
  "magic_token": "abc12345xy",
  "selected_tutor_id": "rec…",
  "selected_slot_id": "rec…",
  "agreement_accepted": true
}
```
Returns: `{ success, meet_link, slot_datetime, tutor_name }`

If you ever change a contract, update both `lib/types.ts` (frontend) and the Respond nodes / Code nodes in n8n at the same time.
