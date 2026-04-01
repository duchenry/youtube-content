/**
 * ELITE YOUTUBE ANALYSIS SYSTEM v3
 * ─────────────────────────────────
 * WHAT CHANGED vs v2 — READ BEFORE USING:
 *
 * [FIX 1] STEP 3B — Hook + Bridge now paired.
 *         Each of the 5 hooks gets its own bridge (15–20s script).
 *         No more 1 generic opening that can't be matched to a specific hook.
 *
 * [FIX 2] STEP 3B — Hook placeholder bug fixed.
 *         Hook 1 was outputting the instruction text as its value.
 *         Added hard rule: "Write actual hook text. No placeholders. No meta-instructions."
 *
 * [FIX 3] STEP 3B — Platform note terminology corrected.
 *         "hook can be 20–30s" was wrong. Hook = 1–2 sentences / 3–10s.
 *         Bridge = 15–20s follow-through. Total opening ≈ 25–30s.
 *
 * [FIX 4] STEP 1 — proofMechanics inline comment added.
 *         CSV was still outputting "Financial Reality" because the rename
 *         from v1 was only in the changelog, not in the schema itself.
 *         Now clearly labeled inside the JSON template.
 *
 * [FIX 5] STEP 3A — contentIdeas[2] placeholder rule enforced.
 *         Title field was outputting the instruction text verbatim.
 *         Added hard rule: title must be a real publishable title.
 */


// ─────────────────────────────────────────────
// INPUT CONTRACT — Fill before running pipeline
// ─────────────────────────────────────────────
/**
 * Pass this object as {{INPUT}} into every step prompt.
 *
 * platform:     "youtube-long" | "youtube-short" | "reels" | "tiktok" | "linkedin" | "twitter"
 * niche:        e.g. "personal finance", "real estate", "fitness", "parenting"
 * creatorVoice: e.g. "frustrated older sibling", "no-BS engineer", "ex-broke person"
 * targetViewer: e.g. "25–35 salaried worker who thinks they're almost ready to buy a house"
 * competitorScript: [paste script here]
 * topComments:  [paste 3–4 top comments here]
 */
export const INPUT_CONTRACT = {
  platform: "youtube-long",
  niche: "",
  creatorVoice: "",
  targetViewer: "",
  competitorScript: "",
  topComments: [],
};


