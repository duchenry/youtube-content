// ─────────────────────────────────────────────────────────────
// IDENTITY LOCK
// ─────────────────────────────────────────────────────────────

export function buildIdentityLock(facts: {
  age: number;
  income: string;
  job: string;
  livingSituation: string;
  carYear?: string;
  city?: string;
  yearsAtJob?: number;
}): string {
  return `
IDENTITY LOCK (non-negotiable, never change these across any section):
- Age: ${facts.age}
- Income: ${facts.income}
- Job: ${facts.job}
- Living situation: ${facts.livingSituation}
${facts.carYear ? `- Car: ${facts.carYear}` : ""}
${facts.city ? `- City: ${facts.city}` : ""}
${facts.yearsAtJob ? `- Years at job: ${facts.yearsAtJob}` : ""}

If any sentence implies a different age, income, or situation — rewrite it.
These facts are not flexible. Do not round, approximate, or vary them.
`.trim();
}


// ─────────────────────────────────────────────────────────────
// ARC CONTRACT
// ─────────────────────────────────────────────────────────────

export function buildArcContract(
  section: "hook" | "setup" | "contradiction" | "reframe" | "solution" | "close"
): string {
  const arcMap: Record<string, string> = {
    hook: `ARC POSITION: Entry — tension level 3/10.
The reader has just arrived. Establish situation, not emotion.
Nothing escalates here. Set the frame. Let discomfort be ambient.
This section should feel like the beginning of a long afternoon, not a crisis.`,

    setup: `ARC POSITION: Slow build — tension level 4–5/10.
Something is tightening but the character is still functional.
The loop becomes visible. Cost becomes real but not unbearable yet.
Do not peak here. The reader should feel pressure building, not arriving.`,

    contradiction: `ARC POSITION: Peak — tension level 7–8/10.
This is the highest tension in the script.
The trap is fully visible. Both exits are closed.
Sentences should be shorter than any previous section.
Do not resolve. Do not soften. Let it sit at peak.`,

    reframe: `ARC POSITION: Crack — tension level 5–6/10.
Tension drops from peak but does not release.
Something shifted — not forward, just sideways.
The character notices something he can't un-notice.
Quieter than contradiction. More uncertain. Less contained.`,

    solution: `ARC POSITION: Deflation — tension level 3–4/10.
The character is trying to move but the loop reasserts.
Energy is lower than any previous section.
Options are considered with low conviction. Nothing lands.
This section should feel like running out of things to say.`,

    close: `ARC POSITION: Dissipation — tension level 1–2/10.
The script doesn't end. It stops.
Smallest observations. Flattest sentences. No energy for meaning.
If a sentence feels significant — cut it or flatten it.
The last sentence should be the least important sentence in the script.`,
  };

  return arcMap[section];
}


// ─────────────────────────────────────────────────────────────
// GLOBAL RULES
// ─────────────────────────────────────────────────────────────

export const GLOBAL_SCRIPT_RULES = `
GLOBAL RULES (apply to ALL sections):

NEVER do this:
- Conclude or wrap anything up
- Explain what the character is feeling
- Use clean symmetry or polished phrasing
- Write a sentence that sounds like writing
- Start with "I" more than twice in a row
- Use: "despite", "however", "I realized", "I felt like", "at the end of the day"
- Make every object carry emotional weight — some details must mean nothing

ALWAYS do this:
- Physical details over abstraction (a number, an object, a sound, a smell)
- Let some details be dead — observational waste with no symbolic purpose
- Imperfect grammar if it carries feeling
- If a sentence feels too clean → break it or cut it

DEAD DETAIL RULE:
At least 1 detail per section must be purely observational — no emotional load.
It is just there. It does not symbolize anything.

GOOD dead details:
"The microwave clock is wrong by four minutes."
"There's a pen on the counter that's probably out of ink."
"The neighbor's car is blue."

BAD (everything loaded):
"The chipped glass caught the light again."
"The same stain on the same carpet."
"The garlic smell through the vents."

REPETITION CAP:
Any motif, object, or emotional construction may appear MAX 2 times per script.
On second appearance: shorter, flatter, no development.
Never three times.

DIALOGUE RULE:
Direct speech is allowed max 2 instances per script total.
Use only when the external voice contrasts with internal voice.
Never use dialogue to advance information.
Never use dialogue as emotional punctuation.

GOOD dialogue use:
"You'll get there," she said. The water was flat in my hand.

BAD dialogue use:
"You're so close," Maya said warmly, touching my arm with genuine care.

DEAD PARAGRAPH RULE:
At least 1 paragraph per section must contain zero quotable sentences.
Flat. Transitional. Ugly if necessary.
Its only job is to exist between two better paragraphs.

GOOD/BAD CONTRAST:
GOOD: "Same hallway. Same smell. Rent went up again."
GOOD: "The Civic still starts. That's something."
GOOD: "Opened the app. Same number. Closed it."
BAD: "Despite his efforts, nothing changed."
BAD: "He couldn't help but feel like the system had failed him."
BAD: "Although he worked hard, life remained difficult."
`.trim();


