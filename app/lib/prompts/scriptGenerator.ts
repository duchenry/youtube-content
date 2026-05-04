// ─────────────────────────────────────────────────────────────
// GLOBAL RULES
// ─────────────────────────────────────────────────────────────

export const GLOBAL_SCRIPT_RULES = `
GLOBAL RULES (apply to ALL sections):
- No conclusion. Never wrap anything up.
- Physical details over abstraction (numbers, objects, sounds).
- Imperfect grammar is GOOD. Natural hesitation allowed.
- No generic language. Every line must feel lived.
- Stay inside same psychological frame.
- Avoid clean symmetry or polished phrasing.
- If a sentence feels like writing → break it.
`.trim();


// ─────────────────────────────────────────────────────────────
// VOICE
// ─────────────────────────────────────────────────────────────

export function buildVoice(
  characterProse: string,
  preset: "resigned" | "building" | "raw"
): string {
  const toneMap = {
    resigned: "Resigned. Mid-thought. Tired of explaining it.",
    building: "Building slowly. Not arriving, just getting closer.",
    raw: "Raw. Started talking before ready.",
  };

  return `
VOICE:
${toneMap[preset]}

CHARACTER:
${characterProse}

CHECK:
- Opening line mid-thought?
- Any sentence feels too clean?
- Ending unresolved?
`.trim();
}


// ─────────────────────────────────────────────────────────────
// CHARACTER SEED
// ─────────────────────────────────────────────────────────────

export const CHARACTER_SEED_PROMPT = `
Build a SPECIFIC person from this data:

BELIEF: {{viewerCoreBelief}}
SCENARIO: {{realScenario}}
LANGUAGE: {{languageFingerprint}}
LOOP: {{behaviorLoop}}
COST: {{behaviorCost}}
PRESSURE: {{identityLanguage}}
FEAR: {{fearIfNotAct}}

Write 300–350 words flowing prose.

Must include:
- 1 memory with physical detail (object/number/sound)
- 2–3 anxiety habits (physical behavior)
- exact avoidance loop
- 2–3 internal sentences (natural voice, not explanation)
- 1 “almost moment” (something almost happened, stopped small)

CRITICAL:
Every detail must feel uniquely lived, not generalizable.

OUTPUT JSON:
{
  "prose": "...",
  "anchors": {
    "physicalDetail": "...",
    "habitLoop": "...",
    "almostMoment": "..."
  }
}
`;


// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────

export const HOOK_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{voice}}

Pain: {{rawPain}}
Contradiction: {{contradiction}}
False belief: {{falseBelief}}

Start mid-thought (1–6 words).
Insert 1 physical detail interruption.
Imply something is wrong, never explain it.

180–220 words.
`;


// ─────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────

export const SETUP_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{voice}}

Continue: "{{lastLines}}"

Scenario: {{scenario}}
Loop: {{behaviorLoop}}
Cost: {{behaviorCost}}
Constraint: {{constraint}}

Include 1 derail using physical detail.

350–450 words.
`;


// ─────────────────────────────────────────────────────────────
// CONTRADICTION
// ─────────────────────────────────────────────────────────────

export const CONTRADICTION_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{voice}}

Continue: "{{lastLines}}"

A: {{optionAAction}} → {{optionACost}}
B: {{optionBAction}} → {{optionBCost}}

Trap: {{noWinAsymmetry}}
Fear: {{fearIfNotAct}}

Must include:
- self-interruption
- internal contradiction
- 1 uncomfortable truth line (not ending line)

450–600 words.
`;


// ─────────────────────────────────────────────────────────────
// REFRAME
// ─────────────────────────────────────────────────────────────

export const REFRAME_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{voice}}

Continue: "{{lastLines}}"

Belief: {{falseBelief}}
Crack: {{crackMoment}}
Truth: {{hiddenTruth}}

Show both sides. No resolution.

260–340 words.
`;


// ─────────────────────────────────────────────────────────────
// SOLUTION
// ─────────────────────────────────────────────────────────────

export const SOLUTION_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{voice}}

Continue: "{{lastLines}}"

Need: {{unspokenNeed}}
Loop: {{behaviorLoop}}

Give 2–3 imperfect suggestions:
- unsure naming
- low confidence framing
- reason you avoid it

320–420 words.
`;


// ─────────────────────────────────────────────────────────────
// CLOSE
// ─────────────────────────────────────────────────────────────

export const CLOSE_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{voice}}

Continue: "{{lastLines}}"

Core: {{coreTruth}}
Belief: {{coreBelief}}
Echo: {{almostMoment}}

No new idea.
No resolution.
End on weakest sentence.

150–200 words.
`;


// ─────────────────────────────────────────────────────────────
// ORDER
// ─────────────────────────────────────────────────────────────

export const SECTION_ORDER = [
  "hook",
  "setup",
  "contradiction",
  "reframe",
  "solution",
  "close",
] as const;