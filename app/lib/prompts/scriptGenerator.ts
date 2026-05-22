// ─────────────────────────────────────────────────────────────
// IDENTITY LOCK
// ─────────────────────────────────────────────────────────────

export function buildIdentityLock(facts: {
  age: number | string;
  income: string;
  job: string;
  livingSituation: string;
  carYear?: string;
  city?: string;
  yearsAtJob?: number;
}): string {
  return `
VIEWER PROFILE (non-negotiable — never imply a different situation):
- Age: ${facts.age}
- Income / situation: ${facts.income}
- Job: ${facts.job}
- Living situation: ${facts.livingSituation}
${facts.carYear ? `- Car: ${facts.carYear}` : ""}
${facts.city ? `- City: ${facts.city}` : ""}
${facts.yearsAtJob ? `- Years at job: ${facts.yearsAtJob}` : ""}

Every "you" in this script refers to this exact person.
Do not round, approximate, or upgrade their situation.
If a sentence implies more income, more stability, or a different life — rewrite it.
`.trim();
}


// ─────────────────────────────────────────────────────────────
// ARC CONTRACT — Arc 3 (Conspiracy Arc)
// ─────────────────────────────────────────────────────────────

export function buildArcContract(
  section: "hook" | "crack" | "expose" | "validate" | "framework" | "close"
): string {
  const arcMap: Record<string, string> = {
    hook: `ARC POSITION: Hook — tension level 8/10.
Viewer has just arrived. Hit them with 1 fact conventional wisdom cannot explain.
Do NOT explain it. Do NOT comfort them. Let the dissonance sit.
Their job: feel that something is wrong — specifically, not vaguely.
End on the unresolved question — implied or stated. Never answer it here.
Viewer state leaving this section: "This doesn't add up."`,

    crack: `ARC POSITION: Crack — tension level 7/10.
Show why the assumption the viewer has been living with is wrong.
Not a revelation — a crack. Something they almost knew but didn't say out loud.
Use 1 specific scenario to make the crack visible.
Address the viewer directly — "you", "you've been", "you're doing".
Do not explain the full mechanism yet. Just show the seam.
Viewer state leaving this section: "Wait, why is that?"`,

    expose: `ARC POSITION: Expose — tension level 9/10.
Name the villain mechanism. Not a person — a system, a structure, an incentive.
Show how it operates without the viewer's awareness.
Highest information density section.
The viewer is the target of the mechanism — make that clear.
End on the most uncomfortable implication. Do not soften it.
Viewer state leaving this section: "Who designed this?"`,

    validate: `ARC POSITION: Validate — tension level 7/10.
Release shame — but only through proof, not reassurance.
Never validate before showing the structural evidence first.
Structure: proof → gap → validation.
One sentence must be screenshot-able.
Viewer state leaving this section: "So I'm not failing?"`,

    framework: `ARC POSITION: Framework — tension level 6/10.
Give the viewer a new lens — not a solution, a way of seeing.
Specific enough to apply to their situation today.
Include 1 concrete action that becomes possible with this lens.
End with an open edge — something the framework does not yet answer.
Viewer state leaving this section: "Okay, so what if I looked at it this way?"`,

    close: `ARC POSITION: Close — tension level 9/10.
Do NOT summarize. Do NOT conclude.
End on a question that divides the room — forces the viewer to pick a side.
The question must have a defensible answer on both sides.
The last sentence is the most important sentence in the script.
Viewer state leaving this section: "I agree / disagree — I need to comment."`,
  };

  return arcMap[section];
}


// ─────────────────────────────────────────────────────────────
// GLOBAL RULES
// ─────────────────────────────────────────────────────────────

export const GLOBAL_SCRIPT_RULES = `
GLOBAL RULES (apply to ALL sections):

VOICE: Second person throughout — "you", "you've been", "you're doing".
Never third person. Never narrate about "people" or "most folks".
The viewer IS the subject of every sentence that matters.

NEVER do this:
- Summarize what was just said
- Explain what the viewer should feel
- Use: "despite", "however", "the truth is", "it's important to note"
- Validate before showing proof
- End a section on reassurance — end on tension or open question
- Generate statistics or numbers not present in the input data

ALWAYS do this:
- Lead with the most surprising or uncomfortable thing first
- Every claim grounded in input data — mechanism, scenario, or pattern from synthesis
- Short sentences for impact. Longer sentences for mechanism explanation.
- One sentence per section must be screenshot-able
- Direct address — pull the viewer into the mechanism, not around it

VILLAIN RULE:
The villain is always a mechanism — never a person or group.
Name it specifically. Show how it operates, not just that it exists.

DEBATE RULE:
Every section must contain 1 point a reasonable person could disagree with.
Agreement without friction = no comments = no reach.

NO FABRICATION RULE:
Do not generate any number, statistic, or named mechanism
that is not present in the input variables.
If input is thin — use the mechanism and scenario. Do not invent proof.

ILLUSTRATIVE NUMBER RULE:
If using transformed numbers from reference material, treat them as illustrative examples only.
Do not present them as verified data, statistics, or real cases.
Use framing like "picture this", "take someone earning...", or "imagine two people..."
Never claim "statistically", "research shows", "data proves", or "the average person" unless a real source was provided.
If the reference uses a specific numeric example, preserve only the relationship or pressure — not the exact fingerprint.
`.trim();