// ─────────────────────────────────────────────────────────────
// VOICE
// ─────────────────────────────────────────────────────────────

export function buildVoice(
  characterProse: string,
  preset: "resigned" | "building" | "raw",
  previousPreset?: "resigned" | "building" | "raw",
  intensityShift?: "same" | "deeper" | "lighter"
): string {
  const toneMap = {
    resigned: `Resigned. Mid-thought. Not angry — past angry.
The character has explained this to himself too many times.
He's not looking for sympathy. He's just noting things.
Sentences trail. Nothing lands with force.
Rhythm: slow, flat, occasional pause mid-sentence.`,

    building: `Building. Not arrived — just getting closer to something uncomfortable.
The character is still functioning but something is tightening.
Sentences get shorter as pressure builds. Not dramatic — just tighter.
One thought interrupts another before it finishes.
Rhythm: uneven, slightly faster, self-correcting.`,

    raw: `Raw. Started talking before ready.
The character hasn't organized this yet. It's coming out wrong.
Details land before context. Logic skips. Circles back.
Not emotional — just unfiltered. There's a difference.
Rhythm: fragmented, mid-thought entry, no clean exits.`,
  };

  const transitionMap: Partial<Record<string, string>> = {
    "raw→resigned":
      "Shift from unfiltered to flat. The character ran out of energy to be raw. Now he's just reporting.",
    "resigned→building":
      "Shift from flat to tightening. Something specific triggered it — not a feeling, a fact.",
    "building→raw":
      "Shift from controlled pressure to breaking containment. Not explosion — just losing grip on the phrasing.",
    "building→resigned":
      "Pressure didn't release — it just stopped mattering for a moment.",
    "raw→building":
      "From scattered to focused. Something clarified. Not hope — just direction.",
    "resigned→raw":
      "From flat reporting to something slipping through. A detail hit differently.",
  };

  const intensityMap = {
    same: "",
    deeper: `INTENSITY: Same preset as previous section — but deeper.
Do not change the emotional character. Make it heavier within the same frame.
The character is more tired, more certain of the same thing.
Do not introduce new emotional colors.`,
    lighter: `INTENSITY: Same preset as previous section — but lighter.
Not recovery. Just less pressure momentarily.
The character hasn't changed — there's just less of it right now.`,
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
VOICE:
${toneMap[preset]}
${transitionNote}
${intensityNote}

CHARACTER:
${characterProse}

VOICE CHECK (verify before writing):
- Does the opening line drop in mid-thought?
- Is there at least one sentence that cuts off or trails?
- Does any sentence feel too clean or too complete?
- Is the ending unresolved — not a conclusion, not a summary?
- Is there at least one moment of emotional oscillation
  (denial / humor / bitterness / numbness / absurdity / cope)?
  It must feel accidental, not placed.
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
// ─────────────────────────────────────────────────────────────

export const HOOK_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{arcContract}}

{{identityLock}}

{{voice}}

Pain: {{rawPain}}
Contradiction: {{contradiction}}
False belief: {{falseBelief}}
Open question: {{openQuestion}}

Physical anchor: {{physicalDetail}}

TASK:
Open mid-thought. 1–6 words maximum for the first sentence.
The first sentence should name a specific action or object — not a feeling.
Weave Pain, Contradiction, and False belief into the scene — do not list them.
Insert 1 interruption using the physical anchor.
Imply something is wrong through behavior and detail. Never state it.

Plant the open question — do not answer it. It should feel like something
the character almost notices, then moves past. The viewer carries it forward.

RHYTHM:
Short sentences dominate.
One longer sentence allowed — place it in the middle, not the end.
End on something unresolved. Not a question. Not a statement of feeling.

WORD COUNT: 180–220 words.
If you reach 220 words before the section feels done — stop anyway.
Do not add sentences to complete the feeling. Incompleteness is correct.

GOOD opening lines:
"Can't stop refreshing."
"Lease renewal's on the counter."
"Three years. Same carpet."

BAD opening lines:
"I've been struggling with this for a while."
"It's hard to explain, but something feels wrong."
"Despite everything, I keep trying."
`;


// ─────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────

export const SETUP_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{arcContract}}

{{identityLock}}

{{voice}}

Continue from (last 3–5 sentences only): "{{lastLines}}"

Scenario: {{scenario}}
Loop: {{behaviorLoop}}
Cost: {{behaviorCost}}
Constraint: {{constraint}}

Physical anchor: {{physicalDetail}}
Habit loop: {{habitLoop}}

TASK:
Show the behavior loop in motion — not described, enacted.
The character does the same thing again. The repetition IS the feeling.
Include 1 derail: a physical detail interrupts the logic mid-paragraph.

A derail is NOT a transition.
It is the character's attention snagging on something concrete
before returning to the main thread.
The derail detail must be dead — it symbolizes nothing.

DERAIL EXAMPLE:
"I keep telling myself it makes sense to wait another year.
The fridge makes that clicking sound again.
Anyway. Same number in the account."

Cost must land through a specific object or action — not a summary statement.
Constraint must feel structural, not personal:
not "I can't afford it" but "the math says 2027 and 2027 keeps moving."

WORD COUNT: 350–450 words.
If you reach 450 before the section feels done — stop anyway.
`;


// ─────────────────────────────────────────────────────────────
// CONTRADICTION
// ─────────────────────────────────────────────────────────────

export const CONTRADICTION_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{arcContract}}

