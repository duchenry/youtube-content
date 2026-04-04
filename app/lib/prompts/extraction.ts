/**
 * Prompt Bước 1: TRÍCH XUẤT (Observer)
 * Chỉ QUAN SÁT — không đánh giá, không đề xuất chiến lược
 * INPUT_CONTRACT: giá trị mặc định cho các trường đầu vào
 * EXTRACTION_PROMPT: prompt gửi AI để phân tích script đối thủ
 */
export const INPUT_CONTRACT = {
  platform: "youtube-long",
  niche: "personal finance",
  targetViewer:
    "American men, age 20–45, low-to-mid income, emotionally vulnerable. " +
    "Feel stuck in life — career stagnation, financial stress, relationship frustration. " +
    "Mask pain with humor, sarcasm, or anger. Distrust 'guru' figures and polished advice. " +
    "Consume self-improvement content but rarely act — stuck in a loop of watching and feeling worse. " +
    "Respond to raw honesty, not motivation. Most active on Reddit in personal finance, " +
    "self-improvement, men's mental health, and venting/confession subs.",
  competitorScript: "",
  topComments: [],
  contentType: "discovery",
};

export const EXTRACTION_PROMPT = `
You are a content reverse-engineering expert. Observer mode ONLY.

Your SINGLE job: extract what ACTUALLY exists in this video.
Do NOT strategize. Do NOT suggest improvements. Do NOT generate new ideas.

Everything must be grounded in:
- the competitorScript
- the topComments (real human reactions — mine deeply)
- or clearly marked as INFERRED

━━━━━━━━━━━━━━━━━━━━━
CONTEXT:
- Platform: {{INPUT.platform}}
- Niche: {{INPUT.niche}}
- Target viewer: {{INPUT.targetViewer}}
- Content type: {{INPUT.contentType}}
- Script: {{INPUT.competitorScript}}
- Top comments: {{INPUT.topComments}}
━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON. No markdown. No explanation.

{
  "hook": {
    "raw": "Exact first 1-2 sentences from the script (verbatim or very close paraphrase)",
    "type": "pattern interrupt | fear | curiosity | authority | story",
    "mechanism": "Why THIS specific hook works psychologically — must reference specific WORDS or PHRASES from the hook",
    "confidence": "high | medium | low"
  },

  "hookQuality": {
    "strength": "weak | medium | strong — include brief reason in same string (e.g. 'strong — specific number + fear of loss creates urgency')",
    "risk": "What could fail if reused"
  },

  "angle": {
    "claim": "The core argument this video is making — one clear sentence",
    "supportingLogic": "1-2 concrete reasoning steps used in the video — must reference actual examples, statements, or sequences from the script",
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
      { "phase": "Setup", "goal": "", "tactic": "", "source": "" },
      { "phase": "Escalation", "goal": "", "tactic": "", "source": "" },
      { "phase": "Insight Drop", "goal": "", "tactic": "", "source": "" },
      { "phase": "Reinforcement", "goal": "", "tactic": "", "source": "" },
      { "phase": "Payoff / Close", "goal": "", "tactic": "", "source": "" }
    ],
    "retentionMoments": [
      {
        "moment": "Specific moment in the video",
        "whyItWorks": "Psychological reason",
        "pattern": "Named pattern",
        "isPrimary": true
      }
    ]
  },

  "audience": {
    "profile": "What kind of person is watching this — based on comments + content",
    "painMap": [
      {
        "pain": "Specific friction point",
        "realScenario": "Concrete situation — must describe a specific moment in their life, not abstract"
      },
      { "pain": "", "realScenario": "" },
      { "pain": "", "realScenario": "" }
    ],
    "commentPatterns": {
      "dominantSentiment": "The single strongest emotional current across all comments — not just positive/negative but the specific feeling (e.g. 'frustrated relief', 'angry agreement', 'defensive curiosity')",
      "repeatedPain": "What specific problem do 3+ comments independently point to? Quote or closely paraphrase the recurring theme",
      "emotionalTriggers": [
        {
          "quote": "Exact or near-exact quote from a comment (MAX 3 entries)",
          "emotion": "The underlying emotion — dig deeper: 'regret masked as humor', 'fear disguised as skepticism'",
          "insight": "What this reveals about the viewer's real situation that they wouldn't say directly"
        }
      ],
      "languageFingerprint": [
        "Exact slang, idioms, or phrasing patterns that keep appearing — these are the viewer's native vocabulary"
      ],
      "unspokenNeed": "What are commenters ASKING FOR without explicitly requesting it?",
      "misunderstanding": "What viewers are confused about or got wrong after watching — reveals gap between creator intent and viewer reception"
    }
  },

  "weakPoints": {
    "whereItLosesAttention": "Moment where video likely drops retention (if any)",
    "why": "Reason based on pacing / clarity / repetition"
  },

  "priority": {
    "primaryDriver": "ONE thing that most drives this video's performance",
    "why": "Why this matters more than others"
  }
}

━━━━━━━━━━━━━━━━━━━━━
HARD RULES (NON-NEGOTIABLE):

1. OBSERVER ONLY — extract and clarify, do NOT strategize or suggest
2. SOURCE GROUNDING — every field from script, comments, or marked inference
3. commentPatterns MUST reference actual comments — do not synthesize from script alone
4. OBSERVED vs INFERRED — if directly seen = fact, if deduced = tie to specific wording
5. NO GENERIC OUTPUT — if it could apply to any video = INVALID
6. emotionalTriggers: MAX 3 entries, each must trace to a real comment
7. If topComments < 3: mark dominantSentiment as "Insufficient data — need more comments"

━━━━━━━━━━━━━━━━━━━━━
DATA_SUFFICIENCY_RULE:
- Not enough signal → "Insufficient data from source"
- Better to return missing than fabricate

ANTI_GENERIC_FILTER:
- For each field ask: "Could this apply to any other random video?"
- If YES → rewrite with specific wording/moment/structure
- If still generic → "Too generic — insufficient signal in source"

CONFIDENCE: HIGH = directly observable | MEDIUM = strongly implied | LOW = weak inference

FINAL CHECK:
- Can this reconstruct the video? If not → too vague
- Any vague phrases? → REMOVE
- Any invented ideas? → REMOVE
- Is priority.primaryDriver clearly dominant? If not → rewrite
`;