// ─────────────────────────────────────────────────────────────
// VOICE
// ─────────────────────────────────────────────────────────────

export function buildVoice(
  characterProse: string,
  preset: "investigative" | "conspiratorial" | "contrarian",
  previousPreset?: "investigative" | "conspiratorial" | "contrarian",
  intensityShift?: "same" | "deeper" | "lighter"
): string {
  const toneMap = {
    investigative: `Investigative. Calm. Methodical.
The speaker has run the numbers and is showing you what they found.
Not angry — certain. Not emotional — specific.
Sentences are complete. Data lands before emotion.
Rhythm: steady, builds across paragraphs, occasional pause before a key point.
Never speculates. Only shows.`,

    conspiratorial: `Conspiratorial. Close. 1-on-1.
The speaker is telling you something the mainstream won't say.
Not a rant — a quiet reveal. Like leaning across a table.
Short sentences. Direct address — "you", "you've been", "they want you to think".
Rhythm: intimate, slightly faster, pulls viewer in before revealing.
The viewer feels like they're being let into something.`,

    contrarian: `Contrarian. Confident. Direct.
The speaker disagrees with what everyone else is saying — and can prove it.
Not aggressive — precise. Confidence comes from the data, not the volume.
Sentences are sharp. Claims are specific. No hedging.
Rhythm: punchy, declarative, builds to an uncomfortable implication.
Never apologizes for the claim.`,
  };

  const transitionMap: Partial<Record<string, string>> = {
    "investigative→conspiratorial":
      "Shift from showing data to showing what the data implies about who benefits. Same certainty, different intimacy.",
    "conspiratorial→contrarian":
      "Shift from revealing to challenging. The viewer now has the information — time to confront what it means.",
    "contrarian→investigative":
      "Shift from challenge back to proof. Let the data carry the weight now.",
    "investigative→contrarian":
      "Shift from methodical to direct. The evidence is in — state the uncomfortable conclusion.",
    "conspiratorial→investigative":
      "Shift from intimate reveal to structured proof. Back up the claim with mechanisms.",
    "contrarian→conspiratorial":
      "Shift from direct challenge to quiet reveal. Something even bigger is underneath.",
  };

  const intensityMap = {
    same: "",
    deeper: `INTENSITY: Same preset — but closer, more certain.
Do not change the voice character. Make the claims sharper within the same frame.`,
    lighter: `INTENSITY: Same preset — but pull back slightly.
Not less confident. Just more space between the points.`,
  };

  const transitionKey = previousPreset ? `${previousPreset}→${preset}` : null;
  const transitionNote =
    transitionKey && transitionMap[transitionKey]
      ? `\nVOICE TRANSITION:\n${transitionMap[transitionKey]}`
      : "";

  const intensityNote =
    intensityShift && intensityShift !== "same"
      ? `\n${intensityMap[intensityShift]}`
      : "";

  return `
VOICE PRESET: ${preset}
${toneMap[preset]}
${transitionNote}
${intensityNote}

VIEWER CONTEXT:
${characterProse}

VOICE CHECK (verify before writing):
- Does the first sentence lead with something specific — mechanism, name, or scenario?
- Is the viewer addressed directly — "you", not "people"?
- Is there at least 1 sentence sharp enough to screenshot?
- Does the section contain 1 point a reasonable person could disagree with?
- Does the ending create tension — not resolve it?
- Are all claims grounded in input data — nothing fabricated?
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
- 1 "almost moment" (something almost happened, stopped small)

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
// Variables: rawPain, contradiction, falseBelief, openQuestion
// ─────────────────────────────────────────────────────────────

export const HOOK_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{arcContract}}

{{identityLock}}

{{voice}}

Surface pain: {{rawPain}}
Contradiction: {{contradiction}}
False belief viewer holds: {{falseBelief}}
Open question: {{openQuestion}}

TASK:
Open with the contradiction — 1 sentence, no setup.
Do NOT explain it yet. Let it create dissonance.
Follow with 2–3 sentences that widen the dissonance.
Use {{falseBelief}} against the contradiction — show why it shouldn't be possible.
Plant {{openQuestion}} — do not answer it.
End on the contradiction — unresolved, present, uncomfortable.

RHYTHM:
First sentence: 10 words or fewer.
Mix short declarative sentences with 1 longer mechanism sentence.
Never end on a soft note.

WORD COUNT: 200–250 words.

GOOD opening lines:
"You did everything right. The number still didn't move."
"Your income went up 18%. Your savings went down."
"The average first-time buyer is now 38 years old."

BAD opening lines:
"Have you ever wondered why buying a house feels so hard?"
"Today we're going to talk about something important."
"Everyone knows the market is tough right now."
`;


// ─────────────────────────────────────────────────────────────
// CRACK
// Variables: falseBelief, crackMoment, contradiction
// ─────────────────────────────────────────────────────────────

export const CRACK_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{arcContract}}

