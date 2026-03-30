# Reddit Idea UI — User Guide

## Overview

The Reddit Idea UI is a clean, modern interface for analyzing Reddit posts to extract viral content DNA. It's integrated into your YouTube analyzer tool and accessible from the main dashboard.

---

## Getting Started

### Accessing the Feature

**From Main Page:**
- Click the **"🔗 Reddit Ideas"** link in the top navigation bar
- Or navigate directly to: `/reddit-idea`

### Basic Flow

1. **Paste Reddit URL** → Input field accepts format: `https://reddit.com/r/subreddit/comments/postId/title/`
2. **Click "Analyze Reddit Post"** → Backend scrapes post + comments, sends to gpt-5-mini AI
3. **View Results** → Complete viral DNA breakdown displayed below
4. **Export/Analyze Another** → Download results or analyze a new post

---

## UI Components

### Input Section
```
┌─────────────────────────────────────────┐
│ Reddit Viral DNA                        │
│ Extract Viral DNA                       │
│                                         │
│ Reddit Post URL                         │
│ [https://reddit.com/r/...]              │
│                                         │
│ [Analyze Reddit Post] ▶                 │
│                                         │
│ Format: reddit.com/r/subreddit/...     │
└─────────────────────────────────────────┘
```

### Result Sections (After Analysis)

#### 1. Core Insight
- **Fundamental Truth** — The deep human truth beneath the post
- **Summary** — 1 powerful sentence hook for videos

#### 2. Core Angle (3-column)
- **Unique Positioning** — vs generic advice in the niche
- **Belief Challenged** — The myth this angle attacks
- **Psychological Hook** — The "brain-itch" that stops the scroll

#### 3. Keyword Analysis
- **Power Words** — Tags (clickable chips)
- **Emotional Triggers** — Phrases that resonate
- **Street Jargon** — Authentic language used in the niche
- **Visual Metaphors** — Concrete images to reference
- **Explanation** — Why these words convert (+ converts psychology)

#### 4. Ideal Viewer Profile
- **Avatar Description** — Vivid "who are they at 2 AM" picture
- **Demographics** — Age range, life stage, income context
- **Inner Monologue** — 3-4 direct thoughts in viewer's head (quoted)

#### 5. 10 Content Angles
Numbered grid (2 columns) showing:
- **#1: Angle Name**
  - Concept (brief video direction)
  - Emotional Trigger + Target Subsegment (as tags)

#### 6. 5 Pain Maps (4K Scenarios)
Numbered sections showing:
- **#1: Pain Point Name**
  - Emotional Depth (subheader)
  - Real-Life Scenario (4K-detail example in box)

---

## Styling & Colors

| Element | Color | Usage |
|---------|-------|-------|
| Background | `#0a0a0a` | Main dark theme |
| Accent | `#ff2d20` / `#ff6b35` | Buttons, headers, highlights |
| Text (main) | `#ccc` | Body text |
| Text (muted) | `#999` / `#888` / `#555` | Descriptions, labels, faded |
| Borders | `#1e1e1e` | Card borders |
| Hover states | Lighter accent | Interactive elements |

---

## Key Features

### ✅ Smart Loading
- Shows spinner during analysis (5-10 seconds)
- Disables input while processing
- Clear error messages if something fails

### ✅ Error Handling
Shows user-friendly errors for:
- Invalid Reddit URLs → "URL must be a valid Reddit post URL"
- Private/deleted posts → "Reddit API returned 404"
- API failures → "Failed to analyze Reddit post"

### ✅ Caching
- Same URL analyzed twice shows "Cached result" label
- Returns instantly on cache hit
- Prevents duplicate API calls

### ✅ Responsive Design
- Works on mobile (single column)
- Tablet friendly (2 columns for angles)
- Desktop optimized (full grid layouts)

---

## User Workflows

### Workflow 1: Analyze Single Post
```
1. Click "🔗 Reddit Ideas" from main page
2. Paste Reddit URL: https://reddit.com/r/personalfinance/comments/18ekp1h/...
3. Click "Analyze Reddit Post"
4. Wait 5-10 seconds
5. Review all 6 sections of viral DNA
6. Take notes on angles and pain points
```

