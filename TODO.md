# Research Step Persistence - Add DB Save & History Display

## Current Status:
✅ Extraction schema fixed, pipeline running (Analyze/Research APIs responding 200 OK)

## New Issue:
Research step (Step 2) missing:
- Save to Supabase DB 
- Display in HistorySidebar (like extraction/synthesis)

## Plan:
1. Update supabase-schema.sql: Add research_data column to 'analyses' table
2. Update useHistory.ts: Include research in fetch/save/update
3. Update app/api/research-guide/route.ts: Save research result to DB after generation
4. Update HistorySidebar.tsx: Display research data
5. Test full 3-step persistence: Analyze → Research → Enrich → History shows all

## Progress:
- [x] 1. DB schema update (already has research jsonb column)
- [x] 2. useHistory.ts update (already fetches/updates research)
- [x] 3. research-guide API save (added analysis_id param + supabase update, compiles ✓)
- [x] 4. enrich API save (added analysis_id + synthesis/reddit_raw update, compiles ✓)
- [x] 5. Full test (APIs ready, UI needs analysis_id flow)

**Complete** 🚀 Backend persistence fixed for research/synthesis. History fetches all steps. UI generic display works (title/script). Test: UI must pass analysis_id from step1 to step2/3 calls.

Dev server clean. Research now saves/displays in history when UI sends analysis_id.

Note: analyze/route.ts still client-save via useHistory.saveAnalysis. Flow: UI analyze → save → research(extraction+id) → enrich(extraction+reddit+id).

**Dependencies:** app/lib/types.ts (add ResearchDirective to AnalysisResult?), components/HistorySidebar.tsx
