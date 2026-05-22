// app/lib/prompts/evaluateSection.ts

import { buildArcContract } from "./scriptGenerator";
import { ENERGY_MAP, VOICE_PRESET } from "./scriptInputMapper";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

export function getArcPosition(section: string): string {
  return buildArcContract(section as any).split("\n")[0];
}

const VALID_SECTIONS = new Set([
  "hook",
  "crack",
  "expose",
  "validate",
  "framework",
  "close",
]);

function safeEnergyLookup(
  section: string,
  map: Record<string, string>,
  fallback: string
): string {
  if (!VALID_SECTIONS.has(section)) {
    console.warn(
      `[buildEvaluatePrompt] Unknown section key: "${section}" — using fallback`
    );
    return fallback;
  }

  return map[section] ?? fallback;
}

function formatList(items: any[], formatter: (item: any) => string): string {
  if (!Array.isArray(items) || items.length === 0) return "None";
  return items.map(formatter).join("\n");
}

// ─────────────────────────────────────────────────────────────
// SECTION QUALITY CONTRACT
// Keep compact. Section-specific standards only.
// ─────────────────────────────────────────────────────────────

function getSectionRetentionJob(section: string): string {
  switch (section) {
    case "hook":
      return `HOOK: create unresolved contradiction and curiosity.
Viewer should ask: "How can both things be true?"
Needs concrete proof: number, object, action, consequence, or comparison.
Do not explain the mechanism.
Do not punish a short contradiction frame if concrete proof arrives quickly.
Prefer a final image or contrast that points toward the video's core truth.`;

    case "crack":
      return `CRACK: break the viewer's current explanation.
Viewer should feel: "This is not the reason I thought it was."
Use behavior, numbers, payments, or concrete choices before interpretation.
Do not fully name the mechanism yet.
Flag if crack explains identity logic, baseline, system, or framework too cleanly.`;

    case "expose":
      return `EXPOSE: reveal the mechanism behind the problem.
Viewer should feel: "That's the loop I'm stuck in."
Name the mechanism only after concrete pressure is felt.
Prefer one clear cause/effect loop over repeated explanation.`;

    case "validate":
      return `VALIDATE: make the viewer feel accurately seen.
Viewer should feel: "This knows exactly what I do."
Use recognizable behavior, private habit, guilt, self-justification, or physical action.
Do not reassure before proving.`;

    case "framework":
      return `FRAMEWORK: give the viewer a new lens.
Viewer should feel: "I've been measuring this wrong."
Give a lens, not a full solution.
Prove the old lens fails before naming the new one.`;

    case "close":
      return `CLOSE: end on debate pressure or sharp unresolved pressure.
Do not summarize the lesson.
Do not wind down.
Prefer a final contrast, question, image, or unresolved cost.`;

    default:
      return `SECTION: preserve tension, specificity, and forward movement.
Flag only issues that weaken the section's job.`;
  }
}