{{identityLock}}

{{voice}}

Continue from (last 3–5 sentences only): "{{lastLines}}"

A: {{optionAAction}} → {{optionACost}}
B: {{optionBAction}} → {{optionBCost}}

Trap: {{noWinAsymmetry}}
Fear: {{fearIfNotAct}}

Physical anchor: {{physicalDetail}}

TASK:
Do NOT present A and B as a clean list.
Build tension first — let the character circle the problem
before the options become visible.

STRUCTURE (follow this order):
1. Re-enter from lastLines. One concrete observation. No summary.
2. Option A surfaces through behavior or memory — not explanation.
3. The cost of A lands on a physical detail or number.
4. Self-interruption — character catches himself mid-logic.
5. Option B surfaces. Shorter treatment than A.
6. The trap becomes visible — but is NOT named or concluded.
7. One uncomfortable truth line — not the ending line, placed in the middle.
8. End mid-thought. The fear is present but not stated.

SELF-INTERRUPTION EXAMPLE:
"I could do 5% down. Some people do that.
But then my dad's voice — the PMI thing —
forget it. Doesn't matter."

The uncomfortable truth must feel accidentally said, not placed for effect.

OSCILLATION REQUIREMENT:
Somewhere in this section, the emotional register must shift once —
briefly, without announcement.
Options: a moment of dark humor / a flat cope / a beat of absurdity /
a line that almost sounds like acceptance before collapsing.
It should feel like it slipped through, not like it was written.

