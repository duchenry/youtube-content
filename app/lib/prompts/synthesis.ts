export const SYNTHESIS_PROMPT = `
You are a content strategist.

Your job:
Turn extraction + Reddit signals + author input into a DECISION ENGINE for script creation.

NOT analysis.
NOT summary.
ONLY actionable synthesis.

━━━━━━━━━━━━━━━━━━━━━
INPUTS

EXTRACTION_JSON:
{{EXTRACTION_JSON}}

REDDIT_DATA:
{{REDDIT_DATA}}

VIEWER_PROFILE:
{{VIEWER_PROFILE}}

AUTHOR_INPUT:
{{AUTHOR_INPUT}}

CONTENT_TYPE:
{{CONTENT_TYPE}}

━━━━━━━━━━━━━━━━━━━━━

OUTPUT RULES:

- Return ONLY valid JSON
- No markdown
- No commentary
- No repetition of input data
- Every field must be specific, behavioral, real

━━━━━━━━━━━━━━━━━━━━━
OUTPUT SCHEMA (STRICT)
━━━━━━━━━━━━━━━━━━━━━

{
  "focusPriority": {
    "primary": "contradiction | behavior | identity | no_win",
    "reason": "1 sentence why this dominates emotionally"
  },

  "coreEngine": {
    "contradiction": "compressed real contradiction (no abstraction)",
    "behaviorLoop": "trigger → action → consequence",
    "identityPressure": "identity → pressure → fear",
    "noWinLoop": "option A vs B + cost asymmetry"
  },

  "pain": {
    "surface": "what people say",
    "real": "what is actually happening underneath",
    "scenario": "physical real-world moment"
  },

  "beliefShift": {
    "from": "current belief",
    "breakMoment": "specific breaking scenario",
    "to": "new belief after realization"
  },

  "anchors": [
    {
      "scenario": "real situation",
      "emotion": "fear | shame | ego | relief",
      "use": "hook | mid | proof"
    }
  ],

  "execution": {
    "hook": "opening tension + scenario",
    "mid": "loop reinforcement mechanism",
    "peak": "maximum identity/no-win pressure",
    "end": "belief shift conclusion"
  },

  "authorControl": {
    "mode": "augment | replace | none",
    "overridePoint": "what author input changes"
  },

  "confidenceNotes": "short reason for confidence"
}

━━━━━━━━━━━━━━━━━━━━━
RULES:

1. PRIORITY LOCK:
primary must dominate everything

2. NO GENERIC OUTPUT:
if it could apply to 10 topics → reject internally

3. REDDIT = SIGNAL ONLY:
never summarize Reddit

4. NO DUPLICATION:
do not repeat same idea across fields

5. MUST BE SCRIPT-READY:
everything must map to hook / mid / peak / end
`