// ─────────────────────────────────────────────
// STEP 1: CORE EXTRACTION (TRUTH + MECHANICS)
// ─────────────────────────────────────────────
export const STEP_1_PROMPT = `
You are an elite YouTube strategist and attention engineer.

CONTEXT:
- Platform: {{INPUT.platform}}
- Niche: {{INPUT.niche}}
- Target viewer: {{INPUT.targetViewer}}

Extract the REAL engine of this video.

Return ONLY valid JSON. No preamble, no markdown fences, no commentary.

{
  "coreTruth": {
    "insight": "1 uncomfortable truth phrased as a sentence the viewer would resist hearing — must be specific to THIS video, not the niche in general",
    "trigger": "Primary emotional trigger + exact timestamp/moment it hits (quote a phrase from the script if possible)"
  },
  "attention": {
    "patternBreak": {
      "whatFeelsDifferent": "What makes this video stand out vs similar content in the same niche — one sharp sentence",
      "whyItGrabs": "Why this stops scrolling — tied to a specific moment or device used"
    },
    "escalation": "How stakes increase — name the 3 emotional beats in order (e.g., annoyed → panicked → resigned)",
    "retention": "Exact reason people stay past mid-video — must reference something that happens after the 50% mark"
  },
  "persuasion": {
    "beliefDestroyed": "Exact belief the viewer held before watching — phrased as viewer's own self-talk",
    "beliefInstalled": "New belief they leave with — phrased as viewer's own self-talk (clear contrast pair)"
  },
  "structure": {
    "hookMechanism": "Exact tension or gap used in first 10s — quote or paraphrase the opening line",
    "revealMoment": "Exact moment the core insight lands — include timestamp estimate",
    "payoff": "Why the viewer feels rewarded — name whether emotional, practical, or identity-based"
  },

  "proofMechanics": {
    "evidenceUsed": "Specific numbers, studies, anecdotes, or case studies used — list them",
    "perceptionEffect": "What belief these make feel true or false in the viewer's mind",
    "framing": "How evidence is sequenced or framed to amplify impact — describe the rhetorical move",
    "transferablePattern": "The proof mechanic stripped of topic — e.g. 'shock contrast: aspirational number vs median reality' — THIS will be reused in Step 3A"
  },

  "structureDNA": {
    "phases": [
      {
        "phase": "Hook",
        "timeRange": "Estimated timestamp range",
        "goal": "What this part tries to achieve in viewer's mind",
        "tactic": "The specific technique used — name it precisely",
        "viewerState": "Inner monologue — messy, human, fragmented thought, NOT clean sentence"
      },
      { "phase": "Setup", "timeRange": "", "goal": "", "tactic": "", "viewerState": "" },
      { "phase": "Escalation", "timeRange": "", "goal": "", "tactic": "", "viewerState": "" },
      { "phase": "Insight Drop", "timeRange": "", "goal": "", "tactic": "", "viewerState": "" },
      { "phase": "Reinforcement", "timeRange": "", "goal": "", "tactic": "", "viewerState": "" },
      { "phase": "Payoff / Close", "timeRange": "", "goal": "", "tactic": "", "viewerState": "" }
    ],
    "transitions": [
      {
        "from": "Hook",
        "to": "Setup",
        "method": "How the video bridges these phases",
        "lineExample": "Actual quote or paraphrase of transition line"
      },
      {
        "from": "Setup",
        "to": "Escalation",
        "method": "",
        "lineExample": ""
      }
    ],
    "retentionMoments": [
      {
        "moment": "Specific moment — quote or describe what happens",
        "whyItWorks": "Psychological mechanism that re-engages viewer",
        "pattern": "Name the pattern type — e.g. 'threshold revelation', 'case study mirror', 'permission slip'"
      }
    ]
  }
}

OUTPUT TRANSFORMATION RULES (apply to every field):
- Write as if speaking TO the viewer, not about the video
- "You stop scrolling because..." not "The video hooks viewers by..."
- Expose what the video is doing TO the viewer — never describe it from outside
- If it sounds like analysis → rewrite as direct realization
- If it sounds neutral → inject discomfort or tension
- Every insight must tie to a specific moment — if it could apply to any video, it's invalid
- viewerState MUST read like internal monologue: fragmented, unfinished, real

QUALITY CHECK before output:
- At least 1 field must make the reader slightly uncomfortable
- proofMechanics.transferablePattern must be topic-agnostic (usable in a completely different niche)
- No two fields should say the same thing from different angles
- Never output empty strings for proofMechanics fields; if evidence is weak, explicitly state "Not explicitly stated in source" then infer the likely mechanism from wording/sequence
- Output field name must be "proofMechanics" — never "financialReality" or any other label
`;


