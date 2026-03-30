# Validation & Testing Guide

## Pre-Deployment Checklist

### 1. Database Setup ✓
- [ ] Logged into Supabase
- [ ] Opened SQL Editor
- [ ] Pasted entire `reddit_ideas` table creation SQL from `supabase-schema.sql`
- [ ] Executed successfully (no errors)
- [ ] Verified table exists in Tables view
- [ ] Verified RLS policies created

**Verify this worked:**
```bash
# In Supabase SQL Editor, run:
SELECT COUNT(*) FROM reddit_ideas;
# Should return: count = 0 (empty table, no errors)
```

---

### 2. Environment Variables ✓
- [ ] `.env.local` has `OPENAI_API_KEY=sk-...`
- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_URL=https://...`
- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- [ ] Restarted dev server after adding vars (`npm run dev`)

**Verify this worked:**
```bash
# Check that vars are loaded:
echo $OPENAI_API_KEY  # Should not be empty

# Or check in Node terminal:
require('dotenv').config();
console.log(process.env.OPENAI_API_KEY); // Should show sk-...
```

---

### 3. Files Exist ✓
- [ ] `app/lib/redditScraper.ts` exists
- [ ] `app/lib/redditAnalyzer.ts` exists
- [ ] `app/api/reddit-idea/route.ts` exists
- [ ] `app/lib/types.ts` updated with `RedditIdea` interface

**Verify this worked:**
```bash
ls -la app/lib/redditScraper.ts
ls -la app/lib/redditAnalyzer.ts
ls -la app/api/reddit-idea/route.ts

# All should exist with content (not 0 bytes)
```

---

### 4. Type Compilation ✓
- [ ] Dev server running (`npm run dev`)
- [ ] No TypeScript errors in terminal
- [ ] No errors in VS Code problems panel

**Verify this worked:**
```bash
npm run lint
# Should complete without errors (or only existing errors, not new ones)
```

---

## API Testing (Sequential)

### Test 1: Invalid URL (Should Fail Gracefully)
```bash
curl -X POST http://localhost:3000/api/reddit-idea \
  -H "Content-Type: application/json" \
  -d '{"reddit_url": "https://google.com"}'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "URL must be a valid Reddit post URL (reddit.com)",
  "code": "INVALID_URL"
}
```

✓ HTTP Status: 400

---

### Test 2: Real Reddit Post (Should Succeed)
```bash
curl -X POST http://localhost:3000/api/reddit-idea \
  -H "Content-Type: application/json" \
  -d '{"reddit_url": "https://reddit.com/r/personalfinance/comments/18ekp1h/why_i_stopped_trying_to_get_rich/"}'
```

**Expected Response:**
```json
{
  "success": true,
  "analysis": {
    "coreInsight": { ... },
    "coreAngle": { ... },
    "expandAngles": [...], // Array with 10 items
    "keywordAnalysis": { ... },
    "audienceProfile": { ... },
    "painMap": [...] // Array with 5 items
  },
  "cached": false
}
```

✓ HTTP Status: 200  
✓ `expandAngles.length === 10`  
✓ `painMap.length === 5`

---

### Test 3: Caching (Should Return Same Result Faster)
```bash
# Run the same request again
curl -X POST http://localhost:3000/api/reddit-idea \
  -H "Content-Type: application/json" \
  -d '{"reddit_url": "https://reddit.com/r/personalfinance/comments/18ekp1h/why_i_stopped_trying_to_get_rich/"}'
```

**Expected Response:**
```json
{
  "success": true,
  "analysis": { ... },
  "cached": true  // ← Should be TRUE this time
}
```

✓ HTTP Status: 200  
✓ `cached === true`  
✓ Response time much faster (<100ms vs 5-10s)

---

### Test 4: GET Endpoint (Check Cache)
```bash
curl "http://localhost:3000/api/reddit-idea?url=https://reddit.com/r/personalfinance/comments/18ekp1h/why_i_stopped_trying_to_get_rich/"
```

**Expected Response:**
```json
{
  "success": true,
  "id": "...",
  "analysis": { ... },
  "created_at": "2024-03-30T...",
  "message": "Analysis retrieved successfully"
}
```

✓ HTTP Status: 200

---

### Test 5: GET Endpoint (Not Found)
```bash
curl "http://localhost:3000/api/reddit-idea?url=https://reddit.com/r/personalfinance/comments/nonexistent/"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "No analysis found for this URL",
  "code": "NOT_FOUND"
}
```

✓ HTTP Status: 404

---

### Test 6: Database Verification
Check that data was saved to Supabase:

```bash
# In Supabase SQL Editor:
SELECT id, url, status, created_at FROM reddit_ideas ORDER BY created_at DESC LIMIT 1;
```

**Expected:**
- One row for each URL analyzed
- `status = 'analyzed'`
- `url` matches submitted URL
- `created_at` shows timestamp

---

## Error Scenarios (Edge Cases)

### Scenario: Invalid API Key
```bash
# Manually set OPENAI_API_KEY to invalid value in .env.local
curl -X POST http://localhost:3000/api/reddit-idea \
  -d '{"reddit_url": "https://reddit.com/r/..."}'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "AI processing failed: ...",
  "code": "ANALYSIS_FAILED"
}
```

✓ HTTP Status: 500

---

### Scenario: Private/Deleted Post
```bash
curl -X POST http://localhost:3000/api/reddit-idea \
  -H "Content-Type: application/json" \
  -d '{"reddit_url": "https://reddit.com/r/personalfinance/comments/deletedpost/"}'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Reddit API returned... or Post not found",
  "code": "SCRAPE_FAILED"
}
```

