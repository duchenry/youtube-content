# YouTube Script Analyzer

Next.js app that reverse-engineers viral YouTube scripts using GPT-4o-mini.
All analyses are **automatically saved to Supabase** and accessible via a sidebar.

---

## 🔐 Security model

| Secret | Where it lives | Exposed to browser? |
|---|---|---|
| `OPENAI_API_KEY` | `.env.local` (server-only) | ❌ Never |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | ✅ Safe (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | ✅ Safe (RLS protects data) |

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Create Supabase table

1. Go to supabase.com → New project
2. Open SQL Editor → paste and run `supabase-schema.sql`
3. Copy Project URL + anon key from Settings → API

### 3. Environment

```bash
cp .env.example .env.local
# Fill in OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 4. Run

```bash
npm run dev
```

### 5. Deploy (Vercel)

Add all 3 env vars in Vercel dashboard → Settings → Environment Variables.

---

## Features

- Auto-saves every analysis to Supabase
- Sidebar with full history — click to reload any past result
- Delete individual entries
- Save indicator (Saving... → Saved) in header
- 16 strategic sections, collapsible cards
- OpenAI key server-side only

## Stack

Next.js 14 · TypeScript · Tailwind · OpenAI SDK · Supabase · GPT-4o-mini
