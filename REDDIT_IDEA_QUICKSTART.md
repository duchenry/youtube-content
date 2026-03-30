# Reddit Idea Feature — Quick Start

## What It Does

Accepts a Reddit URL → Extracts viral content DNA → Returns structured JSON with psychological hooks and content angles.

## 3-Step Setup

### 1. Update Database
Run in Supabase SQL Editor:
```sql
create table if not exists reddit_ideas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  url text not null unique,
  reddit_data jsonb,
  analysis jsonb not null,
  status text default 'analyzed'
);

create index if not exists reddit_ideas_url_idx on reddit_ideas (url);
create index if not exists reddit_ideas_created_at_idx on reddit_ideas (created_at desc);

alter table reddit_ideas enable row level security;

create policy "Allow anon select" on reddit_ideas for select using (true);
create policy "Allow anon insert" on reddit_ideas for insert with check (true);
create policy "Allow anon delete" on reddit_ideas for delete using (true);
```

### 2. Verify Env Vars
```env
# .env.local
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. Test the API
```bash
curl -X POST http://localhost:3000/api/reddit-idea \
  -H "Content-Type: application/json" \
  -d '{"reddit_url": "https://reddit.com/r/personalfinance/comments/18ekp1h/why_i_stopped_trying_to_get_rich/"}'
```

Expected response:
```json
{
  "success": true,
  "analysis": {
    "coreInsight": { ... },
    "coreAngle": { ... },
    "expandAngles": [ ... ], // 10 items
    "keywordAnalysis": { ... },
    "audienceProfile": { ... },
    "painMap": [ ... ] // 5 items
  }
}
```

## Files Created

| File | Purpose |
|------|---------|
| `app/lib/redditScraper.ts` | Fetch Reddit post + top 10 comments |
| `app/lib/redditAnalyzer.ts` | Send to gpt-5-mini with psychology prompt |
| `app/api/reddit-idea/route.ts` | Main API (GET & POST) |
| `app/lib/types.ts` | Updated with `RedditIdea` type |
| `supabase-schema.sql` | Updated with `reddit_ideas` table |

## API Endpoints

### POST /api/reddit-idea
```json
{
  "reddit_url": "https://reddit.com/r/..."
}
```
→ Returns `analysis: RedditIdea`

### GET /api/reddit-idea?url=...
→ Check cache before posting

## Output Structure

```typescript
{
  "coreInsight": {
    "fundamentalTruth": string,
    "summary": string
  },
  "coreAngle": {
    "uniquePositioning": string,
    "beliefChallenged": string,
    "psychologicalHook": string
  },
  "expandAngles": [
    {
      "name": string,
      "concept": string,
      "emotionalTrigger": string,
      "subsegment": string
    }
  ], // Exactly 10 items
  "keywordAnalysis": {
    "powerWords": string[],
    "emotionalTriggers": string[],
    "slangAndJargon": string[],
    "visualMetaphors": string[],
    "explanation": string
  },
  "audienceProfile": {
    "idealViewer": string,
    "demographics": {
      "ageRange": string,
      "lifeStage": string,
      "incomeContext": string
    },
    "innerMonologue": string[]
  },
  "painMap": [
    {
      "painPoint": string,
      "emotionalDepth": string,
      "realLifeScenario": string
    }
  ] // Exactly 5 items
}
```

## Error Codes

| Code | Problem | Solution |
|------|---------|----------|
| `INVALID_URL` | Not a Reddit URL | Check format: `reddit.com/r/sub/comments/id/` |
| `SCRAPE_FAILED` | Post inaccessible | Post is private/deleted, try another |
| `ANALYSIS_FAILED` | AI error | Retry; check OpenAI quota |
| `DB_ERROR` | Database failed | Check Supabase connection |
| `SERVER_ERROR` | Missing API key | Add `OPENAI_API_KEY` to `.env.local` |

## Key Features

✅ **No-BS Analysis** — Street-level psychology, financial PTSD, ego-traps  
✅ **Viral DNA Focus** — 10 expandable content angles + 5 detailed pain maps  
✅ **Smart Scraping** — Reddit public API (no Puppeteer needed)  
✅ **Caching** — Same URL analyzed twice returns cached result  
✅ **Production Ready** — Error handling, validation, type safety  

## Cost

- **Scraping:** Free (Reddit public API)
- **AI Analysis:** ~$0.02 per analysis (gpt-5-mini)
- **Database:** 1-2KB per analysis (JSONB)

## Full Documentation

See `REDDIT_IDEA_FEATURE.md` for:
- Complete API documentation
- Architecture deep-dive
- Frontend integration examples
- Troubleshooting guide
- Testing procedures
