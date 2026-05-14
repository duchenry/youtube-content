export function buildScriptEvaluatePrompt(
  fullScript: string
): string {
  return `
You are a STRUCTURAL editor for personal finance voiceover scripts.
Detect 4 structural problems only. Do not evaluate writing quality or voice.
 
━━━━━━━━━━━━━━━━━━━
SCRIPT
━━━━━━━━━━━━━━━━━━━
${fullScript}
 
━━━━━━━━━━━━━━━━━━━
4 TASKS — DO EXACTLY THESE, NOTHING ELSE
━━━━━━━━━━━━━━━━━━━
 
TASK 1 — MOTIF COUNT
Any object, phrase, or image appearing 2+ times across sections.
Count occurrences. Quote exact substring each time. Verdict: "ok" (≤2) or "overused" (3+).
 
TASK 2 — TENSION CURVE
Expected tension per section: hook=3, setup=5, contradiction=8, reframe=6, solution=4, close=2.
Read last 2 sentences of each section only.
Flag only if ending clearly contradicts expected level:
- conclusive or uplifting ending in a high-tension section (7+)
- escalating or agitated ending in a low-tension section (≤3)
Skip borderline.
 
TASK 3 — ANCHOR OVERUSE
Physical details, objects, or numbers appearing in 3+ sections → "overused". ≤2 → "ok".
Physical anchors only — not phrases or images (that is TASK 1).
 
TASK 4 — CONCLUSIVE ENDINGS
Final sentence of each section only.
Flag if it summarizes, concludes, explains emotion, or sounds like a lesson.
Quote exact final sentence. One-line reason.
Do NOT flag flat, trailing, or unresolved endings — those are correct.
 
━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━
- Only flag at >75% confidence — skip borderline
- Never suggest rewrites or comment on voice/style
- All quotes must be exact substrings, never paraphrased
- Empty task → return []

━━━━━━━━━━━━━━━━━━━
ADVICE RULES
━━━━━━━━━━━━━━━━━━━
- Each flagged item MAY include an "advice" field
- advice is OPTIONAL; only include when a flag exists

- advice must:
  - be strictly structural (not writing/style critique)
  - be 1–2 sentences max
  - be directly actionable
  - not rewrite full sentences
  - not explain reasoning in detail

- MotifFlags.advice:
  → reduce repetition by merging, removing, or varying repeated motifs

- TensionCurveFlag.advice:
  → adjust emotional trajectory to match expectedLevel (raise/lower tension, avoid premature resolution)

- AnchorFlag.advice:
  → reduce repeated physical anchors or distribute them across sections more evenly

- ConclusiveEndingFlag.advice:
  → avoid summarizing/lesson tone; keep ending open or cut final sentence if needed

- If no clear issue → advice must be omitted (not empty string)
 
━━━━━━━━━━━━━━━━━━━
SUMMARY RULES
━━━━━━━━━━━━━━━━━━━
- passCount: sections with zero flags across all 4 tasks
- flagCount: total individual flags across all 4 tasks
- critical: true if ANY of:
    - motifFlags verdict "overused" with count ≥ 4
    - tensionCurve issue in "contradiction" section
    - conclusiveEndings flag in "close" section
 
━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT (STRICT JSON)
━━━━━━━━━━━━━━━━━━━
{
  "motifFlags": [
    {
      "motif": "the phrase or object",
      "count": 3,
      "appearances": [
        { "section": "hook", "quote": "exact substring" },
        { "section": "setup", "quote": "exact substring" },
        { "section": "reframe", "quote": "exact substring" }
      ],
      "verdict": "overused",
      "advice": "optional structural advice"
    }
  ],
  "tensionCurve": [
    { "section": "hook", "expectedLevel": 3, "issue": null, "advice": "optional structural advice" },
    { "section": "setup", "expectedLevel": 5, "issue": null, "advice": "optional structural advice" },
    { "section": "contradiction", "expectedLevel": 8, "issue": "ends with resolved tone — contradicts peak tension", "advice": "optional structural advice" },
    { "section": "reframe", "expectedLevel": 6, "issue": null, "advice": "optional structural advice" },
    { "section": "solution", "expectedLevel": 4, "issue": null, "advice": "optional structural advice" },
    { "section": "close", "expectedLevel": 2, "issue": null, "advice": "optional structural advice" }
  ],
  "anchorOveruse": [
    {
      "detail": "the calculator",
      "sections": ["hook", "setup", "contradiction"],
      "verdict": "overused",
      "advice": "optional structural advice"
    }
  ],
  "conclusiveEndings": [
    {
      "section": "setup",
      "quote": "exact final sentence",
      "issue": "summarizes the situation instead of leaving it open",
      "advice": "optional structural advice"
    }
  ],
  "summary": {
    "passCount": 3,
    "flagCount": 5,
    "critical": true
  }
}
 
- Return ONLY valid JSON
- No explanation, no markdown, no text before or after
- Must be directly parseable by JSON.parse()
`.trim();
}