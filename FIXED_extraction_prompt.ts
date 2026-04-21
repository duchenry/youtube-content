export const INPUT_CONTRACT = {
  platform: "youtube-long",
  niche: "",
  targetViewer: "Men 18-35 in career transition, feeling stuck despite hard work", 
  contentType: "discovery"
};

export const EXTRACTION_PROMPT = `You are a YouTube structure analyst.

SCRIPT:
{{INPUT.competitorScript}}

COMMENTS:
{{INPUT.topComments}}

Output ONLY JSON with these EXACT fields:

{
  "hook": {
    "raw": "First 1-2 sentences EXACT quote",
    "type": "Curiosity|Pain|Question|Story",
    "mechanism": "Why it grabs attention",
    "confidence": "high|medium|low"
  },
  "hookQuality": {
    "strength": "strong|medium|weak + evidence quote",
    "risk": "Copy risks"
  },
  "angle": {
    "claim": "1 sentence claim",
    "supportingLogic": "3 proof types (list)",
    "hiddenAssumption": "Unstated premise",
    "confidence": "high|medium|low"
  },
  "coreTruth": {
    "insight": "Core truth/agreement point",
    "triggerMoment": "Peak delivery line",
    "confidence": "high|medium|low"
  },
  "attention": {
    "patternBreak": "Autopilot breaker",
    "escalation": ["3 beats quote lines"],
    "retentionDriver": {"description": "Why finish", "confidence": "high|medium|low"}
  },
  "proofMechanics": {
    "evidenceUsed": ["types quoted"],
    "transferablePattern": {"pattern": "stealable formula", "confidence": "high|medium|low"}
  },
  "structureDNA": {
    "phases": [{"phase": "Hook|Build|Pivot|Close", "goal": "", "tactic": "", "source": ""}],
    "retentionMoments": [{"moment": "", "whyItWorks": "", "pattern": "", "isPrimary": true}]
  },
  "audience": {
    "profile": "Behavior from comments",
    "painMap": [{"pain": "", "realScenario": ""}],
    "commentPatterns": {
      "dominantSentiment": "",
      "repeatedPain": "",
      "emotionalTriggers": [{"quote": "", "emotion": "", "insight": ""}],
      "languageFingerprint": [""],
      "unspokenNeed": "",
      "misunderstanding": ""
    }
  },
  "weakPoints": {"whereItLosesAttention": "", "why": ""},
  "priority": {"primaryDriver": "", "why": ""}
}

RULES: Quote script/comments or "INFERRED". JSON ONLY.
`;
