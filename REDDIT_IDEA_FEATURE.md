# Reddit Idea Feature — Implementation Guide

## Overview

The **reddit-idea** feature is a complete backend system that analyzes Reddit posts for viral content DNA. It extracts psychological hooks, audience pain points, and content angles specifically tailored for street-level finance YouTube content.

### Architecture

```
Client Request (Reddit URL)
        ↓
POST /api/reddit-idea
        ↓
   ┌────────────────────┐
   │  1. Scraper        │ ← Fetch Reddit post + top 10 comments
   └────────────────────┘
        ↓
   ┌────────────────────┐
   │  2. AI Processor   │ ← gpt-5-mini with "Audience Psychologist" prompt
   └────────────────────┘
        ↓
   ┌────────────────────┐
   │  3. Supabase DB    │ ← Store analysis in reddit_ideas table
   └────────────────────┘
        ↓
   Return Structured JSON (RedditIdea)
```

---

## Setup Instructions

### 1. **Update Supabase Schema**

Run this SQL in your Supabase SQL Editor:

```sql
-- Table for storing Reddit idea analysis
create table if not exists reddit_ideas (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),

  -- Reddit post URL (unique to prevent duplicates)
  url         text not null unique,

  -- Raw Reddit data (post title, self-text, top 10 comments)
  reddit_data jsonb,

  -- The AI analysis output (viral DNA)
  analysis    jsonb not null,

  -- Status: analyzed, processing, failed
  status      text default 'analyzed'
);

-- Index for URL lookup
create index if not exists reddit_ideas_url_idx on reddit_ideas (url);

-- Index for chronological listing
create index if not exists reddit_ideas_created_at_idx on reddit_ideas (created_at desc);

-- RLS for reddit_ideas
alter table reddit_ideas enable row level security;

create policy "Allow anon select" on reddit_ideas
  for select using (true);

create policy "Allow anon insert" on reddit_ideas
  for insert with check (true);

create policy "Allow anon delete" on reddit_ideas
  for delete using (true);
```

### 2. **Verify Environment Variables**

Confirm you have these in `.env.local`:

```env
OPENAI_API_KEY=sk-... (gpt-5-mini access)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. **Files Created**

- `app/lib/redditScraper.ts` — Reddit post scraper (public API, no auth)
- `app/lib/redditAnalyzer.ts` — AI processor with system prompt
- `app/api/reddit-idea/route.ts` — Main API endpoint (GET & POST)
- `app/lib/types.ts` — Updated with `RedditIdea` & `RedditPostData` types
- `supabase-schema.sql` — Updated with `reddit_ideas` table

---

## API Usage

### POST /api/reddit-idea — Analyze a Reddit Post

**Request:**
```bash
curl -X POST http://localhost:3000/api/reddit-idea \
  -H "Content-Type: application/json" \
  -d '{
    "reddit_url": "https://reddit.com/r/personalfinance/comments/abc123/title/"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://reddit.com/r/personalfinance/comments/abc123/title/",
  "analysis": {
    "coreInsight": {
      "fundamentalTruth": "People sabotage their wealth through ego-driven purchases disguised as 'investments'",
      "summary": "Your spending habits reveal more about your insecurities than your income"
    },
    "coreAngle": { ... },
    "expandAngles": [ ... ], // 10 items with name, concept, emotionalTrigger, subsegment
    "keywordAnalysis": { ... },
    "audienceProfile": { ... },
    "painMap": [ ... ] // 5 items with painPoint, emotionalDepth, realLifeScenario
  },
  "cached": false,
  "message": "Reddit post analyzed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid Reddit URL. Expected format: https://reddit.com/r/subreddit/comments/postId/title/",
  "code": "INVALID_URL"
}
```

### GET /api/reddit-idea?url=... — Check Cache

**Request:**
```bash
curl "http://localhost:3000/api/reddit-idea?url=https://reddit.com/r/personalfinance/comments/abc123/title/"
```

**Response (Found):**
```json
{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://reddit.com/r/personalfinance/comments/abc123/title/",
  "analysis": { ... },
  "created_at": "2024-03-30T10:30:00Z",
  "message": "Analysis retrieved successfully"
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "error": "No analysis found for this URL",
  "code": "NOT_FOUND"
}
```

---

## Error Codes & Handling

| Code | HTTP | Meaning | Action |
|------|------|---------|--------|
| `MISSING_URL` | 400 | No `reddit_url` provided | Check request body |
| `INVALID_URL` | 400 | Not a Reddit URL or invalid format | Validate URL format |
| `SCRAPE_FAILED` | 400 | Reddit post inaccessible (private, deleted, 404) | Check URL; try different post |
| `ANALYSIS_FAILED` | 500 | AI model error or invalid response | Retry; check OpenAI quota |
| `DB_ERROR` | 500 | Supabase insert failed | Check database permissions |
| `INTERNAL_ERROR` | 500 | Unhandled exception | Check server logs |
| `SERVER_ERROR` | 500 | Missing API key | Check `.env.local` |

---

## System Architecture — Deep Dive

### 1. Red it Scraper (`redditScraper.ts`)

**Strategy:** Uses Reddit's public JSON API (`/r/subreddit/comments/postId.json`)

**Handles:**
- URL parsing (detects `/r/subreddit/comments/postId/` format)
- Post data extraction (title, self-text, upvotes)
- Top 10 comment filtering (by upvotes)
- Error handling (404, 403, network timeouts)

**Why no Puppeteer/Playwright?**
- Reddit exposes a public JSON API — no browser needed
- 10x faster, zero overhead
- No detection/blocking issues
- Reliable rate limiting (no aggressive scraping)

```typescript
// URL conversion example:
Input:  "https://reddit.com/r/personalfinance/comments/abc123/my_title/"
Output: "https://reddit.com/r/personalfinance/comments/abc123/my_title.json"

