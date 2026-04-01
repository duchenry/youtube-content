import OpenAI from "openai";
import {
  CoreAngleSelection,
  PilotSession,
  Step1DataIntake,
  Step3POVGate,
  Step4StrategicGaps,
  Step5HumanInput,
  Step5InputGuidance,
  Step10DistortionReminder,
  Step10HumanizationInput,
} from "@/app/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL_GPT_MINI = process.env.PILOT_MODEL_GPT_MINI || "gpt-4o-mini";
const MODEL_CLAUDE_SONNET =
  process.env.PILOT_MODEL_CLAUDE_SONNET || process.env.PILOT_MODEL_CLAUDE || MODEL_GPT_MINI;

function modelForStep(
  step:
    | "step2"
    | "step3a"
    | "step3b"
    | "step4"
    | "step5"
    | "step6"
    | "step7"
    | "step8"
    | "step9"
    | "step10"
    | "step10-final"
) {
  switch (step) {
    case "step3b":
    case "step6":
    case "step9":
      return MODEL_CLAUDE_SONNET;
    default:
      return MODEL_GPT_MINI;
  }
}

// Memory store for sessions (in production, use DB)
const sessions = new Map<string, PilotSession>();

function normalizeText(value: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeAngles(angles: Array<{ name: string; description: string; emotionalPull: string }>) {
  const seen = new Set<string>();
  const distinct: Array<{ name: string; description: string; emotionalPull: string }> = [];

  for (const angle of angles) {
    const key = `${normalizeText(angle.name)}|${normalizeText(angle.description)}`;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    distinct.push(angle);
  }

  return distinct.slice(0, 5);
}

function summarizeStep5Material(step5?: Step5HumanInput): string {
  if (!step5) return "No human material provided.";

  const dynamic = Array.isArray(step5.requestedInputs)
    ? step5.requestedInputs
        .filter((item) => (item?.response || "").trim().length > 0)
        .map(
          (item, index) =>
            `${index + 1}. ${item.label || item.id}: ${item.response.trim()}`
        )
    : [];

  const legacy = [
    step5.story1 ? `Story 1: ${step5.story1}` : "",
    step5.story2 ? `Story 2: ${step5.story2}` : "",
    step5.emotionalMoment ? `Emotional moment: ${step5.emotionalMoment}` : "",
    step5.metaphorSource ? `Metaphor source: ${step5.metaphorSource}` : "",
  ].filter(Boolean);

  const merged = [...dynamic, ...legacy];
  return merged.length > 0 ? merged.join("\n") : "No human material provided.";
}

function getOrCreateSession(payload: {
  sessionId?: string;
  inputContract?: {
    platform: string;
    niche: string;
    creatorVoice: string;
    targetViewer: string;
  };
}) {
  if (payload.sessionId && sessions.has(payload.sessionId)) {
    return sessions.get(payload.sessionId)!;
  }

  const newSessionId = `pilot-${Date.now()}`;
  const session: PilotSession = {
    id: newSessionId,
    createdAt: new Date().toISOString(),
    currentStep: 1,
    inputContract: payload.inputContract || {
      platform: "youtube-long",
      niche: "",
      creatorVoice: "",
      targetViewer: "",
    },
  };

  sessions.set(newSessionId, session);
  return session;
}

export async function processPilotAction(body: any) {
  const { action, sessionId, inputContract, data } = body;
  const session = getOrCreateSession({ sessionId, inputContract });

  let result: any = {};

  switch (action) {
    case "step1":
      result = await handleStep1(session, data as Step1DataIntake);
      break;
    case "step2":
      result = await handleStep2(session);
      break;
    case "step3":
      result = await handleStep3(session, data as Step3POVGate);
      break;
    case "step3Interview":
      result = await handleStep3Interview(session, data);
      break;
    case "step4":
      result = await handleStep4(session);
      break;
    case "step5":
      result = await handleStep5(session);
      break;
    case "step4Select":
      result = await handleStep4Select(session, data as CoreAngleSelection);
      break;
    case "step6":
      result = await handleStep6(session, data as Step5HumanInput);
      break;
    case "step7":
      result = await handleStep7(session);
      break;
    case "step8":
      result = handleStep8();
      break;
    case "step9":
      result = await handleStep9(session);
      break;
    case "step10":
      result = await handleStep10(session, data as Step10HumanizationInput);
      break;
    default:
      throw new Error("Unknown action");
  }

  if (typeof action === "string" && action.startsWith("step")) {
    const parsed = parseInt(action.replace("step", ""), 10);
    if (!Number.isNaN(parsed)) {
      session.currentStep = parsed;
    }
  }

  sessions.set(session.id, session);

  return {
    sessionId: session.id,
    currentStep: session.currentStep,
    ...result,
  };
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function handleStep3Interview(
  session: PilotSession,
  data: {
    layer: 1 | 2 | 3 | 4 | 5;
    history: Array<{ layer: number; question: string; answer: string }>;
    latestAnswer?: string;
  }
): Promise<{
  step3Interview: {
    nextLayer: 1 | 2 | 3 | 4 | 5;
    question: string;
    objective: string;
    feedback: string;
    lockPOV: boolean;
    sharpness: 0 | 1 | 2 | 3;
    step3?: Step3POVGate;
  };
}> {
  if (!session.step2) {
    throw new Error("Step 2 data required before Step 3 interview");
  }

  const history = Array.isArray(data?.history) ? data.history.slice(-8) : [];
  const layer = (data?.layer || 1) as 1 | 2 | 3 | 4 | 5;

  const prompt = `
You are running STEP 3 — POV Interview Mode.

Goal:
- Ask dynamic, non-generic POV questions.
- Extract a personal, specific, sharp POV.
- Never use fixed/template questions.

Context (Step 2 demand analysis):
${JSON.stringify(session.step2)}

Interview history:
${JSON.stringify(history)}

Current layer: ${layer}

Layer objectives:
1 challenge shallow assumptions
2 clarify boundaries and nuance
3 force personal connection
4 surface uncomfortable truth
5 compress to 1-3 hard POV lines

Rules:
- Ask only 1 question now.
- Question must adapt to history and target missing depth.
- If answers are still generic, keep or move back a layer.
- Lock POV only when sharpness is high.

Return strict JSON only:
{
  "nextLayer": 1,
  "question": "One dynamic interview question",
  "objective": "What this question is trying to extract",
  "feedback": "Short coaching feedback",
  "lockPOV": false,
  "sharpness": 0,
  "step3": {
    "whatYouBelieve": "only when lockPOV=true",
    "whatYouAttack": "only when lockPOV=true",
    "whoYouDefend": "only when lockPOV=true"
  }
}
`;

  const response = await openai.chat.completions.create({
    model: modelForStep("step4"),
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
  });

  const parsed = safeJsonParse<{
    nextLayer?: 1 | 2 | 3 | 4 | 5;
    question?: string;
    objective?: string;
    feedback?: string;
    lockPOV?: boolean;
    sharpness?: 0 | 1 | 2 | 3;
    step3?: Step3POVGate;
  }>(response.choices[0].message.content || "", {});

  const fallbackQuestionByLayer: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: "What belief are you repeating that you no longer actually trust?",
    2: "Where does your belief stop being true, and who is the exception?",
    3: "Tell one real decision you made that proves this belief came from experience.",
    4: "What truth here feels risky to say out loud but you know is real?",
    5: "Compress your POV into 1-3 lines with clear tension.",
  };

  const nextLayer = (parsed.nextLayer || layer) as 1 | 2 | 3 | 4 | 5;
  const lockPOV = Boolean(parsed.lockPOV && parsed.step3?.whatYouBelieve);
  const sharpness = (parsed.sharpness || 0) as 0 | 1 | 2 | 3;

  if (lockPOV && parsed.step3) {
    session.step3 = {
      whatYouBelieve: parsed.step3.whatYouBelieve || "",
      whatYouAttack: parsed.step3.whatYouAttack || "",
      whoYouDefend: parsed.step3.whoYouDefend || "",
    };
  }

  return {
    step3Interview: {
      nextLayer,
      question: parsed.question || fallbackQuestionByLayer[nextLayer],
      objective:
        parsed.objective ||
        "Extract concrete, personal belief with clear boundaries and emotional risk.",
      feedback: parsed.feedback || "Answer with concrete details, not abstract opinion.",
      lockPOV,
      sharpness,
      step3: lockPOV ? session.step3 : undefined,
    },
  };
}

// STEP 1: DATA INTAKE — Parse competitor & comments
async function handleStep1(
  session: PilotSession,
  data: Step1DataIntake
): Promise<{ step1: Step1DataIntake }> {
  session.step1 = data;
  return { step1: data };
}

// STEP 2: LOGIC ANALYSIS — Extract patterns
async function handleStep2(session: PilotSession): Promise<any> {
  if (!session.step1) {
    throw new Error("Step 1 data required");
  }

  const prompt = `
You are extracting demand signals from competitor content.

Quality contract:
- You are an extractor, not a creator.
- Use only evidence visible in transcript/comments.
- If evidence is weak, state uncertainty explicitly.

Input transcript:
${session.step1.competitorTranscript}

Input comments:
${session.step1.topComments.join("\n")}

STEP 2 — DEMAND & ANALYSIS
Extract ONLY:
1) Core problem (objective)
2) Audience emotion (fear, desire, insecurity)
3) Why content works (attention trigger)

Rules:
- No POV
- No creativity
- No rewriting
- No generic language
- Use concrete wording tied to this source only
- MUST extract at least 1 uncomfortable or socially undesirable behavior
- MUST include a real-world micro-scenario (time, place, action)

Return strict JSON only:
{
  "coreProblem": "One clear objective problem the competitor content addresses",
  "audienceEmotion": {
    "fear": "Audience fear",
    "desire": "Audience desire",
    "insecurity": "Audience insecurity"
  },
  "attentionTrigger": "Why this content grabs attention",
  "qualityCheck": {
    "sourceGrounded": true,
    "genericRisk": "low | medium | high",
    "notes": "One-line quality note"
  }
}
`;

  const response = await openai.chat.completions.create({
    model: modelForStep("step2"),
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  const content = response.choices[0].message.content || "";
  const analysis = JSON.parse(content);

  session.step2 = analysis;
  return { step2: analysis };
}

// STEP 3: POV GATE — User defines perspective
async function handleStep3(
  session: PilotSession,
  data: Step3POVGate
): Promise<{ step3: Step3POVGate }> {
  session.step3 = data;
  return { step3: data };
}

// STEP 4: STRATEGIC GAPS — AI suggests angles
async function handleStep4(session: PilotSession): Promise<any> {
  if (!session.step1 || !session.step2) {
    throw new Error("Step 1 and Step 2 data required");
  }

  const step3aPrompt = `
STEP 3A — COMPETITOR ANGLE IDENTIFICATION

Transcript:
${session.step1.competitorTranscript}

Comments:
${session.step1.topComments.join("\n")}

Extract JSON only:
{
  "mainAngle": "Competitor's central angle",
  "focusAreas": ["What they focus on"],
  "ignoredAreas": ["What they ignore or avoid"],
  "demandMechanic": "What psychological demand this angle taps",
  "gaps": [
    { "gap": "Gap name", "reason": "Why this gap matters" }
  ],
  "qualityCheck": {
    "specificity": "high | medium | low",
    "notes": "One sentence"
  }
}

Rules:
- Keep this purely diagnostic, not creative.
- If unsure, state most likely angle with confidence language.
`;

  const step3aResp = await openai.chat.completions.create({
    model: modelForStep("step3a"),
    messages: [{ role: "user", content: step3aPrompt }],
    temperature: 0.2,
  });

  const step3aRaw = step3aResp.choices[0].message.content || "{}";
  const step3a = JSON.parse(step3aRaw) as {
    mainAngle?: string;
    focusAreas?: string[];
    ignoredAreas?: string[];
    gaps?: Array<{ gap: string; reason: string }>;
  };

  const step3bPrompt = `
STEP 3B — NEW ANGLE GENERATION

Competitor angle:
- Main: ${step3a.mainAngle || "Unknown"}
- Focus: ${(step3a.focusAreas || []).join(" | ")}
- Ignore: ${(step3a.ignoredAreas || []).join(" | ")}

Demand analysis:
${JSON.stringify(session.step2)}

Generate 3-5 NEW angles.
Rules:
- Must be DIFFERENT from competitor
- Each angle must be standalone
- Do NOT combine angles
- Do NOT overlap angles semantically
- Each angle must imply a full-video thesis, not a topic label
- Avoid template phrasing and abstract buzzwords
- Each angle must trigger a different emotional reaction

Return JSON only:
{
  "angles": [
    { "name": "Angle", "description": "Standalone direction", "emotionalPull": "Emotional lever" }
  ],
  "selectionNotice": "Only ONE angle will be selected as the CORE ANGLE.",
  "qualityCheck": {
    "distinctness": "high | medium | low",
    "genericRisk": "low | medium | high",
    "notes": "One sentence"
  }
}
`;

  const step3bResp = await openai.chat.completions.create({
    model: modelForStep("step3b"),
    messages: [{ role: "user", content: step3bPrompt }],
    temperature: 0.7,
  });

  const step3bRaw = step3bResp.choices[0].message.content || "{}";
  const parsed = JSON.parse(step3bRaw) as Step4StrategicGaps;
  const rawAngles = Array.isArray(parsed.angles) ? parsed.angles : [];
  const gaps: Step4StrategicGaps = {
    gaps: Array.isArray(step3a.gaps) ? step3a.gaps : [],
    angles: dedupeAngles(rawAngles),
    selectionNotice: "Only ONE angle will be selected as the CORE ANGLE.",
  };

  if (gaps.angles.length < 3) {
    throw new Error("Step 4 failed: expected 3-5 distinct angles");
  }

  session.step2 = {
    ...session.step2,
    competitorAngle: {
      mainAngle: step3a.mainAngle || "",
      focusAreas: Array.isArray(step3a.focusAreas) ? step3a.focusAreas : [],
      ignoredAreas: Array.isArray(step3a.ignoredAreas) ? step3a.ignoredAreas : [],
    },
  };

  session.step4 = gaps;
  session.coreAngle = undefined;
  return { step4: gaps };
}

async function handleStep4Select(
  session: PilotSession,
  data: CoreAngleSelection
): Promise<{ coreAngle: CoreAngleSelection }> {
  if (!session.step4 || !Array.isArray(session.step4.angles) || session.step4.angles.length === 0) {
    throw new Error("Step 4 data required before selecting core angle");
  }

  const idx = Number.isInteger(data?.angleIndex) ? data.angleIndex : -1;
  if (idx < 0 || idx >= session.step4.angles.length) {
    throw new Error("Choose one core angle. Multiple angles will weaken the video.");
  }

  const selected = session.step4.angles[idx];

  const reasoning = (data.reasoning || "").trim();
  const realWorldExample = (data.realWorldExample || "").trim();
  const emotionalRelevance = (data.emotionalRelevance || "").trim();
  const challengeResponse = (data.challengeResponse || "").trim();

  if (!reasoning || !realWorldExample || !emotionalRelevance) {
    throw new Error("Choose one core angle and justify it with reasoning, a real-world example, and emotional relevance.");
  }

  const gptChallengePrompt = `
You are validating whether this core-angle justification is specific and strong.

Core angle:
${selected.name} — ${selected.description}

User justification:
- Why this angle: ${reasoning}
- Real-world example: ${realWorldExample}
- Emotional relevance: ${emotionalRelevance}
- Challenge response: ${challengeResponse || "Not provided"}

Each angle MUST:
- Be a claim you can say on camera in 1 sentence
- Contain tension (X vs Y)
- Imply a clear enemy or mistake

Reject if it sounds like a topic, not an argument.

Return JSON only:
{
  "isStrong": true,
  "challenge": "One sharp follow-up challenge if weak, else empty",
  "reason": "Why strong/weak",
  "score": {
    "reasoning": 0,
    "realWorldGrounding": 0,
    "emotionalRelevance": 0
  }
}

Scoring guide:
- 8-10: concrete and personal
- 5-7: partly specific
- 0-4: generic/vague
`;

  const gptChallengeResp = await openai.chat.completions.create({
    model: modelForStep("step4"),
    messages: [{ role: "user", content: gptChallengePrompt }],
    temperature: 0.2,
  });

  const gptChallengeRaw = gptChallengeResp.choices[0].message.content || "{}";
  const gptChallenge = JSON.parse(gptChallengeRaw) as {
    isStrong?: boolean;
    challenge?: string;
    reason?: string;
  };

  let finalChallengeResponse = challengeResponse;

  if (!gptChallenge.isStrong) {
    const claudeChallengePrompt = `
User's core-angle justification is weak. Ask one deeper interview question to force specificity.

Core angle:
${selected.name} — ${selected.description}

Current justification:
- Why: ${reasoning}
- Example: ${realWorldExample}
- Emotional relevance: ${emotionalRelevance}

Return JSON only:
{
  "followUpQuestion": "One hard, specific question",
  "requiredDirection": "What the user must clarify"
}
`;

    const claudeChallengeResp = await openai.chat.completions.create({
      model: modelForStep("step3b"),
      messages: [{ role: "user", content: claudeChallengePrompt }],
      temperature: 0.2,
    });

    const claudeRaw = claudeChallengeResp.choices[0].message.content || "{}";
    const claudeResult = JSON.parse(claudeRaw) as {
      followUpQuestion?: string;
      requiredDirection?: string;
    };

    finalChallengeResponse =
      finalChallengeResponse ||
      `${claudeResult.followUpQuestion || gptChallenge.challenge || "Be more specific."} ${claudeResult.requiredDirection || ""}`.trim();
  }

  session.coreAngle = {
    angleIndex: idx,
    angleName: selected.name,
    angleDescription: selected.description,
    reasoning,
    realWorldExample,
    emotionalRelevance,
    challengeResponse: finalChallengeResponse,
    confirmation: `This video will focus on ONE core angle: ${selected.name}. All content will reinforce it.`,
  };

  return { coreAngle: session.coreAngle };
}

// STEP 5: HUMAN INPUT — Already handled in UI (no API call)
async function handleStep5(session: PilotSession): Promise<{ step5Guidance: Step5InputGuidance }> {
  if (!session.step2 || !session.step3 || !session.step4 || !session.coreAngle) {
    throw new Error("Step 2, Step 3, Step 4, and core angle selection are required");
  }

  const prompt = `
You are a sharp content director.

Use these inputs to request specific human stories/moments for script quality:

Step 2 Logic Analysis:
${JSON.stringify(session.step2)}

Step 3 POV:
${JSON.stringify(session.step3)}

Step 4 Strategic Gaps & Angles:
${JSON.stringify(session.step4)}

Selected Core Angle:
${JSON.stringify(session.coreAngle)}

Competitor angle context:
${JSON.stringify(session.step2?.competitorAngle || {})}

POV RULE:
- POV must be derived from the selected core angle.
- If POV sounds similar to competitor angle, reject and refine.
- Tell me a moment you would hesitate to say publicly but proves this angle is true.

Return strict JSON:
{
  "rationale": "Why these human inputs are needed based on analysis",
  "missingSignals": [
    "Which emotional or experiential proof is still missing",
    "Another missing signal"
  ],
  "deepDiveQuestions": [
    "Angle-specific question 1",
    "Angle-specific question 2",
    "Angle-specific question 3"
  ],
  "requestedInputs": [
    {
      "id": "input_1",
      "label": "Specific human input label",
      "prompt": "What exactly the user should provide",
      "whyNeeded": "Which gap/weakness this input fixes",
      "required": true
    }
  ],
  "minimumRequired": 3
}

Rules:
- No generic wording.
- Each requested input must mention what weakness/gap it fixes.
- deepDiveQuestions must explicitly reference the selected core angle and push for concrete details.
- At least one deepDiveQuestion must force the user to state how their POV differs from competitor framing.
- Generate 3-5 deepDiveQuestions. Each question must stand alone.
- Generate 4-6 requestedInputs and keep each prompt under 180 characters.
- Ask for material that only a human can provide (specific memory, detail, contradiction, vulnerability).
- JSON only.
`;

  const response = await openai.chat.completions.create({
    model: modelForStep("step7"),
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
  });

  const content = response.choices[0].message.content || "{}";
  const parsed = JSON.parse(content) as Partial<Step5InputGuidance>;
  const guidance: Step5InputGuidance = {
    rationale:
      parsed.rationale ||
      "Add lived proof that strengthens the selected core angle and removes generic claims.",
    missingSignals: Array.isArray(parsed.missingSignals) ? parsed.missingSignals : [],
    deepDiveQuestions:
      Array.isArray(parsed.deepDiveQuestions) && parsed.deepDiveQuestions.length > 0
        ? parsed.deepDiveQuestions.slice(0, 5)
        : [
            "What exact moment made you believe this core angle is true?",
            "Which decision did you or someone else make that proves this angle?",
            "What uncomfortable detail would most people avoid admitting here?",
          ],
    requestedInputs:
      Array.isArray(parsed.requestedInputs) && parsed.requestedInputs.length > 0
        ? parsed.requestedInputs.slice(0, 6).map((item, index) => ({
            id: item?.id || `input_${index + 1}`,
            label: item?.label || `Requested Input ${index + 1}`,
            prompt:
              item?.prompt ||
              "Add one concrete human detail that strengthens the selected core angle.",
            whyNeeded: item?.whyNeeded || "Adds lived proof and reduces generic claims.",
            required: item?.required !== false,
          }))
        : [
            {
              id: "story_1",
              label: "Story 1",
              prompt: "Give one real story where this core angle directly explains the outcome.",
              whyNeeded: "Adds concrete lived proof for the core angle.",
              required: true,
            },
            {
              id: "story_2",
              label: "Story 2",
              prompt: "Give a second story in a different context but proving the same core angle.",
              whyNeeded: "Prevents one-example bias and reinforces the thesis.",
              required: true,
            },
            {
              id: "emotional_turn",
              label: "Emotional Turning Point",
              prompt: "Share the emotional moment that made this angle undeniable for you.",
              whyNeeded: "Injects emotional credibility into the narrative.",
              required: true,
            },
            {
              id: "metaphor",
              label: "Metaphor Source",
              prompt: "Provide one metaphor source that makes this angle instantly clear.",
              whyNeeded: "Improves explanation speed and memorability.",
              required: false,
            },
          ],
    minimumRequired:
      typeof parsed.minimumRequired === "number" && parsed.minimumRequired > 0
        ? Math.min(Math.max(parsed.minimumRequired, 1), 6)
        : 3,
  };

  session.step5Guidance = guidance;
  return { step5Guidance: guidance };
}

// STEP 6: INPUT VALIDATION — Check quality of human inputs
async function handleStep6(
  session: PilotSession,
  data: Step5HumanInput
): Promise<any> {
  if (!session.coreAngle || !session.step3) {
    throw new Error("Core angle and initial POV are required before Step 6");
  }

  const deepDiveText = (data.angleDeepDiveAnswers || [])
    .filter((item) => item?.question && item?.answer)
    .map((item, index) => `${index + 1}. Q: ${item.question}\nA: ${item.answer}`)
    .join("\n\n");

  const requestedMaterialText = summarizeStep5Material(data);

  const prompt = `
You are running STEP 6 — POV INTERVIEW MODE.

Selected core angle:
${session.coreAngle.angleName} — ${session.coreAngle.angleDescription}

Initial POV material:
- Believe: ${session.step3.whatYouBelieve}
- Attack: ${session.step3.whatYouAttack}
- Defend: ${session.step3.whoYouDefend}

Human material:
Requested human inputs:
${requestedMaterialText}
Deep angle evidence:
${deepDiveText || "None provided"}

Run a compressed interview refinement in 1 pass (cost-optimized):
1) Challenge assumptions
2) Clarify boundaries
3) Personal connection
4) Push uncomfortable truth
5) Compress to 1-3 lines

Rules:
- Non-generic only
- Must stay derived from selected core angle
- Limit to 1-2 rounds behavior in this single response
- Reject slogan-like POV lines
- POV lines must be personal, specific, and slightly risky to say aloud
If POV sounds like:
- motivational
- general advice
- could apply to anyone

→ REJECT and force rewrite

Return JSON only:
{
  "isValid": true,
  "feedback": "Validation + what was sharpened",
  "approved": true,
  "povLockedLines": [
    "line 1",
    "line 2",
    "line 3"
  ],
  "qualityCheck": {
    "personal": "high | medium | low",
    "specific": "high | medium | low",
    "genericRisk": "low | medium | high"
  }
}
`;

  const response = await openai.chat.completions.create({
    model: modelForStep("step6"),
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const content = response.choices[0].message.content || "";
  const validation = JSON.parse(content) as {
    isValid?: boolean;
    feedback?: string;
    approved?: boolean;
    povLockedLines?: string[];
  };

  session.step5 = data;
  session.step6 = {
    isValid: Boolean(validation.isValid),
    feedback: validation.feedback || "POV refined and validated.",
    approved: validation.approved ?? Boolean(validation.isValid),
    povLockedLines: Array.isArray(validation.povLockedLines)
      ? validation.povLockedLines.slice(0, 3)
      : [],
  };

  return { step6: session.step6 };
}

// STEP 7: STRUCTURE BLUEPRINT — Create outline
async function handleStep7(session: PilotSession): Promise<any> {
  if (!session.step5 || !session.coreAngle) {
    throw new Error("Step 5 data and core angle selection are required");
  }

  const prompt = `
Create content structure blueprint using:
- POV: ${session.step3?.whatYouBelieve}
- Core Angle (must be the only primary direction): ${session.coreAngle.angleName} — ${session.coreAngle.angleDescription}
- Human material provided by user:
${summarizeStep5Material(session.step5)}
- Angle deep-dive evidence: ${JSON.stringify(session.step5.angleDeepDiveAnswers || [])}

CORE ANGLE RULES:
- User selected ONLY ONE core angle. Do not combine with other angles.
- Supporting ideas may exist, but they must only reinforce the core angle.
- Include a consistencyCheck field that verifies each section supports the core angle.

Return JSON blueprint:
{
  "hookDirection": "Hook idea (NOT full script)",
  "sections": [
    { "title": "Section 1", "purpose": "Purpose", "contentSource": "From story/moment/etc" },
    { "title": "Section 2", "purpose": "Purpose", "contentSource": "..." }
  ],
  "emotionalSpikes": [
    { "location": "Where", "trigger": "What triggers it" },
    { "location": "Where", "trigger": "What triggers it" }
  ],
  "consistencyCheck": {
    "coreAngle": "Repeat the selected core angle",
    "driftDetected": false,
    "fixes": ["If drift exists, list section fixes. Otherwise empty array."]
  },
  "angleSupportMap": [
    { "section": "Section 1", "supportsCoreAngleBy": "How this section reinforces core angle" }
  ],
  "dataSuggestions": {
    "needed": true,
    "queries": [
      "specific manual query 1",
      "specific manual query 2",
      "specific manual query 3"
    ],
    "note": "Do NOT guess numbers. Use manual research tools for real data."
  }
}

Rules for dataSuggestions:
- Optional block; include only if reinforcement data would strengthen argument.
- Suggest only search queries, never numbers.
- Maximum 3 queries.
- Hook direction must be idea-only (no full lines).
- Every section purpose must map to the same core angle.

JSON only. Do NOT write full script.
`;

  const response = await openai.chat.completions.create({
    model: modelForStep("step8"),
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || "";
  const blueprint = JSON.parse(content);

  session.step7 = blueprint;
  return { step7: blueprint };
}

// STEP 8: PERMISSION GATE — Ask user before writing
function handleStep8(): { step: number; message: string } {
  return {
    step: 8,
    message: "Ready to write the full script now? (Yes/No)",
  };
}

// STEP 9: SCRIPT GENERATION — Write full script
async function handleStep9(session: PilotSession): Promise<any> {
  if (!session.step7 || !session.coreAngle) {
    throw new Error("Step 7 blueprint and core angle selection are required");
  }

  const prompt = `
Write full script using:
- Hook: ${session.step7.hookDirection}
- Blueprint sections: ${JSON.stringify(session.step7.sections)}
- Emotional spikes: ${JSON.stringify(session.step7.emotionalSpikes)}
- Creator voice: ${session.inputContract.creatorVoice}
- Core angle (must remain central): ${session.coreAngle.angleName} — ${session.coreAngle.angleDescription}
- Angle deep-dive evidence to weave in: ${JSON.stringify(session.step5?.angleDeepDiveAnswers || [])}

ANGLE CONSISTENCY CHECK (MANDATORY BEFORE OUTPUT):
- Verify every section supports the core angle.
- If any part drifts into another angle, adjust or remove it.
- Script must feel like one idea pushed deeply.

FINAL PRINCIPLE:
- Competitor = demand
- Angle = direction
- POV = belief
- Data = reinforcement
- NEVER confuse these roles.

Include:
- Strong hook
- Natural flow
- Embedded emotion + metaphor
- All stories/moments woven in
- DO NOT fully complete every section. Leave 2-4 deliberate HUMAN INSERTION SLOTS.
- Use explicit markers inside script text like: [HUMAN_INSERT_1], [HUMAN_INSERT_2].
- Each slot must match context and strengthen the same core angle.
- Style target: spoken, direct, no lecture tone.
- Anti-generic rule: every paragraph must contain a concrete detail, decision, or scene.
- Anti-competitor rule: avoid reusing competitor framing and phrasing patterns.
ANTI-COMPETITOR RULE (STRICT):
- You MUST NOT reuse:
  + Same argument order
  + Same example type
  + Same emotional progression
- If similarity detected → restructure narrative entirely

Return JSON:
{
  "hook": "Hook text only",
  "fullScript": "Baseline script text",
  "scriptWithHumanSlots": "Script containing [HUMAN_INSERT_n] markers",
  "naturalFlow": "Notes on pacing",
  "embeddedEmotion": "Where emotions land",
  "humanInsertions": [
    {
      "slotId": "HUMAN_INSERT_1",
      "location": "After section X",
      "purpose": "What this slot needs to do",
      "whatToAdd": "Specific human material to add",
      "whyNow": "Why it belongs here in the narrative",
      "exampleStarter": "A realistic sentence starter",
      "consistencyNote": "How this reinforces the one core angle"
    }
  ],
  "qualityCheck": {
    "coreAngleConsistency": "high | medium | low",
    "genericRisk": "low | medium | high",
    "competitorSimilarityRisk": "low | medium | high",
    "notes": "One sentence"
  }
}

JSON only.
`;

  const response = await openai.chat.completions.create({
    model: modelForStep("step9"),
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
  });

  const content = response.choices[0].message.content || "";
  const parsed = JSON.parse(content) as Partial<import("@/app/lib/types").Step9ScriptGeneration>;
  const humanInsertions = Array.isArray(parsed.humanInsertions)
    ? parsed.humanInsertions
        .filter((item) => item?.slotId && item?.whatToAdd)
        .slice(0, 4)
    : [];

  const script = {
    hook: parsed.hook || "",
    fullScript: parsed.fullScript || parsed.scriptWithHumanSlots || "",
    scriptWithHumanSlots: parsed.scriptWithHumanSlots || parsed.fullScript || "",
    naturalFlow: parsed.naturalFlow || "",
    embeddedEmotion: parsed.embeddedEmotion || "",
    humanInsertions,
  };

  session.step9 = script;
  session.finalScript = script.scriptWithHumanSlots || script.fullScript;
  return { step9: script };
}

// STEP 10: DISTORTION REMINDER — Humanization tips
async function handleStep10(
  session: PilotSession,
  data: Step10HumanizationInput
): Promise<{ step10: Step10DistortionReminder }> {
  if (!session.step9 || !session.coreAngle) {
    throw new Error("Step 9 script and core angle selection are required");
  }

  const slotEdits = Array.isArray(data?.slotEdits) ? data.slotEdits : [];
  const resolvedSlotEdits = slotEdits.filter(
    (slot) => slot?.slotId && (slot?.userText || "").trim().length > 0
  );

  const prompt = `
You are a senior script editor.

Goal:
- Rewrite the script into a final production-ready version.
- Integrate user-provided HUMAN_INSERT slots naturally.
- Preserve one core angle throughout the full narrative.
- Add humanization (pauses, imperfect phrasing, spoken cadence) without losing clarity.

Core angle (must stay central):
${session.coreAngle.angleName} — ${session.coreAngle.angleDescription}

Current script draft with slot markers:
${session.step9.scriptWithHumanSlots || session.step9.fullScript}

Human slot guidance from Step 9:
${JSON.stringify(session.step9.humanInsertions || [], null, 2)}

User-provided slot content:
${JSON.stringify(resolvedSlotEdits, null, 2)}

Additional final notes from user:
${data?.finalNotes || "None"}

Required output behavior:
- Resolve every possible [HUMAN_INSERT_n] marker by integrating user text with context.
- If a marker has no user text, keep a short placeholder line asking creator to fill later.
- Keep narrative flow smooth and cohesive.
- Ensure all sections reinforce ONLY the core angle.
- Remove any angle drift.
- Keep spoken rhythm and natural imperfection while preserving clarity.
- Do not flatten emotional peaks introduced by human inserts.
- Inject 2–3 imperfect spoken patterns:
  + interruptions
  + self-corrections
  + half-finished sentences

Return strict JSON:
{
  "finalScript": "Final rewritten script text",
  "slotResolution": [
    {
      "slotId": "HUMAN_INSERT_1",
      "usedText": "What user text was integrated",
      "integratedWhere": "Where it was integrated"
    }
  ],
  "consistencyCheck": {
    "coreAngle": "Restated core angle",
    "driftDetected": false,
    "fixApplied": "What was fixed to remove drift"
  },
  "tips": [
    { "technique": "Add pauses", "description": "..." },
    { "technique": "Slight repetition", "description": "..." },
    { "technique": "Imperfect phrasing", "description": "..." }
  ],
  "exampleEdit": "One short before/after humanization example",
  "qualityCheck": {
    "contextFidelity": "high | medium | low",
    "humanizationStrength": "high | medium | low",
    "notes": "One sentence"
  }
}

JSON only.
`;

  const response = await openai.chat.completions.create({
    model: modelForStep("step10"),
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
  });

  const content = response.choices[0].message.content || "{}";
  const parsed = JSON.parse(content) as Partial<Step10DistortionReminder>;

  const step10: Step10DistortionReminder = {
    tips: Array.isArray(parsed.tips)
      ? parsed.tips
      : [
          {
            technique: "Add pauses",
            description: "Insert natural breath points to improve pacing and emphasis.",
          },
          {
            technique: "Slight repetition",
            description: "Repeat one key phrase 2-3 times naturally to anchor memory.",
          },
          {
            technique: "Imperfect phrasing",
            description: "Keep spoken texture with natural, imperfect conversational phrasing.",
          },
        ],
    exampleEdit:
      parsed.exampleEdit ||
      "Before: I made a mistake in finance. After: I chased one bad decision and watched my savings disappear.",
    finalScript: parsed.finalScript || (session.step9.scriptWithHumanSlots || session.step9.fullScript),
    slotResolution: Array.isArray(parsed.slotResolution)
      ? parsed.slotResolution
      : resolvedSlotEdits.map((slot) => ({
          slotId: slot.slotId,
          usedText: slot.userText,
          integratedWhere: "Integrated in context near matching marker.",
        })),
    consistencyCheck: parsed.consistencyCheck || {
      coreAngle: session.coreAngle.angleName,
      driftDetected: false,
      fixApplied: "Maintained one core angle across all sections.",
    },
  };

  session.step10 = step10;
  session.finalScript = step10.finalScript;

  return { step10 };
}
