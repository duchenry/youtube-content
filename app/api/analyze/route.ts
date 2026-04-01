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
type BatchName = "STEP_1" | "STEP_2" | "STEP_2_5" | "STEP_3A" | "STEP_3B";

type AnalyzeProfile = "quality-first" | "balanced" | "cost-first";

type BatchConfig = {
  model: string;
  fallbackModel: string;
  retries: number;
  baseTokens: number;
  tokenStep: number;
  maxTokensCap: number;
};

const STRUCTURE_PHASES = [
  "Hook",
  "Setup",
  "Escalation",
  "Insight Drop",
  "Reinforcement",
  "Payoff / Close",
] as const;

const DEFAULT_POV_MODE: PovMode = "strategic";

const DEFAULT_PROFILE: AnalyzeProfile = "balanced";
const DEFAULT_FALLBACK_MODEL = "gpt-4o-mini";

function readIntEnv(name: string): number | undefined {
  const raw = process.env[name];
  if (!raw) {
    return undefined;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return Math.trunc(parsed);
}

function resolveProfile(): AnalyzeProfile {
  const raw = (process.env.ANALYZE_PROFILE ?? "").trim().toLowerCase();
  if (raw === "quality" || raw === "quality-first") {
    return "quality-first";
  }
  if (raw === "cost" || raw === "cost-first") {
    return "cost-first";
  }
  if (raw === "balanced") {
    return "balanced";
  }
  return DEFAULT_PROFILE;
}

function defaultConfigByProfile(profile: AnalyzeProfile, batchName: BatchName): BatchConfig {
  if (profile === "quality-first") {
    if (batchName === "STEP_3B") {
      return {
        model: "gpt-4o-mini",
        fallbackModel: DEFAULT_FALLBACK_MODEL,
        retries: 1,
        baseTokens: 1800,
        tokenStep: 600,
        maxTokensCap: 3200,
      };
    }
    if (batchName === "STEP_1") {
      return {
        model: "gpt-5-mini",
        fallbackModel: DEFAULT_FALLBACK_MODEL,
        retries: 2,
        baseTokens: 5500,
        tokenStep: 2000,
        maxTokensCap: 12000,
      };
    }
    return {
      model: "gpt-5-mini",
      fallbackModel: DEFAULT_FALLBACK_MODEL,
      retries: 2,
      baseTokens: 4200,
      tokenStep: 1500,
      maxTokensCap: 9000,
    };
  }

  if (profile === "cost-first") {
    if (batchName === "STEP_3B") {
      return {
        model: "gpt-4o-mini",
        fallbackModel: "gpt-4o-mini",
        retries: 1,
        baseTokens: 1200,
        tokenStep: 400,
        maxTokensCap: 2200,
      };
    }
    if (batchName === "STEP_1") {
      return {
        model: "gpt-5-mini",
        fallbackModel: DEFAULT_FALLBACK_MODEL,
        retries: 1,
        baseTokens: 4200,
        tokenStep: 1200,
        maxTokensCap: 7000,
      };
    }
    return {
      model: "gpt-4o-mini",
      fallbackModel: "gpt-4o-mini",
      retries: 1,
      baseTokens: 2600,
      tokenStep: 900,
      maxTokensCap: 5200,
    };
  }

  // balanced
  if (batchName === "STEP_3B") {
    return {
      model: "gpt-4o-mini",
      fallbackModel: DEFAULT_FALLBACK_MODEL,
      retries: 1,
      baseTokens: 1500,
      tokenStep: 500,
      maxTokensCap: 2800,
    };
  }
  if (batchName === "STEP_1") {
    return {
      model: "gpt-5-mini",
      fallbackModel: DEFAULT_FALLBACK_MODEL,
      retries: 2,
      baseTokens: 5000,
      tokenStep: 1800,
      maxTokensCap: 10000,
    };
  }
  return {
    model: "gpt-4o-mini",
    fallbackModel: DEFAULT_FALLBACK_MODEL,
    retries: 2,
    baseTokens: 3200,
    tokenStep: 1200,
    maxTokensCap: 7000,
  };
}

function resolveBatchConfig(profile: AnalyzeProfile, batchName: BatchName): BatchConfig {
  const defaults = defaultConfigByProfile(profile, batchName);
  const modelOverride = process.env[`OPENAI_MODEL_${batchName}`]?.trim();
  const fallbackModelOverride = process.env[`OPENAI_FALLBACK_MODEL_${batchName}`]?.trim();

  const retriesOverride = readIntEnv(`ANALYZE_RETRIES_${batchName}`);
  const baseTokensOverride = readIntEnv(`ANALYZE_BASE_TOKENS_${batchName}`);
  const tokenStepOverride = readIntEnv(`ANALYZE_TOKEN_STEP_${batchName}`);
  const maxTokensCapOverride = readIntEnv(`ANALYZE_MAX_TOKENS_${batchName}`);

  return {
    model: modelOverride || defaults.model,
    fallbackModel: fallbackModelOverride || defaults.fallbackModel,
    retries:
      retriesOverride !== undefined && retriesOverride >= 0
        ? retriesOverride
        : defaults.retries,
    baseTokens:
      baseTokensOverride !== undefined && baseTokensOverride > 0
        ? baseTokensOverride
        : defaults.baseTokens,
    tokenStep:
      tokenStepOverride !== undefined && tokenStepOverride >= 0
        ? tokenStepOverride
        : defaults.tokenStep,
    maxTokensCap:
      maxTokensCapOverride !== undefined && maxTokensCapOverride > 0
        ? maxTokensCapOverride
        : defaults.maxTokensCap,
  };
}

function tokenParamForModel(model: string, tokenCount: number): {
  max_completion_tokens?: number;
  max_tokens?: number;
} {
  // gpt-5 family uses max_completion_tokens in Chat Completions.
  if (model.startsWith("gpt-5")) {
    return { max_completion_tokens: tokenCount };
  }
  return { max_tokens: tokenCount };
}

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

function getPathValue(source: unknown, path: string): unknown {
  const tokens = path.match(/[^.[\]]+|\[(\d+)\]/g) ?? [];
  let current: unknown = source;

  for (const token of tokens) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (token.startsWith("[")) {
      const index = Number(token.slice(1, -1));
      if (!Array.isArray(current) || Number.isNaN(index)) {
        return undefined;
      }
      current = current[index];
      continue;
    }

    if (!isRecord(current)) {
      return undefined;
    }
    current = current[token];
  }

  return current;
}

function stringifyTemplateValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function renderPromptTemplate(template: string, context: JsonRecord): string {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, path: string) => {
    const value = getPathValue(context, path.trim());
    return stringifyTemplateValue(value);
  });
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

function extractMessageText(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  const textParts = content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      if (!isRecord(part)) {
        return "";
      }

      if (typeof part.text === "string") {
        return part.text;
      }

      if (isRecord(part.text) && typeof part.text.value === "string") {
        return part.text.value;
      }

      return "";
    })
    .filter(Boolean);

  return textParts.join("\n").trim();
}

async function callBatch(
  systemPrompt: string,
  userMessage: string,
  batchName: BatchName,
  config: BatchConfig
): Promise<Record<string, unknown>> {
  const maxRetries = config.retries;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    const maxCompletionTokens = Math.min(
      config.maxTokensCap,
      config.baseTokens + (attempt - 1) * config.tokenStep
    );
    const retryCompactNote =
      attempt > 1
        ? "\n\nIMPORTANT: Keep every string concise (max ~20 words) while preserving meaning. Return only valid JSON."
        : "";
    const requestUserMessage = `${userMessage}${retryCompactNote}`;

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: requestUserMessage },
        ],
        ...tokenParamForModel(config.model, maxCompletionTokens),
        response_format: { type: "json_object" },
      });
    } catch (error) {
      console.warn(
        `[${batchName}] ${config.model} failed, trying ${config.fallbackModel}:`,
        error
      );
      completion = await openai.chat.completions.create({
        model: config.fallbackModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: requestUserMessage },
        ],
        ...tokenParamForModel(config.fallbackModel, maxCompletionTokens),
        response_format: { type: "json_object" },
      });
    }

    const firstChoice = completion.choices[0];
    const finishReason = firstChoice?.finish_reason;
    const refusal =
      firstChoice && "message" in firstChoice && isRecord(firstChoice.message)
        ? asString(firstChoice.message.refusal)
        : "";
    const raw =
      firstChoice && "message" in firstChoice && isRecord(firstChoice.message)
        ? extractMessageText(firstChoice.message.content)
        : "";

    if (!raw) {
      const detail = [
        finishReason ? `finish_reason=${finishReason}` : "",
        refusal ? `refusal=${refusal}` : "",
      ]
        .filter(Boolean)
        .join(", ");
      const warning = `[${batchName}] attempt ${attempt} failed: empty response${
        detail ? ` (${detail})` : ""
      }`;
      console.warn(warning);
      if (attempt <= maxRetries) {
        console.warn(`[${batchName}] retrying... (${attempt + 1}/${maxRetries + 1})`);
        await new Promise((resolve) => setTimeout(resolve, 600));
        continue;
      }

      if (refusal) {
        throw new Error(`Batch ${batchName}: model refusal - ${refusal}`);
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

function normalizeStep1(raw: Record<string, unknown>): Pick<AnalysisResult, "coreTruth" | "attention" | "persuasion" | "structure" | "financialReality" | "proofMechanics" | "structureDNA"> {
  const root = asRecord(raw);
  const attention = pickRecord(root, "attention");
  const patternBreak = pickRecord(attention, "patternBreak");
  const persuasion = pickRecord(root, "persuasion");
  const structure = pickRecord(root, "structure");
  const financialReality = pickRecord(root, "financialReality", "proofMechanics");
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

  const normalizedFinancialReality = {
    numbersUsed:
      pickString(financialReality, "numbersUsed", "evidenceUsed") ||
      "Not explicitly stated in source; evidence is implied more than quantified.",
    perceptionEffect:
      pickString(financialReality, "perceptionEffect") ||
      "Makes the claim feel plausible through confident framing and selective proof.",
    manipulation:
      pickString(financialReality, "manipulation", "framing") ||
      "Uses sequencing and contrast framing to make the new belief feel inevitable.",
  };

  const transferablePattern =
    pickString(financialReality, "transferablePattern") ||
    "Topic-agnostic proof pattern inferred from source sequencing and contrast.";

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
    financialReality: normalizedFinancialReality,
    proofMechanics: {
      evidenceUsed: normalizedFinancialReality.numbersUsed,
      perceptionEffect: normalizedFinancialReality.perceptionEffect,
      framing: normalizedFinancialReality.manipulation,
      transferablePattern,
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
          riskLevel: pickString(hook, "riskLevel"),
          whyRisky: pickString(hook, "whyRisky"),
          bridge: pickString(hook, "bridge"),
        };
      },
      () => ({ type: "", text: "", riskLevel: "", whyRisky: "", bridge: "" })
    ),
    script: {
      keyTurnLine: pickString(script, "keyTurnLine", "opening"),
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
    const profile = resolveProfile();
    const step1Config = resolveBatchConfig(profile, "STEP_1");
    const step2Config = resolveBatchConfig(profile, "STEP_2");
    const step25Config = resolveBatchConfig(profile, "STEP_2_5");
    const step3aConfig = resolveBatchConfig(profile, "STEP_3A");
    const step3bConfig = resolveBatchConfig(profile, "STEP_3B");

    const {
      script,
      comments,
      platform,
      niche,
      creatorVoice,
      targetViewer,
    } = body as {
      script?: string;
      comments?: string[];
      platform?: string;
      niche?: string;
      creatorVoice?: string;
      targetViewer?: string;
    };

    if (!script || script.trim().length < 50) {
      return NextResponse.json(
        { error: "Script is required and must be at least 50 characters." },
        { status: 400 }
      );
    }

    const normalizedComments = (comments ?? []).map((comment) => comment.trim()).filter(Boolean);

    // Convert comments array to newline-separated string for the prompt
    const commentsText = normalizedComments.length > 0
      ? normalizedComments.join("\n")
      : "";

    const inputContext = {
      platform: platform?.trim() || "youtube-long",
      niche: niche?.trim() || "",
      creatorVoice: creatorVoice?.trim() || "",
      targetViewer: targetViewer?.trim() || "",
      competitorScript: script.trim(),
      topComments: normalizedComments,
    };

    // Build the shared user message sent to all 3 batches
    const userMessage = `Here is the YouTube script to analyze:

${script.trim()}

${
  commentsText
    ? `Here are the viewer comments:\n---\n${commentsText}\n---`
    : "No viewer comments were provided."
}`;

    const step1Prompt = renderPromptTemplate(STEP_1_PROMPT, { INPUT: inputContext });
    const step2Prompt = renderPromptTemplate(STEP_2_PROMPT, { INPUT: inputContext });

    const [step1Raw, step2Raw] = await Promise.all([
      callBatch(step1Prompt, userMessage, "STEP_1", step1Config),
      callBatch(step2Prompt, userMessage, "STEP_2", step2Config),
    ]);

    const step1 = normalizeStep1(step1Raw);
    const step2 = normalizeStep2(step2Raw);

    const step25Prompt = renderPromptTemplate(STEP_2_5_PROMPT, {
      INPUT: inputContext,
      STEP_1: step1,
    });
    const step25Raw = await callBatch(step25Prompt, userMessage, "STEP_2_5", step25Config);
    const step25 = normalizeStep25(step25Raw);

    const step3aPrompt = renderPromptTemplate(STEP_3A_PROMPT, {
      INPUT: inputContext,
      STEP_1: step1,
      STEP_2_5: step25.differentiation ?? {},
    });
    const step3aRaw = await callBatch(step3aPrompt, userMessage, "STEP_3A", step3aConfig);
    const step3a = normalizeStep3A(step3aRaw);

    const step3bPrompt = renderPromptTemplate(STEP_3B_PROMPT, {
      INPUT: inputContext,
      STEP_1: step1,
      STEP_3A: step3a,
    });
    const step3bRaw = await callBatch(step3bPrompt, userMessage, "STEP_3B", step3bConfig);
    const step3b = normalizeStep3B(step3bRaw);

    const result: AnalysisResult = {
      ...step1,
      ...step2,
      ...step25,
      ...step3a,
      ...step3b,
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
