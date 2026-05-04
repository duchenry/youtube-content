import { NextRequest, NextResponse } from "next/server";
import { EXTRACTION_PROMPT } from "@/app/lib/prompts/extraction";
import { INTERPRET_PROMPT } from "@/app/lib/prompts/interpret";
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

    const extractionNormalized: AnalysisResult = normalizeExtraction(
      extractionRaw,
      topComments
    );

    // ─────────────────────────────
    // STEP 2: INTERPRETATION
    // ─────────────────────────────
    let interpretation = null;

    try {
      const interpretPrompt = INTERPRET_PROMPT.replace(
        "{{INPUT.extraction}}",
        JSON.stringify(extractionNormalized, null, 2)
      );

      const raw = await callModel(
        interpretPrompt,
        process.env.CLAUDE_MODEL_ANALYZE?.trim() || "claude-sonnet-4-6",
        2000
      );

      interpretation =
        typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      interpretation = null;
    }

    // ─────────────────────────────
    // FINAL RESPONSE (FIXED SHAPE)
    // ─────────────────────────────
    return NextResponse.json({
      result: {
        ...extractionNormalized,
        inputComments: topComments,
      },
      interpretation,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}