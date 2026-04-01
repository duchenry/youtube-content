import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { AnalysisResult } from "@/app/lib/types";
import { OPENING_FROM_HOOK_PROMPT } from "@/app/lib/prompt";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function asString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
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
      // Keep trying parse candidates.
    }
  }

  throw new Error("Failed to parse opening JSON output");
}

function normalizeOpening(raw: JsonRecord) {
  const opening = asRecord(raw.opening);
  const riskCheck = asRecord(raw.riskCheck);

  return {
    opening: {
      hook: asString(opening.hook),
      bridge: asString(opening.bridge),
      fullOpening: asString(opening.fullOpening),
      whyItWorks: asString(opening.whyItWorks),
    },
    riskCheck: {
      riskLevel: asString(riskCheck.riskLevel),
      why: asString(riskCheck.why),
      softVersion: asString(riskCheck.softVersion),
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

    const body = (await req.json()) as {
      analysis?: AnalysisResult;
      selectedHookIndex?: number;
      platform?: string;
      creatorVoice?: string;
      targetViewer?: string;
    };

    const analysis = body.analysis;
    const selectedHookIndex = Number(body.selectedHookIndex);

    if (!analysis || !Array.isArray(analysis.hooks) || analysis.hooks.length === 0) {
      return NextResponse.json({ error: "Analysis with hooks is required." }, { status: 400 });
    }

    if (!Number.isInteger(selectedHookIndex) || selectedHookIndex < 0 || selectedHookIndex >= analysis.hooks.length) {
      return NextResponse.json({ error: "selectedHookIndex is invalid." }, { status: 400 });
    }

    const selectedHook = analysis.hooks[selectedHookIndex];
    const inputContext = {
      platform: (body.platform ?? "youtube-long").trim() || "youtube-long",
      creatorVoice: (body.creatorVoice ?? "").trim(),
      targetViewer: (body.targetViewer ?? analysis.viewer?.profile ?? "").trim(),
    };

    const prompt = renderPromptTemplate(OPENING_FROM_HOOK_PROMPT, {
      INPUT: inputContext,
      HOOK: selectedHook,
      STEP_1: analysis,
      STEP_3A: analysis,
    });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_OPENING?.trim() || "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: "Write the opening for the selected hook. Return JSON only." },
      ],
      max_tokens: Number(process.env.ANALYZE_MAX_TOKENS_OPENING || 1200),
      response_format: { type: "json_object" },
    });

    const firstChoice = completion.choices[0];
    const raw =
      firstChoice && "message" in firstChoice && isRecord(firstChoice.message)
        ? extractMessageText(firstChoice.message.content)
        : "";

    if (!raw) {
      throw new Error("Empty response from opening generator");
    }

    const parsed = extractJsonObject(raw);
    const normalized = normalizeOpening(parsed);

    return NextResponse.json({
      selectedHookIndex,
      selectedHook,
      ...normalized,
    });
  } catch (err: unknown) {
    console.error("[/api/opening] Error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
