import { NextRequest, NextResponse } from "next/server";
import { EXTRACTION_PROMPT } from "@/app/lib/prompts/extraction";
import { callModel } from "@/app/lib/openai";
import { normalizeExtraction } from "@/app/lib/normalizers";
import type { AnalysisResult } from "@/app/lib/types";

export const maxDuration = 120;

type Body = {
  script?: string;
  comments?: string[];
  competitorScript?: string;
  topComments?: string[];
  platform?: string;
  niche?: string;
  targetViewer?: string;
  contentType?: string;
};

function safeParseJSON(raw: any) {
  if (!raw) return {};

  if (typeof raw !== "string") return raw;

  try {
    // remove ```json wrapper if exists
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (e) {
    console.error("[safeParseJSON] failed:", raw);
    return {};
  }
}

const DEFAULT_PLATFORM = "YouTube Long-Form Video (8–25 min)";
const DEFAULT_NICHE = "Personal Finance";
const DEFAULT_TARGET_VIEWER = "Not specified";
const DEFAULT_CONTENT_TYPE = "Educational / Explainer";

export async function POST(req: NextRequest) {
  try {
    const body: Body = await req.json();

    const competitorScript = (body.competitorScript ?? body.script ?? "").trim();

    if (competitorScript.length < 50) {
      return NextResponse.json(
        { error: "Script must be at least 50 characters." },
        { status: 400 }
      );
    }

    const topComments = (body.topComments ?? body.comments ?? [])
      .map((c) => c.trim())
      .filter(Boolean);

    // ─────────────────────────────
    // STEP 1: EXTRACTION
    // ─────────────────────────────

    const extractionPrompt = EXTRACTION_PROMPT
      .replace("{{INPUT.platform}}", body.platform ?? DEFAULT_PLATFORM)
      .replace("{{INPUT.niche}}", body.niche ?? DEFAULT_NICHE)
      .replace("{{INPUT.targetViewer}}", body.targetViewer ?? DEFAULT_TARGET_VIEWER)
      .replace("{{INPUT.contentType}}", body.contentType ?? DEFAULT_CONTENT_TYPE)
      .replace("{{INPUT.competitorScript}}", competitorScript)
      .replace("{{INPUT.topComments}}", JSON.stringify(topComments, null, 2));

    const extractionRaw = await callModel(
      extractionPrompt,
      process.env.CLAUDE_MODEL_ANALYZE?.trim() || "claude-sonnet-4-6",
      6500
    );

    // 🔥 FIX: ALWAYS SAFE PARSE FIRST
    const extractionObject = safeParseJSON(extractionRaw);

    const extractionNormalized: AnalysisResult = normalizeExtraction(
      extractionObject,
      topComments
    );
    // ─────────────────────────────
    // FINAL RESPONSE
    // ─────────────────────────────

    return NextResponse.json({
      result: extractionNormalized,
    });
  } catch (err) {
    console.error("[POST ERROR]", err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}