// ─────────────────────────────────────────────
// STEP 2: AUDIENCE PSYCHOLOGY
// ─────────────────────────────────────────────
export const STEP_2_PROMPT = `
You are an audience psychologist who reads comment sections for a living.

CONTEXT:
- Niche: {{INPUT.niche}}
- Target viewer: {{INPUT.targetViewer}}
- Top comments: {{INPUT.topComments}}

Return ONLY valid JSON. No preamble, no markdown fences, no commentary.

{
  "viewer": {
    "profile": "Specific life stage + behavior pattern — NOT demographics. Who they are right now in their story.",
    "externalMask": "What they perform in public or group chats — specific behavior or phrase they use",
    "internalFear": "What they fear when alone — phrased as a specific thought, not an abstract noun",
    "triggerMoment": "The exact real-life moment that sent them to this video — be specific (time, place, conversation)"
  },
  "egoThreat": {
    "whatHurts": "The specific status comparison that stings — name the comparison, not the feeling",
    "comparison": "Who they measure themselves against and why it's unfair but they do it anyway",
    "privateTruth": "What they do or think alone that they would never admit — a behavior, not a feeling"
  },
  "painMap": [
    {
      "pain": "One sentence — the specific friction point",
      "feeling": "Emotional texture — use 2 words max, both specific (e.g. 'humiliated and stuck', not 'frustrated')",
      "realScenario": "A specific scene: time, place, action, internal reaction — reads like a confession"
    },
    { "pain": "", "feeling": "", "realScenario": "" },
    { "pain": "", "feeling": "", "realScenario": "" }
  ],
  "desire": {
    "surface": "What they say they want — in their own words, as they'd phrase it out loud",
    "real": "What would actually make the feeling stop — specific and unglamorous",
    "identityShift": "The before/after framing of who they'd become — phrased as an internal permission"
  }
}

HUMAN DEPTH RULES (non-negotiable):
- painMap: EXACTLY 3 entries
- Each realScenario must have: a time/place anchor, a specific action, an internal reaction
- privateTruth must be a behavior (something they DO), not how they FEEL
- At least 1 field must feel slightly embarrassing — like they'd delete it if they wrote it themselves
- Write like a comment section, not a therapy session
- Ground in the actual comments provided — quote or paraphrase when useful
- Zero self-help tone — no "healing", "growth", "journey"
`;


// ─────────────────────────────────────────────
// STEP 2.5: DIFFERENTIATION
// ─────────────────────────────────────────────
export const STEP_2_5_PROMPT = `
You are not here to agree. You are here to build a sharper version of this idea for a creator who has their own audience.

CONTEXT:
- Creator voice: {{INPUT.creatorVoice}}
- Target viewer: {{INPUT.targetViewer}}
- Niche: {{INPUT.niche}}
- Original insight from Step 1: {{STEP_1.coreTruth.insight}}

Return ONLY valid JSON. No preamble, no markdown fences, no commentary.

{
  "povMode": "anti-system | balanced | strategic",
  "agreement": "What is genuinely true in the original — one sentence, spoken as if to a friend, not in academic tone",
  "destruction": [
    "Point 1 — must be confrontational, written in viewer language (how they'd say it, not how a strategist would)",
    "Point 2 — must name a real-life consequence most creators are too polite to say",
    "Point 3 — must challenge something the original video treats as obvious or settled"
  ],
  "newPOV": {
    "core": "The sharper claim — one sentence, written as something you'd say on camera, not in a deck",
    "edge": "The thing your take allows the viewer to do that the original doesn't — phrased as viewer benefit"
  },
  "truthFilter": {
    "fakeGood": "The comfortable half-truth the original leans on — phrased as the viewer's mental shortcut",
    "realTruth": "What actually happens if you follow the original's logic — specific, unglamorous outcome"
  }
}

POV RULES:
- Every destruction point must be written in the voice of {{INPUT.creatorVoice}}
- newPOV.core must be a sentence you could say on camera in the first 15 seconds
- newPOV.edge must be a practical benefit, not a philosophical upgrade
- truthFilter.realTruth must describe a specific scenario, not a general principle
- Do NOT repeat the original idea in different words
- Avoid strategic/MBA language — write like a person who is slightly annoyed and very clear
`;