WORD COUNT: 450–600 words.
If you reach 600 before the section feels done — stop anyway.
`;


// ─────────────────────────────────────────────────────────────
// REFRAME
// ─────────────────────────────────────────────────────────────

export const REFRAME_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{arcContract}}

{{identityLock}}

{{voice}}

Continue from (last 3–5 sentences only): "{{lastLines}}"

Belief: {{falseBelief}}
Crack: {{crackMoment}}
Truth: {{hiddenTruth}}
Glimpse: {{aspirationalGlimpse}}

Physical anchor: {{physicalDetail}}

TASK:
A reframe is NOT a revelation. It is a crack — small, uncomfortable,
not fully formed. The character does not conclude anything.
He notices something he can't un-notice.

STRUCTURE:
1. Re-enter from lastLines. Flat. Observational.
2. The false belief is visible in a behavior — not stated as a belief.
3. The crack appears through a specific moment or detail — {{crackMoment}}.
   It is NOT explained. It is just shown.
4. Both sides of the crack exist at the same time.
   The character does not choose between them.
5. The hidden truth {{hiddenTruth}} is present — but only partially visible.
   A fragment. Not a conclusion.
6. The glimpse {{aspirationalGlimpse}} surfaces briefly — one specific action
   or decision that became possible for someone else. Not motivational.
   Just visible. Then gone.
7. End on something smaller than what came before.
   Not a quiet insight. Just a smaller, flatter observation.

CRACK EXAMPLE (rhythm reference only — do not copy):
"My dad bought at 24. I'm 31.
I looked it up once — adjusted for inflation, I make more than he did.
The math doesn't work the same way it used to work.
I don't know what that means.
The spreadsheet's still open."

Show both sides. No resolution. No summary. No lesson.

OSCILLATION REQUIREMENT:
One beat in this section must shift register briefly —
something that almost sounds like relief, or humor, or acceptance —
before returning to flat. It should feel accidental.

WORD COUNT: 260–340 words.
If you reach 340 before the section feels done — stop anyway.
`;


// ─────────────────────────────────────────────────────────────
// SOLUTION
// ─────────────────────────────────────────────────────────────

export const SOLUTION_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{arcContract}}

{{identityLock}}

{{voice}}

Continue from (last 3–5 sentences only): "{{lastLines}}"

Need: {{unspokenNeed}}
Loop: {{behaviorLoop}}
Glimpse: {{aspirationalGlimpse}}

Physical anchor: {{physicalDetail}}

TASK:
This section does NOT solve the problem.
It shows the character considering 2–3 imperfect options
with low confidence and no real follow-through.

Each option must be:
- Named hesitantly ("there's this thing I read about", "someone mentioned")
- Framed with visible doubt ("I don't know if that's", "probably doesn't apply")
- Followed by the specific reason the character won't actually do it

The avoidance must feel behavioral — rooted in habit or fear, not in logic.

OPTION PRESENTATION EXAMPLE:
"There's a sub I check sometimes. Someone always says move somewhere cheaper.
I've thought about it. The way you think about faking your death.
Technically possible. Requires abandoning everything."

The glimpse {{aspirationalGlimpse}} must appear once — briefly, flat,
as something the character heard about someone else. Not as inspiration.
Just as information that didn't land.

The unspoken need {{unspokenNeed}} must be visible through
what the character gravitates toward — not through what he says he needs.

End on the loop reasserting itself.
The character returns to the same behavior he started with.
No new information. Same place.

ENERGY NOTE:
This section has the lowest energy in the script.
If a sentence feels significant or memorable — flatten it or cut it.
Options should feel like things the character is barely bothering to consider.

WORD COUNT: 320–420 words.
If you reach 420 before the section feels done — stop anyway.
`;


// ─────────────────────────────────────────────────────────────
// CLOSE
// ─────────────────────────────────────────────────────────────

export const CLOSE_PROMPT = `
${GLOBAL_SCRIPT_RULES}

{{arcContract}}

{{identityLock}}

{{voice}}

Continue from (last 3–5 sentences only): "{{lastLines}}"