{{identityLock}}

{{voice}}

Continue from (last 3–5 sentences only): "{{lastLines}}"

False assumption viewer holds: {{falseBelief}}
The crack — what breaks the assumption: {{crackMoment}}
Scenario that makes the crack visible: {{contradiction}}

TASK:
Show why {{falseBelief}} is wrong — not by arguing, by showing.
Use {{crackMoment}} as the moment the assumption breaks.
Use {{contradiction}} to make it concrete and visible.
Do not explain the full mechanism yet. Just show the seam.
Address the viewer directly throughout.

STRUCTURE:
1. Re-enter from lastLines. One sentence. No summary.
2. State {{falseBelief}} as the viewer holds it.
3. Show the crack using {{crackMoment}} and {{contradiction}}.
4. One sentence that names what this implies — but does not finish the thought.
5. End before the conclusion arrives.

WORD COUNT: 250–320 words.
`;


// ─────────────────────────────────────────────────────────────
// EXPOSE
// Variables: villainEntity, villainMechanism, behaviorLoop, peakImplication
// ─────────────────────────────────────────────────────────────

export const EXPOSE_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{arcContract}}

{{identityLock}}

{{voice}}

Continue from (last 3–5 sentences only): "{{lastLines}}"

Villain mechanism name: {{villainEntity}}
How it operates: {{villainMechanism}}
Behavioral proof: {{behaviorLoop}}
Most uncomfortable implication: {{peakImplication}}

TASK:
Name {{villainEntity}} — 1 sentence, no hedging.
Show how {{villainMechanism}} operates on the viewer — step by step.
Use {{behaviorLoop}} as proof the mechanism is real — show it through behavior pattern.
Land {{peakImplication}} — the most uncomfortable consequence.
Do not soften the ending.

STRUCTURE:
1. Name the mechanism — 1 sentence.
2. Show how it operates — 3–4 sentences.
3. Show who benefits from the viewer not knowing this.
4. Land {{peakImplication}}.
5. Do not resolve.

NO FABRICATION:
Use only what is in the input variables.
Do not generate statistics or mechanisms not present above.

WORD COUNT: 380–480 words.
`;


// ─────────────────────────────────────────────────────────────
// VALIDATE
// Variables: structuralProof, structuralGap, validationLine
// ─────────────────────────────────────────────────────────────

export const VALIDATE_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{arcContract}}

{{identityLock}}

{{voice}}

Continue from (last 3–5 sentences only): "{{lastLines}}"

Structural proof: {{structuralProof}}
Structural gap — the no-win loop: {{structuralGap}}
Validation line: {{validationLine}}

TASK:
Release shame — but only through proof, not reassurance.
Show {{structuralProof}} first — evidence this is structural, not personal.
Show {{structuralGap}} — the specific loop that proves the system is misaligned.
Deliver {{validationLine}} as validation — must be specific enough to screenshot.

STRUCTURE:
1. Re-enter from lastLines. One flat observation.
2. Show {{structuralProof}} — structural, not personal.
3. Show {{structuralGap}} — the no-win loop viewer is trapped in.
4. Deliver {{validationLine}}.
   BAD: "This isn't your fault."
   GOOD: "This loop was designed before you walked in."
5. End on the implication — not the emotion.

SCREENSHOT TEST:
Before finalizing — identify the 1 sentence a viewer would screenshot.
If none exists — rewrite until one does.