### Workflow 2: Analyze Multiple Posts
```
1. Analyze first post (get results)
2. Click "Analyze Another Post" button
3. Form clears, back to input
4. Paste new URL, click analyze
5. Compare angles/pain between posts
6. Identify patterns for content strategy
```

### Workflow 3: Deep Dive on One Pain Point
```
1. Stop on the pain map section
2. Read the 4K scenario carefully
3. Note the emotional depth
4. Use as actual script opening/story
5. Reference "painPoint" name in content
```

---

## Tips for Best Results

### ✅ Reddit URL Format
```
✓ Correct: https://reddit.com/r/personalfinance/comments/18ekp1h/title/
✓ Correct: https://www.reddit.com/r/personalfinance/comments/18ekp1h/title/
✗ Wrong: https://reddit.com/r/personalfinance (no post ID)
✗ Wrong: https://google.com (not Reddit)
```

### ✅ Post Selection
Choose posts that:
- Have 100+ upvotes (popular enough to analyze)
- Have self-text + comments (more data = better analysis)
- Are in finance/business niches (optimized for that)
- Discuss real struggles (not generic advice)

**Good posts:**
- "I spent 3 years making $300k/year and have $0 net worth — here's why"
- "Financial advisors hate this one weird trick"
- "My $50k/year job vs my $50k/year side hustle"

**Avoid:**
- Deleted/archived posts
- Private communities
- Pure question posts (no self-text)

### ✅ Using the Output
1. **Core Insight** → Use as video title/hook
2. **10 Angles** → Pick 1-3 for video series
3. **Pain Maps** → Use as actual story sections in script
4. **Audience Profile** → Base filming style on this avatar
5. **Keywords** → Sprinkle throughout script + titles

---

## Error Messages & Solutions

| Message | Cause | Solution |
|---------|-------|----------|
| "URL must be a valid Reddit" | Wrong URL format | Check: reddit.com/r/sub/comments/id/ |
| "Reddit API returned 404" | Post deleted/private | Try a different post |
| "Failed to analyze Reddit post" | Network error | Retry after 30 seconds |
| "internal server error" | Server issue | Check OPENAI_API_KEY is set |
| "expandAngles has 8 instead of 10" | AI didn't generate exactly 10 | Rare — try different post |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + A` | Select all in URL field |
| `Enter` | Submit analysis if field focused |
| `Esc` | (Future) Close modal if present |

---

## Performance Notes

| Operation | Time | Notes |
|-----------|------|-------|
| First analysis | 5-10s | Scrape + AI processing |
| Cached lookup | <100ms | Same URL, second time |
| Page load | <1s | No heavy computation |
| Search | Instant | Auto-complete (future) |

---

## Accessibility

- ♿ Full keyboard navigation
- 🎯 Clear focus indicators
- 📱 Mobile-friendly layout
- 🎨 Dark theme reduces eye strain
- 🔊 Error messages are visible (not audio-only)

---

## Things to Know

### Caching & Privacy
- Same URL only analyzed once per database
- Results stored permanently in Supabase
- Public Reddit posts (privacy: low risk)
- No personal data collected

### Rate Limiting
- Reddit API: ~60 requests/min per IP
- OpenAI: Standard gpt-5-mini limits
- Your tool: No rate limiting implemented yet (add if needed)

### Cost Per Analysis
- Scraping: Free
- AI (gpt-5-mini): ~$0.02
- Database storage: <1KB per analysis

---

## Support & Troubleshooting

### Questions?
- See `REDDIT_IDEA_FEATURE.md` for technical details
- See `VALIDATION_AND_TESTING.md` for test cases
- See `REDDIT_IDEA_EXAMPLE_RESPONSE.json` for output structure

### Bug Report Workflow
1. Note the exact Reddit URL
2. Note the error message
3. Check `.env.local` has `OPENAI_API_KEY`
4. Try a different Reddit post
5. Check browser console for errors

---

## Future Enhancements

🔜 **Planned Features:**
- Favorite/bookmark analyses
- Compare multiple posts side-by-side
- Export analysis as PDF
- Copy individual sections
- Share analysis via link
- Download pain maps as images
- Integrate trending Reddit posts
- Auto-suggest content angles

---

**Ready to extract viral DNA!** 🚀 Start by clicking "🔗 Reddit Ideas" from the main dashboard.