✓ HTTP Status: 400

---

### Scenario: Missing Redis URL
```bash
# Temporarily remove NEXT_PUBLIC_SUPABASE_URL from .env.local
npm run dev
```

**Expected:**
```
Error: Missing Supabase env vars...
```

✓ App should fail to start with clear error

---

## Response Validation

### Check Structure Is Complete

When you get a successful response, verify:

```typescript
const analysis = response.analysis;

// Core objects
assert(analysis.coreInsight.fundamentalTruth); // String
assert(analysis.coreInsight.summary); // String
assert(analysis.coreAngle.uniquePositioning); // String
assert(analysis.coreAngle.beliefChallenged); // String
assert(analysis.coreAngle.psychologicalHook); // String

// Arrays with exact counts
assert(analysis.expandAngles.length === 10); // EXACTLY 10
assert(analysis.painMap.length === 5); // EXACTLY 5

// Keyword analysis
assert(Array.isArray(analysis.keywordAnalysis.powerWords));
assert(Array.isArray(analysis.keywordAnalysis.emotionalTriggers));
assert(Array.isArray(analysis.keywordAnalysis.slangAndJargon));
assert(Array.isArray(analysis.keywordAnalysis.visualMetaphors));
assert(analysis.keywordAnalysis.explanation);

// Audience profile
assert(analysis.audienceProfile.idealViewer);
assert(analysis.audienceProfile.demographics.ageRange);
assert(analysis.audienceProfile.demographics.lifeStage);
assert(analysis.audienceProfile.demographics.incomeContext);
assert(Array.isArray(analysis.audienceProfile.innerMonologue));
assert(analysis.audienceProfile.innerMonologue.length >= 3);

// Each pain point
analysis.painMap.forEach(pain => {
  assert(pain.painPoint);
  assert(pain.emotionalDepth);
  assert(pain.realLifeScenario);
});

// Each angle
analysis.expandAngles.forEach(angle => {
  assert(angle.name);
  assert(angle.concept);
  assert(angle.emotionalTrigger);
  assert(angle.subsegment);
});
```

---

## Performance Benchmarks

| Operation | Expected Time | Actual Time |
|-----------|--------------|-------------|
| First analysis (scrape + AI) | 5-10s | — |
| Cached lookup (GET) | <100ms | — |
| Cached POST | <200ms | — |
| Database insert | <500ms | — |

**Record your actual times:**
- First analysis: _____ seconds
- Cached lookup: _____ ms
- Overall CPU usage: _____ %

---

## Success Criteria

### ✅ All Tests Pass If:
- [ ] Test 1 (Invalid URL) returns error
- [ ] Test 2 (Real post) returns complete analysis
- [ ] Test 3 (Caching) returns same data with `cached: true`
- [ ] Test 4 (GET) retrieves cached analysis
- [ ] Test 5 (GET not found) returns 404
- [ ] Test 6 (Database) shows data persisted
- [ ] Response structure matches `RedditIdea` type
- [ ] `expandAngles.length === 10`
- [ ] `painMap.length === 5`
- [ ] No TypeScript errors
- [ ] No runtime errors in console

### 🎯 Ready for Production If:
- [ ] All 10+ test cases pass
- [ ] Database backups configured
- [ ] Error logging set up
- [ ] Cost monitoring in place
- [ ] Rate limiting configured (optional)
- [ ] Documentation reviewed

---

## Quick Test Script

Save this as `test-reddit-idea.sh`:

```bash
#!/bin/bash

echo "Testing /api/reddit-idea endpoint..."
echo ""

echo "Test 1: Invalid URL"
curl -s -X POST http://localhost:3000/api/reddit-idea \
  -H "Content-Type: application/json" \
  -d '{"reddit_url": "https://google.com"}' | jq .

echo ""
echo "Test 2: Real post"
curl -s -X POST http://localhost:3000/api/reddit-idea \
  -H "Content-Type: application/json" \
  -d '{"reddit_url": "https://reddit.com/r/personalfinance/comments/18ekp1h/why_i_stopped_trying_to_get_rich/"}' | jq .

echo ""
echo "Test 3: Same URL again (should be cached)"
curl -s -X POST http://localhost:3000/api/reddit-idea \
  -H "Content-Type: application/json" \
  -d '{"reddit_url": "https://reddit.com/r/personalfinance/comments/18ekp1h/why_i_stopped_trying_to_get_rich/"}' | jq .cached

echo ""
echo "All tests complete!"
```

**Run:**
```bash
chmod +x test-reddit-idea.sh
./test-reddit-idea.sh
```

---

## Troubleshooting Checklist

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Check files exist: `ls app/lib/redditScraper.ts` |
| "401 Unauthorized" | Check `OPENAI_API_KEY` in `.env.local` |
| "NEXT_PUBLIC_SUPABASE_URL" missing | Add to `.env.local` and restart server |
| Timeout on POST request | Check Reddit URL is valid, try different post |
| Database shows no data | Check RLS policies; verify Supabase connection |
| "expandAngles has 8 instead of 10" | AI didn't generate exactly 10 — retry or check prompt |

---

## Success Message

When everything works, you should see:
```bash
$ curl -X POST http://localhost:3000/api/reddit-idea -d '...'

{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "analysis": {
    "coreInsight": { ... },
    ...
    "expandAngles": [ 10 items ... ],
    "painMap": [ 5 items ... ]
  }
}
```

🎉 **You're ready!**
