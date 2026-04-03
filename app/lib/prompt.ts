export const INPUT_CONTRACT = {
  platform: "youtube-long",
  niche: "personal finance",
  targetViewer: "",
  competitorScript: "",
  topComments: [],
};

export const EXTRACTION_PROMPT = `
You are a content reverse-engineering expert.

Your ONLY job:
- Extract what ACTUALLY exists in the video
- Do NOT generate, improve, or reinterpret ideas
- Do NOT add creativity
- Do NOT generalize beyond the source

Everything must be grounded in:
- the competitorScript
- or clearly marked as INFERRED

━━━━━━━━━━━━━━━━━━━━━
CONTEXT:
- Platform: {{INPUT.platform}}
- Niche: {{INPUT.niche}}
- Target viewer: {{INPUT.targetViewer}}
- Script: {{INPUT.competitorScript}}
- Top comments: {{INPUT.topComments}}
━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON. No markdown. No explanation.

{
  "hook": {
    "raw": "Exact first 1–2 sentences from the script (verbatim or very close paraphrase)",
    "type": "pattern interrupt | fear | curiosity | authority | story",
    "mechanism": "Why THIS specific hook works psychologically — must reference specific WORDS or PHRASES from the hook",
    "confidence": "high | medium | low"
  },

  "hookQuality": {
    "strength": "weak | medium | strong",
    "why": "Based on specificity + emotional trigger + clarity",
    "risk": "What could fail if reused"
  },

  "angle": {
    "claim": "The core argument this video is making — one clear sentence",
    "supportingLogic": "1–2 concrete reasoning steps used in the video — must reference actual examples, statements, or sequences from the script",
    "hiddenAssumption": "What must be true for this claim to work (often unstated)",
    "confidence": "high | medium | low"
  },

  "coreTruth": {
    "insight": "The uncomfortable truth this video is built on — must be specific to THIS video",
    "triggerMoment": "Exact moment or line where this hits (quote or describe clearly)",
    "confidence": "high | medium | low"
  },

  "attention": {
    "patternBreak": "What feels different vs other videos in this niche — tied to a specific moment",
    "escalation": [
      "Emotional beat 1",
      "Emotional beat 2",
      "Emotional beat 3"
    ],
    "retentionDriver": {
      "description": "Why viewers keep watching past 50% — must reference a specific moment",
      "confidence": "high | medium | low"
    }
  },

  "proofMechanics": {
    "evidenceUsed": [
      "Specific numbers, examples, or cases mentioned",
      "If none: write 'Not explicitly stated in source'"
    ],
    "transferablePattern": {
      "pattern": "Abstract pattern behind the proof — must be reusable in another niche",
      "confidence": "high | medium | low"
    }
  },

  "structureDNA": {
    "phases": [
      {
        "phase": "Hook",
        "goal": "What this part does to viewer psychology",
        "tactic": "Specific technique used",
        "source": "OBSERVED | INFERRED"
      },
      {
        "phase": "Setup",
        "goal": "",
        "tactic": "",
        "source": ""
      },
      {
        "phase": "Escalation",
        "goal": "",
        "tactic": "",
        "source": ""
      },
      {
        "phase": "Insight Drop",
        "goal": "",
        "tactic": "",
        "source": ""
      },
      {
        "phase": "Reinforcement",
        "goal": "",
        "tactic": "",
        "source": ""
      },
      {
        "phase": "Payoff / Close",
        "goal": "",
        "tactic": "",
        "source": ""
      }
    ],

    "retentionMoments": [
      {
        "moment": "Specific moment in the video",
        "whyItWorks": "Psychological reason",
        "pattern": "Named pattern",
        "isPrimary": true
      },
      {
        "moment": "",
        "whyItWorks": "",
        "pattern": "",
        "isPrimary": false
      }
    ]
  },

  "audience": {
    "profile": "What kind of person is watching this — based on comments + content",
    "painMap": [
      {
        "pain": "Specific friction point",
        "feeling": "2-word emotional state",
        "realScenario": "Concrete situation"
      },
      {
        "pain": "",
        "feeling": "",
        "realScenario": ""
      },
      {
        "pain": "",
        "feeling": "",
        "realScenario": ""
      }
    ],
    "commentPatterns": {
      "repeatedPain": "What multiple comments point to",
      "languageUsed": [
        "Exact phrasing from comments (or close paraphrase)"
      ],
      "misunderstanding": "What viewers are confused about after watching"
    }
  },

  "weakPoints": {
    "whereItLosesAttention": "Moment where video likely drops retention (if any)",
    "why": "Reason based on pacing / clarity / repetition"
  },

  "priority": {
    "primaryDriver": "ONE thing that most drives this video’s performance",
    "secondaryDriver": "Optional supporting factor",
    "why": "Why this matters more than others"
  }
}

━━━━━━━━━━━━━━━━━━━━━
HARD RULES (NON-NEGOTIABLE):

1. NO CREATIVITY
- Do NOT invent ideas
- Do NOT improve the content
- Only extract and clarify

2. SOURCE GROUNDING
- Every field must come from:
  - script OR
  - comments OR
  - clearly marked inference

3. OBSERVED vs INFERRED
- If directly seen → treat as fact
- If deduced → must still tie to wording or structure

4. NO GENERIC OUTPUT
- If it could apply to any video → it is INVALID

5. LANGUAGE STYLE
- Neutral, precise, surgical
- No storytelling tone
- No “you feel” narrative

6. PRIORITY FOCUS
- Extract what actually drives performance:
  - core truth
  - hook mechanism
  - retention driver

━━━━━━━━━━━━━━━━━━━━━
DATA_SUFFICIENCY_RULE (CRITICAL):

- If the source does NOT contain enough signal:
  → Do NOT guess
  → Do NOT force inference
  → Output exactly: "Insufficient data from source"

- It is BETTER to return missing data than to fabricate weak insight

━━━━━━━━━━━━━━━━━━━━━
ANTI_GENERIC_FILTER:

For EACH field:
- Ask: “Could this apply to any other random video?”

If YES:
→ Rewrite using:
  - specific wording
  - specific moment
  - specific structure

If still generic:
→ Output: "Too generic — insufficient signal in source"

━━━━━━━━━━━━━━━━━━━━━
CONFIDENCE RULE:

- HIGH = directly observable in script
- MEDIUM = strongly implied
- LOW = weak inference

━━━━━━━━━━━━━━━━━━━━━
FINAL CHECK:

- Can this reconstruct the video? If not → too vague
- Any vague phrases? → REMOVE
- Any invented ideas? → REMOVE
- Any duplication? → REMOVE
- Is priority.primaryDriver clearly dominant? If not → rewrite
`