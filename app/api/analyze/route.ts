/**
 * API Bước 1: PHÂN TÍCH (Extraction)
 * Fixes applied:
 * - All 6 prompt placeholders now injected (platform, niche, targetViewer, contentType)
 * - max_tokens tăng lên 10000 (schema ~25 fields cần 8k-10k tokens)
 * - callModel trả JsonRecord trực tiếp — KHÔNG cần JSON.parse thêm
 * - maxDuration 120s (tránh Next.js timeout với script dài + gpt-4.1)
 * - Platform/niche defaults cho YouTube long-form personal finance
 * - inputComments gắn vào normalized trước khi trả về (AnalysisResult requires it)
 */
import { NextRequest, NextResponse } from "next/server";
import { EXTRACTION_PROMPT } from "@/app/lib/prompts/extraction";
import { callModel } from "@/app/lib/openai";
import { normalizeExtraction } from "@/app/lib/normalizers";
import type { AnalysisResult } from "@/app/lib/types";

// Tăng timeout — gpt-4.1 + script dài + 10k tokens có thể mất 30-60s
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

// Defaults cho YouTube long-form personal finance
const DEFAULT_PLATFORM = "YouTube Long-Form Video (8–25 min)";
const DEFAULT_NICHE = "Personal Finance";
const DEFAULT_TARGET_VIEWER = "Not specified";
const DEFAULT_CONTENT_TYPE = "Educational / Explainer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Body;

    const competitorScript = (body.competitorScript ?? body.script ?? "").trim();
    if (!competitorScript || competitorScript.length < 50) {
      return NextResponse.json(
        { error: "Script is required and must be at least 50 characters." },
        { status: 400 }
      );
    }

    const topComments = (body.topComments ?? body.comments ?? [])
      .map((c) => c.trim())
      .filter(Boolean);

    // ✅ Inject tất cả 6 placeholder — không còn literal {{INPUT.x}} nào trong prompt gửi đi
    const filledPrompt = EXTRACTION_PROMPT
      .replace("{{INPUT.platform}}", body.platform ?? DEFAULT_PLATFORM)
      .replace("{{INPUT.niche}}", body.niche ?? DEFAULT_NICHE)
      .replace("{{INPUT.targetViewer}}", body.targetViewer ?? DEFAULT_TARGET_VIEWER)
      .replace("{{INPUT.contentType}}", body.contentType ?? DEFAULT_CONTENT_TYPE)
      .replace("{{INPUT.competitorScript}}", competitorScript)
      .replace("{{INPUT.topComments}}", JSON.stringify(topComments, null, 2));

    // ✅ callModel tự parse JSON nội bộ và throw nếu thất bại
    const parsed = await callModel(filledPrompt, "gpt-4.1", 10000);

    // ✅ normalizeExtraction không trả inputComments — gắn vào đây để
    // thoả mãn AnalysisResult type (inputComments là required field)
    const result: AnalysisResult = {
      ...normalizeExtraction(parsed, topComments),
      inputComments: topComments,
    };

    return NextResponse.json({ result });
  } catch (err: unknown) {
    console.error("[/api/analyze]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 }
    );
  }
}