Response: [PostData, CommentsData]
```

### 2. AI Processor (`redditAnalyzer.ts`)

**Model:** gpt-5-mini (cost-effective, fast)

**System Prompt:** Hardcoded "Audience Psychologist" persona

**Validation:**
- `expandAngles` must be exactly 10 items
- `painMap` must be exactly 5 items
- JSON schema strict validation
- Rejects truncated responses

```typescript
// Example validation:
const idea = await analyzeRedditWithGPT5Mini(redditData);
// Throws if:
//   - expandAngles.length !== 10
//   - painMap.length !== 5
//   - Missing required fields
```

### 3. API Route (`route.ts`)

**Flow:**
1. Validate request (HTTP method, URL format)
2. Check Supabase cache (URL lookup)
3. Scrape Reddit if not cached
4. Analyze with AI
5. Store in Supabase
6. Return response

**Caching:** URLs are unique keys — prevents re-analyzing same post

---

## Data Model

### RedditIdea (Output)

```typescript
interface RedditIdea {
  coreInsight: {
    fundamentalTruth: string;    // The deep human truth
    summary: string;              // 1 sentence hook
  };
  coreAngle: {
    uniquePositioning: string;   // vs. generic advice
    beliefChallenged: string;    // The myth attacked
    psychologicalHook: string;   // The "brain-itch"
  };
  expandAngles: Array<{
    name: string;                 // Angle name
    concept: string;              // Video direction
    emotionalTrigger: string;     // Core emotion
    subsegment: string;           // Target viewer
  }>; // Exactly 10 items
  keywordAnalysis: {
    powerWords: string[];
    emotionalTriggers: string[];
    slangAndJargon: string[];
    visualMetaphors: string[];
    explanation: string;
  };
  audienceProfile: {
    idealViewer: string;          // 2 AM avatar
    demographics: {
      ageRange: string;
      lifeStage: string;
      incomeContext: string;
    };
    innerMonologue: string[];     // 3-4 direct thoughts
  };
  painMap: Array<{
    painPoint: string;            // Specific pain
    emotionalDepth: string;       // Internal feeling
    realLifeScenario: string;    // 4K-detail example
  }>; // Exactly 5 items
}
```

### RedditPostData (Scraped)

```typescript
interface RedditPostData {
  title: string;
  selfText: string;
  upvotes: number;
  comments: Array<{
    author: string;
    text: string;
    upvotes: number;
  }>;
}
```

---

## Production Considerations

### Rate Limiting
- Reddit's API allows ~60 requests/minute per IP
- Supabase insert is cached (single write per URL)
- OpenAI gpt-5-mini: standard rate limits apply

### Error Resilience
- Network timeouts set to 10 seconds
- Graceful fallbacks for missing fields
- Detailed error codes for debugging

### Cost Optimization
- **Scraping:** Free (Reddit public API)
- **AI Analysis:** ~$0.02 per analysis (gpt-5-mini)
- **Database:** Minimal storage (JSONB efficient)

### Security
- No authentication exposed (public Reddit data)
- Supabase RLS allows anonymous access (adjust if needed)
- Input validation on all endpoints
- OpenAI key stored server-side only

---

## Testing

### Manual Test

```bash
# Test with a real Reddit post
curl -X POST http://localhost:3000/api/reddit-idea \
  -H "Content-Type: application/json" \
  -d '{
    "reddit_url": "https://reddit.com/r/personalfinance/comments/18ekp1h/why_i_stopped_trying_to_get_rich/"
  }'
```

### Test Different Error Scenarios

```bash
# Invalid URL
curl -X POST http://localhost:3000/api/reddit-idea \
  -d '{"reddit_url": "not-a-reddit-url"}'

# Missing URL
curl -X POST http://localhost:3000/api/reddit-idea \
  -d '{}'

# Deleted post
curl -X POST http://localhost:3000/api/reddit-idea \
  -d '{"reddit_url": "https://reddit.com/r/personalfinance/comments/deleted/"}'
```

---

## Frontend Integration (Example)

```typescript
// Example React hook
import { useState } from 'react';
import { RedditIdea } from '@/app/lib/types';

export function useRedditAnalyzer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RedditIdea | null>(null);

  const analyze = async (redditUrl: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reddit-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reddit_url: redditUrl }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Analysis failed');
      }

      setAnalysis(json.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, error, analysis };
}
```

---

## Troubleshooting

### "OPENAI_API_KEY is not configured"
- Check `.env.local` has the key
- Restart dev server after adding env vars

### "Invalid Reddit URL"
- Ensure URL includes `/r/[subreddit]/comments/[id]/`
- Try: `https://reddit.com/r/personalfinance/comments/abc123/title/`

### "Could not parse Reddit post data"
- Post may be private or deleted
- Try a different post
- Check Reddit's /r/.../.json endpoint manually

### "AI processing failed: response truncated"
- Analysis was cut off (rare)
- Retry request — usually succeeds on second attempt

### "Failed to save analysis to database"
- Check Supabase connection string in `.env.local`
- Verify `reddit_ideas` table exists and RLS policies are enabled

---

## Next Steps

1. **Run migration:** Execute the Supabase schema SQL
2. **Test the endpoint:** Use `curl` examples above
3. **Build UI:** Create form component to accept Reddit URLs
4. **Display results:** Show `analysis` data with rich formatting
5. **Monitor:** Track API calls, errors, and costs

