import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { AnalysisResult } from "@/app/lib/types";
import { EXTRACTION_PROMPT, INPUT_CONTRACT } from "@/app/lib/prompt";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type JsonRecord = Record<string, unknown>;

type AnalyzeBody = {
  script?: string;
  comments?: string[];
  competitorScript?: string;
  topComments?: string[];
  platform?: string;
  niche?: string;
  targetViewer?: string;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const single = asString(value);
    return single ? [single] : [];
  }
  return value.map((item) => asString(item)).filter(Boolean);
}

function asConfidence(value: unknown): "high" | "medium" | "low" {
  const normalized = asString(value).toLowerCase();
  if (normalized === "high" || normalized === "medium" || normalized === "low") {
    return normalized;
  }
  return "low";
}

function asStrength(value: unknown): "weak" | "medium" | "strong" {
  const normalized = asString(value).toLowerCase();
  if (normalized === "weak" || normalized === "medium" || normalized === "strong") {
    return normalized;
  }
  return "medium";
}

function getPathValue(source: unknown, path: string): unknown {
  const tokens = path.match(/[^.[\]]+|\[(\d+)\]/g) ?? [];
  let current: unknown = source;

  for (const token of tokens) {
    if (current === null || current === undefined) return undefined;

    if (token.startsWith("[")) {
      const index = Number(token.slice(1, -1));
      if (!Array.isArray(current) || Number.isNaN(index)) return undefined;
      current = current[index];
      continue;
    }

    if (!isRecord(current)) return undefined;
    current = current[token];
  }

  return current;
}

function stringifyTemplateValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function renderPromptTemplate(template: string, context: JsonRecord): string {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, path: string) => {
    const value = getPathValue(context, path.trim());
    return stringifyTemplateValue(value);
  });
}

function extractMessageText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";

  const textParts = content
    .map((part) => {
      if (typeof part === "string") return part;
      if (!isRecord(part)) return "";
      if (typeof part.text === "string") return part.text;
      if (isRecord(part.text) && typeof part.text.value === "string") return part.text.value;
      return "";
    })
    .filter(Boolean);

  return textParts.join("\n").trim();
}

function extractJsonObject(raw: string): JsonRecord {
  const trimmed = raw.trim();
  const candidates = [trimmed];

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) candidates.push(fencedMatch[1].trim());

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (isRecord(parsed)) return parsed;
    } catch {
      // Keep trying candidates.
    }
  }

  throw new Error("Failed to parse model JSON output");
}