Core: {{coreTruth}}
Belief: {{coreBelief}}
Echo: {{almostMoment}}

Physical anchor: {{physicalDetail}}

TASK:
No new idea. No new character. No new location.
Return to something already present in the script —
the physical anchor, a number, a routine already mentioned.

Echo {{almostMoment}} — not as callback, not as symmetry.
Just as something that resurfaces. The character didn't plan to return to it.

The close should feel like the script running out of energy —
not ending, just stopping.

STRUCTURE:
1. One flat observation. Smaller than anything before it.
2. A moment where {{coreTruth}} is almost visible — then isn't.
3. The physical anchor appears one last time.
   Not for effect. Just because it's still there.
4. Final sentence: the weakest sentence in the script.
   Low energy. Unresolved. Could be mid-thought.
   Does not summarize. Does not land.

FINAL SENTENCE TEST:
Read the last sentence. If it sounds like an ending — rewrite it.
It should sound like something said while looking at something else.

GOOD closing energy:
"The chicken's probably fine."
"Same number. Closed the app."
"Still starts. That's something."

BAD closing energy:
"And maybe that's enough for now."
"He didn't have the answers, but he kept going."
"Some things just take time."

WORD COUNT: 150–200 words.
If you reach 200 before the section feels done — stop anyway.
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

// ─────────────────────────────────────────────────────────────
// SAFE STRING
// ─────────────────────────────────────────────────────────────

function safe(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) {
    return fallback;
  }

  const str = String(value).trim();

  return str || fallback;
}


// ─────────────────────────────────────────────────────────────
// RENDER SCRIPT PROMPT
// ─────────────────────────────────────────────────────────────

export function renderScriptPrompt(
  template: string,
  values: Record<string, any>
): string {
  let output = template;

  const normalized: Record<string, string> = {};

  for (const key in values) {
    normalized[key] = safe(values[key]);
  }

  for (const key in normalized) {
    output = output.replaceAll(
      `{{${key}}}`,
      normalized[key]
    );
  }

  output = output.replace(
    /\{\{([^}]+)\}\}/g,
    (_, rawKey) => {
      const key = rawKey.trim();

      console.warn(
        `[renderScriptPrompt] Auto-filled unresolved variable: {{${key}}}`
      );

      const fallbackMap: Record<string, string> = {
        voice:
          `
VOICE:
Flat. Mid-thought. Low energy.
Sentences drift slightly.
Nothing resolves cleanly.
`.trim(),

        lastLines:
          "Continue naturally from the previous emotional beat.",

        scriptMemory:
          "Something about the situation keeps repeating.",

        physicalDetail:
          "The room is quiet except for appliance noise.",

        habitLoop:
          "Checks something. Stops. Comes back later.",

        almostMoment:
          "For a second it almost felt different.",

        contradiction:
          "Something about the situation doesn't add up.",

        falseBelief:
          "Working harder should eventually fix it.",

        hiddenTruth:
          "Maybe the system changed before he noticed.",

        coreTruth:
          "The pressure never fully leaves.",

        coreBelief:
          "Hard work is supposed to lead somewhere.",

        openQuestion:
          "Something about this doesn't add up but the character can't name it yet.",

        aspirationalGlimpse:
          "Someone nearby made a decision that didn't require a spreadsheet.",
      };

      return fallbackMap[key] || "";
    }
  );

  const remaining = output.match(/\{\{[^}]+\}\}/g);

  if (remaining?.length) {
    console.warn(
      `[renderScriptPrompt] Remaining unresolved variables: ${remaining.join(
        ", "
      )}`
    );
  }

  return output;
}


// ─────────────────────────────────────────────────────────────
// SECTION MAP
// ─────────────────────────────────────────────────────────────

export const SECTION_PROMPTS = {
  hook: HOOK_PROMPT,
  setup: SETUP_PROMPT,
  contradiction: CONTRADICTION_PROMPT,
  reframe: REFRAME_PROMPT,
  solution: SOLUTION_PROMPT,
  close: CLOSE_PROMPT,
} as const;