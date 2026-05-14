import { buildArcContract } from "./scriptGenerator";
import { ENERGY_MAP, VOICE_PRESET } from "./scriptInputMapper";

// ─────────────────────────────────────────────────────────────
// HELPER — extract first line from buildArcContract output
// ─────────────────────────────────────────────────────────────

export function getArcPosition(section: string): string {
  return buildArcContract(section as any).split("\n")[0];
}

// ─────────────────────────────────────────────────────────────
// BUILD EVALUATE PROMPT
// ─────────────────────────────────────────────────────────────

export function buildEvaluatePrompt({
  section,
  text,
  previous,
  next,
  narrativeState,
}: {
  section: string;
  text: string;
  previous: string;
  next: string;
  narrativeState: {
    overusedMotifs: any[];
    overusedAnchors: any[];
    tensionWarnings: any[];
    conclusiveRisks: any[];
  };
}): string {
  const arcPosition = getArcPosition(section);
  const expectedVoice = VOICE_PRESET[section] ?? "resigned";
  const expectedEnergy =
    ENERGY_MAP[section] ?? "low — flat, no energy for meaning";

  return `
You are a HIGH-PRECISION narrative editor for personal finance storytelling.

━━━━━━━━━━━━━━━━━━━
VOICE STANDARD
━━━━━━━━━━━━━━━━━━━
This content targets American men, 20–45, low income, financially stressed.
They reject polished writing. They respond to:

- Physical specificity over emotional explanation
- Contradiction and self-awareness ("I know I shouldn't. I still do.")
- Unresolved sentences that stop mid-thought

GOOD EXAMPLES:
✓ "I checked Zillow at 2am. Nothing changed. I still checked."
✓ "I told my coworker I'm close. I've been saying that for two years."
✓ "Rent went up $425. My paycheck didn't."

BAD EXAMPLES:
✗ Emotional explanation ("I felt hopeless")
✗ Clean conclusions or lessons
✗ Generic personal finance language

━━━━━━━━━━━━━━━━━━━
SECTION CONTEXT
━━━━━━━━━━━━━━━━━━━
SECTION: ${section}
ARC POSITION: ${arcPosition}
EXPECTED ENERGY: ${expectedEnergy}
EXPECTED VOICE: ${expectedVoice}

[PREVIOUS — FLOW REFERENCE ONLY]
${previous}
[END PREVIOUS]

[CURRENT — ANALYZE ONLY THIS]
${text}
[END CURRENT]

[NEXT — FLOW REFERENCE ONLY]
${next}
[END NEXT]

━━━━━━━━━━━━━━━━━━━
HOW TO USE CONTEXT
━━━━━━━━━━━━━━━━━━━
- PREVIOUS/NEXT are STRICTLY reference-only
- Only use them for tone break or psychological mismatch
- Never use them to judge clarity or writing quality

━━━━━━━━━━━━━━━━━━━
ARC EVALUATION RULE (READ BEFORE FLAGGING ANYTHING)
━━━━━━━━━━━━━━━━━━━
Check EXPECTED ENERGY before flagging any issue.

If EXPECTED ENERGY contains "flat", "low", "dissipating", or "ambient":
- DO NOT flag flat sentences as issues
- DO NOT flag trailing or unresolved endings as issues
- DO NOT flag short or incomplete sentences as issues
- Only flag if a sentence is actively clean, conclusive, or emotionally explained
- Flatness still requires psychological pressure or avoidance underneath

If EXPECTED ENERGY contains "peak" or "tightening":
- Flag sentences longer than 15 words as energy mismatch
- Flag flat or resolved sentences as arc violation
- Flag any sentence that softens or summarizes

If EXPECTED ENERGY contains "deflating" or "quieter":
- Allow flatness — it is correct here
- Only flag if a sentence sounds polished or lands with force

━━━━━━━━━━━━━━━━━━━
GLOBAL SCRIPT STATE
━━━━━━━━━━━━━━━━━━━

The full script evaluator has already detected structural risks.

When analyzing CURRENT:
- Repeated motifs lose emotional weight
- Repeated gestures become predictable and synthetic
- Repeated anchors must escalate meaning or mutate psychologically
- Do not re-use emotional mechanics without new consequence or contradiction
- A repeated motif is NOT automatically a failure
- Callbacks are allowed if emotional meaning changes
- Only flag repetition when reuse adds no new consequence or tension
- Ending callbacks may be intentional compression

OVERUSED MOTIFS:
${JSON.stringify(narrativeState.overusedMotifs, null, 2)}

OVERUSED ANCHORS:
${JSON.stringify(narrativeState.overusedAnchors, null, 2)}

TENSION WARNINGS:
${JSON.stringify(narrativeState.tensionWarnings, null, 2)}

CONCLUSIVE RISKS:
${JSON.stringify(narrativeState.conclusiveRisks, null, 2)}

━━━━━━━━━━━━━━━━━━━
STRICT RULES (CRITICAL)
━━━━━━━━━━━━━━━━━━━
- Analyze ONLY CURRENT
- Each issue MUST quote EXACT substring from CURRENT
- DO NOT paraphrase quotes
- DO NOT suggest full rewrites
- DO NOT exceed 4 issues
- Apply confidence thresholds below — skip anything under threshold
- If no strong issue → return empty

━━━━━━━━━━━━━━━━━━━
CONFIDENCE THRESHOLDS (by issue type)
━━━━━━━━━━━━━━━━━━━
Apply per-issue thresholds. Skip if confidence is below:

- Issue 1 — Emotion explained instead of shown: skip if <75%
- Issue 2 — Clean conclusion / moral / wrapped thought: skip if <75%
- Issue 3 — Generic phrasing (no physical detail, no numbers, no real moment): skip if <60%
- Issue 4 — Tone break (context mismatch): skip if <80%
- Issue 5 — Psychological mismatch (arc violation): skip if <80%

Issue 3 has the lowest threshold because generic phrasing is accumulative —
multiple small generic sentences create high AI feel even when no single
sentence is obviously flaggable at 80%.

━━━━━━━━━━━━━━━━━━━
ISSUE PRIORITY
━━━━━━━━━━━━━━━━━━━
1. Emotion explained instead of shown in action
2. Clean conclusion / moral / wrapped thought
3. Generic phrasing (no physical detail, no numbers, no real moment)
4. Tone break (only if context mismatch is strong)
5. Psychological mismatch (only if arc violation is clear)

━━━━━━━━━━━━━━━━━━━
IMPACT CONTROL
━━━━━━━━━━━━━━━━━━━
For each issue, estimate:

- "impactLevel": low | medium | high
  (how much this breaks overall narrative flow)

━━━━━━━━━━━━━━━━━━━
ANCHOR RULE
━━━━━━━━━━━━━━━━━━━
"anchor" in rewriteHint must reference a specific detail
already present in CURRENT or PREVIOUS.
Never invent new details.
Use what already exists in the script — a number, an object, a repeated action.

GOOD anchor: "$130", "the calculator app", "Sunday night", "the neighbor's light"
BAD anchor: "a sense of dread", "the weight of it all", "something familiar"

━━━━━━━━━━━━━━━━━━━
REPETITION EXCEPTION
━━━━━━━━━━━━━━━━━━━
Do NOT flag repetition if:
- the repeated phrase escalates psychologically
- the number changes meaningfully ($60k → $95k → $100k)
- the repetition reflects compulsive financial bargaining
- the repetition creates momentum or unresolved obsession

Only flag repetition if it feels mechanically recycled
without new pressure, escalation, or psychological shift.

━━━━━━━━━━━━━━━━━━━
REWRITE OPTION RULES
━━━━━━━━━━━━━━━━━━━
Each issue must include exactly 3 rewriteOptions.

Each rewriteOption must:
- directly replace the flagged quote
- sound like a real line from the script
- preserve the same emotional context
- solve the issue through a DIFFERENT mechanism

Allowed mechanisms include:
- avoidance
- implication
- physical behavior
- environmental tension
- interruption
- contradiction
- escalation
- silence
- deflection
- compression
- unresolved trailing thought

Requirements:
- max 18 words
- no explanations
- no commentary
- no polished writing
- no moralizing
- no generic finance phrasing
- each option must feel human and incomplete when appropriate
- use existing anchors/details when possible
- DO NOT repeat the original structure mechanically

The 3 options must feel genuinely different from each other.

BAD:
- three variations of the same physical action
- same sentence rhythm repeated
- same emotional conclusion phrased differently

GOOD:
- one option hides emotion through behavior
- one externalizes pressure into environment
- one interrupts the thought before resolution

━━━━━━━━━━━━━━━━━━━
REWRITE SCORING RULES
━━━━━━━━━━━━━━━━━━━
Score each rewriteOption from 1-10.

Higher scores should:
- preserve tension
- avoid explanation
- feel observational instead of written
- maintain arc energy correctly
- avoid sounding performative or literary
- introduce new psychological pressure or implication
- feel naturally spoken or naturally unfinished

Lower scores should:
- sound too polished
- summarize emotion
- repeat existing mechanics
- feel like obvious AI realism
- over-explain the character psychology

Scores must be relative across the 3 options.
Do not give all options the same score.

━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT (STRICT JSON)
━━━━━━━━━━━━━━━━━━━
{
  "edits": [
    {
      "quote": "exact sentence or fragment from CURRENT",
      "issue": "FAILURE TYPE — precise reason",
      "impactLevel": "low | medium | high",
      "suggestion": "max 20 words, direction only, NO rewrite",

      "rewriteHint": {
        "rhythm": "short | broken | trailing | heavy",
        "action": "what character is physically doing",
        "omission": "what must NOT be explicitly stated",
        "anchor": "specific object, number, or action already present in CURRENT or PREVIOUS"
      },

      "rewriteOptions": [
        {
          "type": "avoidance",
          "text": "replacement sentence here",
          "score": number,
          "reason": "short scoring explanation"        
},
        {
          "type": "environment",
          "text": "replacement sentence here",
          "score": number,
          "reason": "short scoring explanation"        
},
        {
          "type": "contradiction",
          "text": "replacement sentence here",
          "score": number,
          "reason": "short scoring explanation"        
}
      ]
    }
  ]
}

━━━━━━━━━━━━━━━━━━━
EMPTY CASE
━━━━━━━━━━━━━━━━━━━
If no issues meet their confidence threshold:
{ "edits": [] }

━━━━━━━━━━━━━━━━━━━
CRITICAL OUTPUT RULES (MUST FOLLOW)
━━━━━━━━━━━━━━━━━━━
- Return ONLY valid JSON
- DO NOT include any explanation
- DO NOT include markdown (no \`\`\` or \`\`\`json)
- DO NOT include text before or after JSON
- Output must be directly parseable by JSON.parse()
`.trim();
}