function normalizeResult(raw: JsonRecord): AnalysisResult {
  const hook = asRecord(raw.hook);
  const hookQuality = asRecord(raw.hookQuality);
  const angle = asRecord(raw.angle);
  const coreTruth = asRecord(raw.coreTruth);
  const attention = asRecord(raw.attention);
  const retentionDriver = asRecord(attention.retentionDriver);
  const proofMechanics = asRecord(raw.proofMechanics);
  const transferablePattern = asRecord(proofMechanics.transferablePattern);
  const structureDNA = asRecord(raw.structureDNA);
  const audience = asRecord(raw.audience);
  const commentPatterns = asRecord(audience.commentPatterns);
  const weakPoints = asRecord(raw.weakPoints);
  const priority = asRecord(raw.priority);

  const phasesRaw = Array.isArray(structureDNA.phases) ? structureDNA.phases : [];
  const retentionRaw = Array.isArray(structureDNA.retentionMoments)
    ? structureDNA.retentionMoments
    : [];
  const painMapRaw = Array.isArray(audience.painMap) ? audience.painMap : [];

  return {
    hook: {
      raw: asString(hook.raw),
      type: asString(hook.type),
      mechanism: asString(hook.mechanism),
      confidence: asConfidence(hook.confidence),
    },
    hookQuality: {
      strength: asStrength(hookQuality.strength),
      why: asString(hookQuality.why),
      risk: asString(hookQuality.risk),
    },
    angle: {
      claim: asString(angle.claim),
      supportingLogic: asString(angle.supportingLogic),
      hiddenAssumption: asString(angle.hiddenAssumption),
      confidence: asConfidence(angle.confidence),
    },
    coreTruth: {
      insight: asString(coreTruth.insight),
      triggerMoment: asString(coreTruth.triggerMoment),
      confidence: asConfidence(coreTruth.confidence),
    },
    attention: {
      patternBreak: asString(attention.patternBreak),
      escalation: asStringArray(attention.escalation),
      retentionDriver: {
        description: asString(retentionDriver.description),
        confidence: asConfidence(retentionDriver.confidence),
      },
    },
    proofMechanics: {
      evidenceUsed: asStringArray(proofMechanics.evidenceUsed),
      transferablePattern: {
        pattern: asString(transferablePattern.pattern),
        confidence: asConfidence(transferablePattern.confidence),
      },
    },
    structureDNA: {
      phases: phasesRaw.map((item) => {
        const phase = asRecord(item);
        return {
          phase: asString(phase.phase),
          goal: asString(phase.goal),
          tactic: asString(phase.tactic),
          source: asString(phase.source) || "INFERRED",
        };
      }),
      retentionMoments: retentionRaw.map((item) => {
        const moment = asRecord(item);
        return {
          moment: asString(moment.moment),
          whyItWorks: asString(moment.whyItWorks),
          pattern: asString(moment.pattern),
          isPrimary: Boolean(moment.isPrimary),
        };
      }),
    },
    audience: {
      profile: asString(audience.profile),
      painMap: painMapRaw.map((item) => {
        const pain = asRecord(item);
        return {
          pain: asString(pain.pain),
          feeling: asString(pain.feeling),
          realScenario: asString(pain.realScenario),
        };
      }),
      commentPatterns: {
        repeatedPain: asString(commentPatterns.repeatedPain),
        languageUsed: asStringArray(commentPatterns.languageUsed),
        misunderstanding: asString(commentPatterns.misunderstanding),
      },
    },
    weakPoints: {
      whereItLosesAttention: asString(weakPoints.whereItLosesAttention),
      why: asString(weakPoints.why),
    },
    priority: {
      primaryDriver: asString(priority.primaryDriver),
      secondaryDriver: asString(priority.secondaryDriver),
      why: asString(priority.why),
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured in .env.local" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as AnalyzeBody;

    const competitorScript = (body.competitorScript ?? body.script ?? "").trim();
    if (!competitorScript || competitorScript.length < 50) {
      return NextResponse.json(
        { error: "Script is required and must be at least 50 characters." },
        { status: 400 }
      );
    }

    const topComments = (body.topComments ?? body.comments ?? [])
      .map((comment) => comment.trim())
      .filter(Boolean);

    const inputContext = {
      platform: (body.platform ?? INPUT_CONTRACT.platform).trim() || "youtube-long",
      niche: (body.niche ?? INPUT_CONTRACT.niche).trim(),
      targetViewer: (body.targetViewer ?? INPUT_CONTRACT.targetViewer).trim(),
      competitorScript,
      topComments,
    };

    const prompt = renderPromptTemplate(EXTRACTION_PROMPT, { INPUT: inputContext });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_ANALYZE?.trim() || "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }, { role: "user", content: "Return valid JSON only." }],
      max_tokens: Number(process.env.ANALYZE_MAX_TOKENS || 5000),
      response_format: { type: "json_object" },
    });

    const firstChoice = completion.choices[0];
    const raw =
      firstChoice && "message" in firstChoice && isRecord(firstChoice.message)
        ? extractMessageText(firstChoice.message.content)
        : "";

    if (!raw) {
      throw new Error("Empty response from model");
    }

    const parsed = extractJsonObject(raw);
    const result = normalizeResult(parsed);

    return NextResponse.json({
      result: {
        ...result,
        inputComments: topComments,
      },
    });
  } catch (err: unknown) {
    console.error("[/api/analyze] Error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