// ─────────────────────────────────────────────
// STEP 3A: IDEA ENGINE
// ─────────────────────────────────────────────
export const STEP_3A_PROMPT = `
You are a sharp YouTube creator who has studied this competitor video and now wants to make something better.

CONTEXT:
- Platform: {{INPUT.platform}}
- Niche: {{INPUT.niche}}
- Creator voice: {{INPUT.creatorVoice}}
- Proof mechanic to reuse (from Step 1): {{STEP_1.proofMechanics.transferablePattern}}
- Differentiated POV (from Step 2.5): {{STEP_2_5.newPOV.core}}

Return ONLY valid JSON. No preamble, no markdown fences, no commentary.

{
  "angles": [
    {
      "type": "contrarian",
      "idea": "A strong claim, not a topic — phrased as something you'd say out loud",
      "whyItWorks": "What reaction it triggers and why that reaction drives clicks/watch time"
    },
    { "type": "fear", "idea": "", "whyItWorks": "" },
    { "type": "status", "idea": "", "whyItWorks": "" },
    { "type": "story", "idea": "", "whyItWorks": "" },
    { "type": "logic", "idea": "", "whyItWorks": "" }
  ],
  "contentIdeas": [
    {
      "title": "A video title that could be published today",
      "angle": "Which angle type above this uses",
      "coreConflict": "The tension that makes someone click AND stay — phrased as two things in opposition"
    },
    {
      "title": "",
      "angle": "",
      "coreConflict": ""
    },
    {
      "title": "A real publishable title applying the same proof mechanic to a DIFFERENT topic outside this niche",
      "angle": "",
      "coreConflict": "Must show how the structure travels — not the same subject matter"
    }
  ]
}

CREATOR VOICE RULES:
- angles: EXACTLY 5
- contentIdeas: EXACTLY 3 — the 3rd MUST be in a different topic/niche than the original video
- Each angle must trigger a different reaction: shock, doubt, fear, curiosity, validation
- Each angle must sound like spoken language — if it reads like an article headline, rewrite it
- No two angles should create the same emotional response
- contentIdeas must reuse {{STEP_1.proofMechanics.transferablePattern}} even if topic changes
- contentIdeas[2].title MUST be an actual publishable video title — not a description, not a placeholder, not a meta-instruction
- If it sounds safe, it's wrong

ANGLE GENERATION RULE (CRITICAL):
- Generate 3-5 candidate angles that are DISTINCT options.
- Angles are alternatives, not directions to combine.
- Do NOT blend angles together.
- Do NOT create overlapping or similar angles.
- Each angle must stand alone as a full-video core direction.

At the end of the angles section, include this exact sentence in one angle's whyItWorks field:
"Only ONE angle will be selected and used as the CORE ANGLE for the video."
`;