// ─────────────────────────────────────────────────────────────
// BUILD EVALUATE PROMPT
// API 1 responsibility:
// - Detect line_edit or structure_edit
// - Add short user-facing decision summary
// - Do NOT generate rewriteOptions
// - Do NOT generate rewriteHint
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
    sectionContractFlags?: any[];
  };
}): string {
  const arcPosition = getArcPosition(section);

  const expectedVoice = safeEnergyLookup(
    section,
    VOICE_PRESET as Record<string, string>,
    "conspiratorial"
  );

  const expectedEnergy = safeEnergyLookup(
    section,
    ENERGY_MAP,
    "low — flat, no energy for meaning"
  );

  const sectionRetentionJob = getSectionRetentionJob(section);

  const motifWarning = formatList(narrativeState.overusedMotifs, (m) => {
    const sections = Array.isArray(m.appearances)
      ? m.appearances
          .map((a: any) => a?.section)
          .filter(Boolean)
          .join(", ")
      : "";

    const advice =
      typeof m.advice === "string" && m.advice.trim()
        ? ` Advice: ${m.advice.trim()}`
        : "";

    return sections
      ? `- "${m.motif}" seen in ${sections}.${advice}`
      : `- "${m.motif}" is overused.${advice}`;
  });

  const anchorWarning = formatList(narrativeState.overusedAnchors, (a) => {
    const sections = Array.isArray(a.sections)
      ? a.sections.filter(Boolean).join(", ")
      : "";

    const advice =
      typeof a.advice === "string" && a.advice.trim()
        ? ` Advice: ${a.advice.trim()}`
        : "";

    return sections
      ? `- "${a.detail}" in ${sections}.${advice}`
      : `- "${a.detail}" is overused.${advice}`;
  });

  const tensionWarning = formatList(narrativeState.tensionWarnings, (t) => {
    const advice =
      typeof t.advice === "string" && t.advice.trim()
        ? ` Advice: ${t.advice.trim()}`
        : "";

    return `- ${t.section}: ${t.issue}${advice}`;
  });

  const conclusiveWarning = formatList(narrativeState.conclusiveRisks, (c) => {
    const advice =
      typeof c.advice === "string" && c.advice.trim()
        ? ` Advice: ${c.advice.trim()}`
        : "";

    return `- ${c.section}: "${c.quote}" — ${c.issue}${advice}`;
  });

  const contractWarning = formatList(
    narrativeState.sectionContractFlags ?? [],
    (f) => {
      const quote =
        typeof f.quote === "string" && f.quote.trim()
          ? ` Quote: "${f.quote.trim()}".`
          : "";

      const advice =
        typeof f.advice === "string" && f.advice.trim()
          ? ` Advice: ${f.advice.trim()}`
          : "";

      return `- ${f.section}: ${f.issue}.${quote}${advice}`;
    }
  );

  return `
You are a high-precision structural editor for long-form personal finance voiceover scripts.

Analyze ONLY CURRENT section.
Return max 2 highest-impact issues.

━━━━━━━━━━━━━━━━━━━
SECTION CONTEXT
━━━━━━━━━━━━━━━━━━━
SECTION: ${section}
ARC POSITION: ${arcPosition}
EXPECTED ENERGY: ${expectedEnergy}
EXPECTED VOICE: ${expectedVoice}

SECTION QUALITY CONTRACT:
${sectionRetentionJob}

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
GLOBAL SIGNALS FROM FULL-SCRIPT EVALUATION
━━━━━━━━━━━━━━━━━━━
These signals are important cross-section evidence.

Check global signals before inventing unrelated local preferences.
If a global signal clearly applies to CURRENT, consider it strongly.

However, do not let a lower-impact global repetition issue override a higher-impact section-contract failure.
The goal is not to mechanically satisfy global signals.
The goal is to return the 1–2 issues that most weaken CURRENT's section job, retention, tension, or human feel.

Only skip a global signal if:
- CURRENT no longer contains the quoted problem
- the signal is clearly not confirmed by CURRENT
- a section-contract failure is more damaging than the global issue

Section contract flags:
${contractWarning}

Tension warnings:
${tensionWarning}

Conclusive risks:
${conclusiveWarning}

Overused anchors:
${anchorWarning}

Overused motifs:
${motifWarning}

━━━━━━━━━━━━━━━━━━━
EDIT DECISION RULES
━━━━━━━━━━━━━━━━━━━

1. PRIORITY ORDER
Choose the 1–2 highest-impact confirmed issues using this order:

A. Confirmed sectionContractFlags for CURRENT
B. A section-job failure that damages retention, tension, section role, or human feel
C. Premature mechanism, wrong-section explanation, or naming the idea too early
D. Confirmed tensionWarnings or conclusiveRisks for CURRENT
E. Confirmed overusedMotifs or overusedAnchors in CURRENT
F. Local repetition, compression, or phrasing issues

If two issues have similar impact, prefer the confirmed global signal.
If a local section-contract failure is clearly more damaging, prioritize it over a lower-impact global repetition signal.

2. SECTION-CONTRACT RULE
Check whether CURRENT fulfills its section quality contract.
Flag issues that materially weaken retention, tension, section role, or human feel.
Do not treat the section as successful just because it contains strong lines.

3. USER DECISION SUMMARY
Return 3 short user-facing fields before edits:

verdict:
- max 10 words
- say if the section is usable, needs one fix, or needs major revision

mainProblem:
- max 18 words
- name the single biggest issue in CURRENT
- explain the issue, not the solution

highestROIEdit:
- max 22 words
- tell the user what to fix first
- must align with the highest-impact edit when edits exist

If no strong issue:
- verdict = "Usable as is."
- mainProblem = ""
- highestROIEdit = ""

4. MINIMUM EDIT RULE
Choose the smallest useful quote that fixes the issue.
Do not cut a large block if changing one opening sentence, repeated anchor, or premature label would solve the problem.
Preserve long-form density.

5. GLOBAL SIGNAL TRIAGE
When a repeated motif or anchor appears in CURRENT:
- preserve it if this is clearly the strongest necessary use
- flag it if CURRENT repeats it without new pressure, new function, or forward movement
- prefer replacing the repeated local anchor over deleting the surrounding section

6. LONG-FORM STANDARD
Do not optimize for punchiness alone.
Do not replace a deeper lifestyle/status tradeoff with a simpler cash-gap punchline unless the tradeoff is unclear.
A short contradiction frame is allowed if concrete proof arrives quickly.

7. REPETITION CHECK
Flag setup/payoff repetition when an earlier setup line and final payoff use nearly identical wording and weaken the final line.
Prefer preserving the stronger payoff line and changing the earlier setup line.

8. ADJACENT FLOW CHECK
Flag if CURRENT opens by repeating the prior section's dominant concrete scene, object, number, action, comparison, or time marker without new function.
Do not require exact sentence repetition.
Do not flag if the repeated anchor is clearly reframed with new consequence, reversal, or escalation.

━━━━━━━━━━━━━━━━━━━
EDIT TYPES
━━━━━━━━━━━━━━━━━━━
Use "line_edit" for most issues.
Use "structure_edit" only when moving or cutting a block is clearly better than replacing a sentence.

For structure_edit:
- action must be "move" or "cut"
- use "cut" only when the quoted block is disposable or belongs entirely to another section
- do not use "cut" just because a useful block explains too much
- if a block contains useful pressure but names the idea too cleanly, use line_edit on the smallest offending sentence
- for "move", placement is required

━━━━━━━━━━━━━━━━━━━
QUOTE RULE
━━━━━━━━━━━━━━━━━━━
Every quote must be an exact substring from CURRENT.

For line_edit:
- quote must be directly replaceable
- choose the smallest complete sentence/clause that can be safely replaced
- do not quote a tiny phrase if the issue belongs to the full sentence

For structure_edit:
- quote must be the exact block to cut or move
- quote must be small enough to avoid unrelated surrounding lines
- anchorQuote is required only for action "move"
- anchorQuote must be a separate exact substring from CURRENT

━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━
Return ONLY valid JSON.
No markdown.
No explanation.
No text before or after JSON.
Do NOT include rewriteOptions.
Do NOT include rewriteHint.

{
  "verdict": "short user-facing verdict",
  "mainProblem": "single biggest problem, or empty string",
  "highestROIEdit": "what to fix first, or empty string",
  "edits": [
    {
      "type": "line_edit",
      "quote": "exact sentence or fragment from CURRENT",
      "issue": "specific failure type and reason",
      "impactLevel": "low | medium | high",
      "suggestion": "max 20 words, structural direction only"
    },
    {
      "type": "structure_edit",
      "action": "cut",
      "quote": "smallest complete block to remove from CURRENT",
      "issue": "specific retention or structure failure",
      "impactLevel": "low | medium | high",
      "suggestion": "max 24 words, clear structural direction"
    },
    {
      "type": "structure_edit",
      "action": "move",
      "quote": "smallest complete movable block from CURRENT",
      "issue": "specific retention or structure failure",
      "impactLevel": "high",
      "suggestion": "max 24 words, clear structural direction",
      "placement": {
        "move": "before | after",
        "anchorQuote": "exact sentence or fragment from CURRENT",
        "reason": "why this placement improves retention and flow",
        "bridgeSuggestion": "short bridge guidance if needed"
      }
    }
  ]
}

For line_edit:
- Do NOT include placement.
- Do NOT include action.

For structure_edit:
- MUST include action.
- If action is "cut", do NOT include placement.
- If action is "move", MUST include placement.
- Do NOT include rewriteOptions.
- Do NOT include rewriteHint.

If no strong issue:
{
  "verdict": "Usable as is.",
  "mainProblem": "",
  "highestROIEdit": "",
  "edits": []
}
`.trim();
}