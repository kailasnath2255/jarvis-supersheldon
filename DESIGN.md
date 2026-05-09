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
