import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { AnalysisResult } from "@/app/lib/types";
import { STEP_1_PROMPT, STEP_2_5_PROMPT, STEP_3A_PROMPT, STEP_3B_PROMPT } from "@/app/lib/prompt";

// OpenAI client — server-side only. Key never sent to browser.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const STEP_2_PROMPT = `
You are an elite audience psychologist.

Analyze who this video is really speaking to and what pressure it creates inside the viewer.

Return ONLY valid JSON:

{
  "viewer": {
    "profile": "Who this is really for in plain language",
    "externalMask": "What this viewer pretends is fine on the outside",
    "internalFear": "What they are privately afraid might be true",
    "triggerMoment": "The exact line, idea, or moment that hits that fear"
  },
  "egoThreat": {
    "whatHurts": "What part of the viewer identity gets threatened",
    "comparison": "Who they feel behind compared to",
    "privateTruth": "The truth they do not want to say out loud"
  },
  "painMap": [
    {
      "pain": "Specific pain",
      "feeling": "What it feels like emotionally",
      "realScenario": "Real-life moment where this pain shows up"
    }
  ],
  "desire": {
    "surface": "What they say they want",
    "real": "What they actually want underneath",
    "identityShift": "Who they want to become if this works"
  }
}

Rules:
- painMap: EXACTLY 3 items
- Every field must be grounded in the script or comments
- Speak directly to the viewer using "you" where natural
- No vague audience labels or generic psych language
`;

type JsonRecord = Record<string, unknown>;
type PovMode = NonNullable<AnalysisResult["differentiation"]>["povMode"];

const STRUCTURE_PHASES = [
  "Hook",
  "Setup",
  "Escalation",
  "Insight Drop",
  "Reinforcement",
  "Payoff / Close",
] as const;

const DEFAULT_POV_MODE: PovMode = "strategic";

// ─────────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────────
function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter(Boolean)
      .join("; ");
  }
  if (isRecord(value)) {
    if (typeof value.text === "string") {
      return value.text.trim();
    }
    if (typeof value.value === "string") {
      return value.value.trim();
    }
  }
  return fallback;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }
  const single = asString(value);
  return single ? [single] : [];
}

function pickValue(record: JsonRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in record && record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
  return undefined;
}

function pickString(record: JsonRecord, ...keys: string[]): string {
  return asString(pickValue(record, ...keys));
}

function pickRecord(record: JsonRecord, ...keys: string[]): JsonRecord {
  return asRecord(pickValue(record, ...keys));
}

function pickArray(record: JsonRecord, ...keys: string[]): unknown[] {
  return asArray(pickValue(record, ...keys));
}

function normalizeExactArray<T>(
  items: unknown[],
  expectedCount: number,
  normalizeItem: (item: unknown, index: number) => T,
  createFallback: (index: number) => T
): T[] {
  const normalized = items.slice(0, expectedCount).map(normalizeItem);
  for (let index = normalized.length; index < expectedCount; index += 1) {
    normalized.push(createFallback(index));
  }
  return normalized;
}

function extractJsonObject(raw: string): JsonRecord {
  const trimmed = raw.trim();
  const candidates = [trimmed];

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    candidates.push(fencedMatch[1].trim());
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (isRecord(parsed)) {
        return parsed;
      }
    } catch {
      // Keep trying the next candidate.
    }
  }

  throw new Error("Failed to parse model JSON output");
}

async function callBatch(
  systemPrompt: string,
  userMessage: string,
  batchName: string,
  maxRetries = 2
): Promise<Record<string, unknown>> {
  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_completion_tokens: 4000,
        response_format: { type: "json_object" },
      });
    } catch (error) {
      console.warn(`[${batchName}] gpt-5-mini failed, trying gpt-4o-mini:`, error);
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 4000,
        response_format: { type: "json_object" },
      });
    }

    const raw = completion.choices[0]?.message?.content;
    const finishReason = completion.choices[0]?.finish_reason;

    if (!raw) {
      const warning = `[${batchName}] attempt ${attempt} failed: empty response`;
      console.warn(warning);
      if (attempt <= maxRetries) {
        console.warn(`[${batchName}] retrying... (${attempt + 1}/${maxRetries + 1})`);
        await new Promise((resolve) => setTimeout(resolve, 600));
        continue;
      }
      throw new Error(`Batch ${batchName}: empty response from model after ${attempt} attempts`);
    }

    if (finishReason === "length") {
      console.warn(`[${batchName}] finish_reason=length — response may be truncated`);
    }

    try {
      return extractJsonObject(raw);
    } catch (error) {
      const errMessage = `Batch ${batchName}: failed to parse JSON response (attempt ${attempt})`;
      console.warn(errMessage, raw);
      if (attempt <= maxRetries) {
        console.warn(`[${batchName}] retrying JSON parse... (${attempt + 1}/${maxRetries + 1})`);
        await new Promise((resolve) => setTimeout(resolve, 600));
        continue;
      }
      throw new Error(errMessage);
    }
  }

  throw new Error(`Batch ${batchName}: unhandled error`);
}

function normalizeStep1(raw: Record<string, unknown>): Pick<AnalysisResult, "coreTruth" | "attention" | "persuasion" | "structure" | "financialReality" | "structureDNA"> {
  const root = asRecord(raw);
  const attention = pickRecord(root, "attention");
  const patternBreak = pickRecord(attention, "patternBreak");
  const persuasion = pickRecord(root, "persuasion");
  const structure = pickRecord(root, "structure");
  const financialReality = pickRecord(root, "financialReality");
  const structureDNA = pickRecord(root, "structureDNA");

  const phaseSource = pickArray(structureDNA, "phases");
  const phases = normalizeExactArray(
    phaseSource,
    STRUCTURE_PHASES.length,
    (item, index) => {
      const phase = asRecord(item);
      return {
        phase: pickString(phase, "phase") || STRUCTURE_PHASES[index],
        timeRange: pickString(phase, "timeRange", "timestamp", "time") || "N/A",
        goal: pickString(phase, "goal") || "N/A",
        tactic: pickString(phase, "tactic", "technique") || "N/A",
        viewerState: pickString(phase, "viewerState", "state") || "N/A",
      };
    },
    (index) => ({
      phase: STRUCTURE_PHASES[index],
      timeRange: "N/A",
      goal: "N/A",
      tactic: "N/A",
      viewerState: "N/A",
    })
  );

  const rawTransitions = pickArray(structureDNA, "transitions").map((item) => asRecord(item));
  const directRetention = pickArray(structureDNA, "retentionMoments", "retention").map((item) => asRecord(item));

  const transitions = rawTransitions
    .filter((item) => pickString(item, "from", "to", "method", "lineExample"))
    .map((item) => ({
      from: pickString(item, "from") || "Unknown",
      to: pickString(item, "to") || "Unknown",
      method: pickString(item, "method") || "N/A",
      lineExample: pickString(item, "lineExample", "example") || "N/A",
    }));

  const inferredRetention = rawTransitions.filter(
    (item) =>
      !pickString(item, "from", "to") &&
      Boolean(pickString(item, "whyItWorks", "pattern", "moment"))
  );

  const retentionMoments = [...directRetention, ...inferredRetention].map((item) => ({
    moment: pickString(item, "moment", "lineExample", "method") || "Retention moment",
    whyItWorks: pickString(item, "whyItWorks", "reason") || "N/A",
    pattern: pickString(item, "pattern", "type") || "N/A",
  }));

  return {
    coreTruth: {
      insight: pickString(pickRecord(root, "coreTruth"), "insight") || pickString(root, "insight"),
      trigger: pickString(pickRecord(root, "coreTruth"), "trigger") || pickString(root, "trigger"),
    },
    attention: {
      patternBreak: {
        whatFeelsDifferent: pickString(patternBreak, "whatFeelsDifferent") || pickString(attention, "whatFeelsDifferent"),
        whyItGrabs: pickString(patternBreak, "whyItGrabs") || pickString(attention, "whyItGrabs"),
      },
      escalation: pickString(attention, "escalation"),
      retention: pickString(attention, "retention"),
    },
    persuasion: {
      beliefDestroyed: pickString(persuasion, "beliefDestroyed", "beliefChallenged"),
      beliefInstalled: pickString(persuasion, "beliefInstalled", "newBelief"),
    },
    structure: {
      hookMechanism: pickString(structure, "hookMechanism"),
      revealMoment: pickString(structure, "revealMoment"),
      payoff: pickString(structure, "payoff"),
    },
    financialReality: {
      numbersUsed: pickString(financialReality, "numbersUsed"),
      perceptionEffect: pickString(financialReality, "perceptionEffect"),
      manipulation: pickString(financialReality, "manipulation"),
    },
    structureDNA: {
      phases,
      transitions,
      retentionMoments,
    },
  };
}

function normalizeStep2(raw: Record<string, unknown>): Pick<AnalysisResult, "viewer" | "egoThreat" | "painMap" | "desire"> {
  const root = asRecord(raw);
  const viewer = pickRecord(root, "viewer", "audienceProfile");
  const egoThreat = pickRecord(root, "egoThreat");
  const desire = pickRecord(root, "desire", "desireMap");

  return {
    viewer: {
      profile: pickString(viewer, "profile", "idealViewer", "viewerProfile"),
      externalMask: pickString(viewer, "externalMask", "publicStory", "mask", "surfaceIdentity"),
      internalFear: pickString(viewer, "internalFear", "fear", "coreFear", "hiddenFear"),
      triggerMoment: pickString(viewer, "triggerMoment", "moment", "specificTrigger"),
    },
    egoThreat: {
      whatHurts: pickString(egoThreat, "whatHurts", "painPoint"),
      comparison: pickString(egoThreat, "comparison"),
      privateTruth: pickString(egoThreat, "privateTruth", "truth"),
    },
    painMap: normalizeExactArray(
      pickArray(root, "painMap"),
      3,
      (item) => {
        const pain = asRecord(item);
        return {
          pain: pickString(pain, "pain", "painPoint", "name"),
          feeling: pickString(pain, "feeling", "emotionalDepth", "explanation"),
          realScenario: pickString(pain, "realScenario", "realLifeScenario", "realLifeExample"),
        };
      },
      () => ({ pain: "", feeling: "", realScenario: "" })
    ),
    desire: {
      surface: pickString(desire, "surface", "whatTheyWant"),
      real: pickString(desire, "real", "emotionalStateChasing", "hiddenDesire"),
      identityShift: pickString(desire, "identityShift", "transformation"),
    },
  };
}

function normalizeStep25(raw: Record<string, unknown>): Pick<AnalysisResult, "differentiation"> {
  const root = asRecord(raw);
  const truthFilter = pickRecord(root, "truthFilter");
  const newPOV = pickRecord(root, "newPOV", "pov", "position");
  const povModeCandidate = pickString(root, "povMode");
  const povMode = ["anti-system", "balanced", "strategic"].includes(povModeCandidate)
    ? (povModeCandidate as PovMode)
    : DEFAULT_POV_MODE;

  return {
    differentiation: {
      povMode,
      agreement: pickString(root, "agreement", "commonGround", "whatStillWorks"),
      destruction: asStringArray(pickValue(root, "destruction", "destructionPoints", "attacks")),
      newPOV: {
        core: pickString(newPOV, "core"),
        edge: pickString(newPOV, "edge"),
      },
      truthFilter: {
        fakeGood: pickString(truthFilter, "fakeGood"),
        realTruth: pickString(truthFilter, "realTruth"),
      },
    },
  };
}

function normalizeStep3A(raw: Record<string, unknown>): Pick<AnalysisResult, "angles" | "contentIdeas"> {
  const root = asRecord(raw);

  return {
    angles: normalizeExactArray(
      pickArray(root, "angles"),
      5,
      (item) => {
        const angle = asRecord(item);
        return {
          type: pickString(angle, "type"),
          idea: pickString(angle, "idea", "title", "claim"),
          whyItWorks: pickString(angle, "whyItWorks", "reason"),
        };
      },
      () => ({ type: "", idea: "", whyItWorks: "" })
    ),
    contentIdeas: normalizeExactArray(
      pickArray(root, "contentIdeas", "ideas"),
      3,
      (item) => {
        const idea = asRecord(item);
        return {
          title: pickString(idea, "title"),
          angle: pickString(idea, "angle"),
          coreConflict: pickString(idea, "coreConflict", "conflict"),
        };
      },
      () => ({ title: "", angle: "", coreConflict: "" })
    ),
  };
}

function normalizeStep3B(raw: Record<string, unknown>): Pick<AnalysisResult, "hooks" | "script" | "antiAI" | "risk"> {
  const root = asRecord(raw);
  const script = pickRecord(root, "script");
  const antiAI = pickRecord(root, "antiAI");
  const risk = pickRecord(root, "risk");

  return {
    hooks: normalizeExactArray(
      pickArray(root, "hooks"),
      5,
      (item) => {
        const hook = asRecord(item);
        return {
          type: pickString(hook, "type"),
          text: pickString(hook, "text", "hook"),
        };
      },
      () => ({ type: "", text: "" })
    ),
    script: {
      opening: pickString(script, "opening"),
      closing: pickString(script, "closing"),
    },
    antiAI: {
      avoid: asStringArray(pickValue(antiAI, "avoid", "avoidList")),
      fix: pickString(antiAI, "fix"),
    },
    risk: {
      whyFeelsAI: pickString(risk, "whyFeelsAI", "whyItFeelsAI"),
      fix: pickString(risk, "fix"),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// POST /api/analyze
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured in .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { script, comments } = body as { script?: string; comments?: string[] };

    if (!script || script.trim().length < 50) {
      return NextResponse.json(
        { error: "Script is required and must be at least 50 characters." },
        { status: 400 }
      );
    }

    // Convert comments array to newline-separated string for the prompt
    const commentsText = comments && comments.length > 0 
      ? comments.filter(c => c.trim()).join("\n")
      : "";

    // Build the shared user message sent to all 3 batches
    const userMessage = `Here is the YouTube script to analyze:

${script.trim()}

${
  commentsText
    ? `Here are the viewer comments:\n---\n${commentsText}\n---`
    : "No viewer comments were provided."
}`;

    // ── Run all batches in parallel ────────────────────────
    const [step1, step2, step25, step3a, step3b] = await Promise.all([
      callBatch(STEP_1_PROMPT, userMessage, "STEP_1"),
      callBatch(STEP_2_PROMPT, userMessage, "STEP_2"),
      callBatch(STEP_2_5_PROMPT, userMessage, "STEP_2_5"),
      callBatch(STEP_3A_PROMPT, userMessage, "STEP_3A"),
      callBatch(STEP_3B_PROMPT, userMessage, "STEP_3B"),
    ]);

    const normalizedComments = (comments ?? []).map((comment) => comment.trim()).filter(Boolean);

    const result: AnalysisResult = {
      ...normalizeStep1(step1),
      ...normalizeStep2(step2),
      ...normalizeStep25(step25),
      ...normalizeStep3A(step3a),
      ...normalizeStep3B(step3b),
      inputComments: normalizedComments,
    };

    return NextResponse.json({ result });
  } catch (err: unknown) {
    console.error("[/api/analyze] Error:", err);
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