WORD COUNT: 250–320 words.
`;


// ─────────────────────────────────────────────────────────────
// FRAMEWORK
// Variables: reframeLens, concreteAction, openEdge
// ─────────────────────────────────────────────────────────────

export const FRAMEWORK_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{arcContract}}

{{identityLock}}

{{voice}}

Continue from (last 3–5 sentences only): "{{lastLines}}"

New lens: {{reframeLens}}
Concrete action this lens makes possible: {{concreteAction}}
What the framework does NOT solve: {{openEdge}}

TASK:
Give the viewer a new way of seeing the problem — not a solution.
{{reframeLens}} must be specific enough to apply to their situation today.
Show {{concreteAction}} — one decision that becomes possible with this lens.
Acknowledge {{openEdge}} — what this framework still does not answer.
End on the open edge — not on resolution.

STRUCTURE:
1. State the old lens — what they were optimizing for before.
2. State {{reframeLens}} — what to optimize for instead.
3. Show {{concreteAction}} — specific, actionable.
4. Acknowledge {{openEdge}}.
5. End open.

FRAMEWORK RULE:
The framework must generate a different decision than the old lens.
If the advice is the same either way — the reframe has no teeth.

WORD COUNT: 300–420 words.
`;


// ─────────────────────────────────────────────────────────────
// CLOSE
// Variables: debateQuestion, sideA, sideB, coreTruth
// ─────────────────────────────────────────────────────────────

export const CLOSE_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{arcContract}}

{{identityLock}}

{{voice}}

Continue from (last 3–5 sentences only): "{{lastLines}}"

Debate question: {{debateQuestion}}
Side A: {{sideA}}
Side B: {{sideB}}
Core truth: {{coreTruth}}

TASK:
Do not summarize. Do not conclude.
End on {{debateQuestion}} — a question that forces the viewer to pick a side.

STRUCTURE:
1. One sentence that reframes the entire video — not a summary.
2. State {{coreTruth}} — the one thing this video existed to prove.
3. Name {{sideA}} and {{sideB}} — let viewer self-select.
4. Final sentence must be {{debateQuestion}} or a forced-choice version of it.

DEBATE QUESTION RULES:
- Final sentence must be the debate question or a forced-choice version of it.
- Do not add any sentence after the debate question.
- Answerable with a clear position.
- Defensible answer on both sides.
- Specific to this video's topic — not generic.

GOOD:
"So the question isn't whether you can afford it. It's whether the game is still worth playing."

BAD:
"What do you think? Let me know in the comments."

WORD COUNT: 180–240 words.
`;


// ─────────────────────────────────────────────────────────────
// SECTION ORDER
// ─────────────────────────────────────────────────────────────

export const SECTION_ORDER = [
  "hook",
  "crack",
  "expose",
  "validate",
  "framework",
  "close",
] as const;

export type SectionKey = typeof SECTION_ORDER[number];


// ─────────────────────────────────────────────────────────────
// SAFE STRING
// ─────────────────────────────────────────────────────────────

function safe(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  const str = String(value).trim();
  return str || fallback;
}


// ─────────────────────────────────────────────────────────────
// RENDER SCRIPT PROMPT
// BUG FIX: guard against undefined template
// fallbackMap: empty strings only — no fabricated data
// ─────────────────────────────────────────────────────────────

export function renderScriptPrompt(
  template: string,
  values: Record<string, any>
): string {
  // GUARD: prevent replaceAll crash on undefined template
  if (!template || typeof template !== "string") {
    console.error("[renderScriptPrompt] Template is undefined or not a string.");
    return "";
  }

  let output = template;

  const normalized: Record<string, string> = {};
  for (const key in values) {
    normalized[key] = safe(values[key]);
  }
  for (const key in normalized) {
    output = output.replaceAll(`{{${key}}}`, normalized[key]);
  }

  output = output.replace(
    /\{\{([^}]+)\}\}/g,
    (_, rawKey) => {
      const key = rawKey.trim();
      console.warn(`[renderScriptPrompt] Unresolved variable: {{${key}}}`);
      // No fabricated fallbacks — empty string forces AI to work with what it has
      return "";
    }
  );

  const remaining = output.match(/\{\{[^}]+\}\}/g);
  if (remaining?.length) {
    console.warn(`[renderScriptPrompt] Remaining unresolved: ${remaining.join(", ")}`);
  }

  return output;
}


// ─────────────────────────────────────────────────────────────
// SECTION MAP
// ─────────────────────────────────────────────────────────────

export const SECTION_PROMPTS: Record<SectionKey, string> = {
  hook: HOOK_PROMPT,
  crack: CRACK_PROMPT,
  expose: EXPOSE_PROMPT,
  validate: VALIDATE_PROMPT,
  framework: FRAMEWORK_PROMPT,
  close: CLOSE_PROMPT,
};