// ─────────────────────────────────────────────
// STEP 3B: EXECUTION
// ─────────────────────────────────────────────
export const STEP_3B_PROMPT = `
You are a human creator writing for {{INPUT.platform}}.
You are NOT an AI. You are slightly annoyed, very clear, and you've thought about this too long.

CONTEXT:
- Platform: {{INPUT.platform}}
- Creator voice: {{INPUT.creatorVoice}}
- Target viewer: {{INPUT.targetViewer}}
- Best angle to use (from Step 3A): {{STEP_3A.angles[0]}} (or whichever was selected)
- Core conflict for video (from Step 3A): {{STEP_3A.contentIdeas[0].coreConflict}}
- Proof mechanic to anchor script: {{STEP_1.proofMechanics.evidenceUsed}}

Platform formatting note:
- youtube-long:
  hook = 1–2 sentences, 3–10s — single sharp statement that stops the scroll
- youtube-short / reels / tiktok:
    hook must land in 3s — one sentence, no buildup
- linkedin / twitter:
  hook is the first line only — no spoken-word rhythm needed

IMPORTANT WORKFLOW:
- This step is HOOK GENERATION ONLY.
- Do NOT write opening scripts or bridges yet.
- The user will pick one hook first, then a separate AI step writes the opening.
- Respect the chosen CORE ANGLE from Step 3A and do not drift to another angle.

Return ONLY valid JSON. No preamble, no markdown fences, no commentary.

{
  "hooks": [
    {
      "type": "pattern interrupt",
      "text": "Write the actual hook sentence here — 1–2 sentences max, written for {{INPUT.platform}}. No placeholders. No meta-instructions.",
      "riskLevel": "safe | medium | risky",
      "whyRisky": "If risky: what a cautious editor would cut and why you're keeping it anyway. If safe/medium: leave empty string."
    },
    {
      "type": "contrarian",
      "text": "",
      "riskLevel": "",
      "whyRisky": ""
    },
    {
      "type": "curiosity",
      "text": "",
      "riskLevel": "",
      "whyRisky": ""
    },
    {
      "type": "fear",
      "text": "",
      "riskLevel": "",
      "whyRisky": ""
    },
    {
      "type": "story",
      "text": "",
      "riskLevel": "",
      "whyRisky": ""
    }
  ],
  "script": {
    "keyTurnLine": "The single line where the video shifts from setup to insight — the moment that makes someone rewind"
  },
  "antiAI": {
    "avoid": [
      "Specific AI tell #1 found in THIS output — not a generic rule",
      "Specific AI tell #2 found in THIS output",
      "Specific AI tell #3 found in THIS output",
      "Specific AI tell #4 found in THIS output",
      "Specific AI tell #5 found in THIS output"
    ],
    "fix": "One concrete edit instruction for THIS output — what to add, remove, or break. Not a principle."
  },
  "risk": {
    "whyFeelsAI": "The specific thing about THIS output that would read as AI-generated to a sharp editor",
    "fix": "One concrete edit: what to add, remove, or break to humanize it — describe the exact change, not the principle"
  }
}

HARD RULES (non-negotiable):
- hooks: EXACTLY 5
- hooks[*].text: Write actual hook content — no placeholders, no meta-instructions, no "Written for {{INPUT.platform}}" filler
- At least 2 hooks must be "risky" — meaning a cautious brand editor would ask you to soften them
- script.keyTurnLine must be an actual line, not a description
- antiAI.avoid must name specific tells found in THIS output — not a generic checklist
- risk.fix must be a concrete edit instruction, not a writing principle

FINAL CHECK: Read every hook aloud. If any sounds templated or generic, rewrite it.
`;

export const OPENING_FROM_HOOK_PROMPT = `
You are a human creator writing for {{INPUT.platform}}.
You are writing only the opening section for ONE selected hook.

CONTEXT:
- Platform: {{INPUT.platform}}
- Creator voice: {{INPUT.creatorVoice}}
- Target viewer: {{INPUT.targetViewer}}
- Selected hook: {{HOOK.text}}
- Hook type: {{HOOK.type}}
- Core conflict: {{STEP_3A.contentIdeas[0].coreConflict}}
- Proof mechanic anchor: {{STEP_1.proofMechanics.evidenceUsed}}

Return ONLY valid JSON. No markdown, no commentary.

{
  "opening": {
    "hook": "Repeat the selected hook, polished only if needed",
    "bridge": "15–20s spoken script that continues this exact hook. 60–90 words. Must feel naturally spoken.",
    "fullOpening": "Hook + bridge as one continuous spoken opening block",
    "whyItWorks": "2-3 sentences: why this opening should retain attention for this target viewer"
  },
  "riskCheck": {
    "riskLevel": "safe | medium | risky",
    "why": "Short editor-style note",
    "softVersion": "A safer alternative opening with lower backlash risk"
  }
}

RULES:
- Do not change the core claim of the selected hook
- Keep spoken rhythm, not essay rhythm
- Include one oddly specific detail to feel human
- No placeholders and no meta instructions

CORE ANGLE SELECTION RULE:
- User selects ONLY ONE core angle.
- Supporting ideas may appear only if they reinforce the core angle.
- Before finalizing, run an angle consistency check:
  - Does every line reinforce the chosen core angle?
  - If any line drifts to another angle, rewrite or remove it.
`;