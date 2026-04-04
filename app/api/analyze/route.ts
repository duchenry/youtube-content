/**
 * API Bước 1: PHÂN TÍCH (Extraction)
 * Nhận script + comments của đối thủ → gọi AI trích xuất toàn bộ cấu trúc video
 * Trả về: hook, angle, audience, structureDNA, weakPoints...
 */
import { NextRequest, NextResponse } from "next/server";
import { EXTRACTION_PROMPT, INPUT_CONTRACT } from "@/app/lib/prompt";
import { callModel, renderPromptTemplate } from "@/app/lib/openai";
import { normalizeExtraction } from "@/app/lib/normalizers";

type Body = {
  script?: string; comments?: string[];
  competitorScript?: string; topComments?: string[];
  platform?: string; niche?: string; targetViewer?: string; contentType?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const competitorScript = (body.competitorScript ?? body.script ?? "").trim();
    if (!competitorScript || competitorScript.length < 50) {
      return NextResponse.json({ error: "Script is required and must be at least 50 characters." }, { status: 400 });
    }

    const topComments = (body.topComments ?? body.comments ?? []).map((c) => c.trim()).filter(Boolean);

    const prompt = renderPromptTemplate(EXTRACTION_PROMPT, {
      INPUT: {
        platform: (body.platform ?? INPUT_CONTRACT.platform).trim() || "youtube-long",
        niche: (body.niche ?? INPUT_CONTRACT.niche).trim(),
        targetViewer: (body.targetViewer ?? INPUT_CONTRACT.targetViewer).trim(),
        contentType: (body.contentType ?? INPUT_CONTRACT.contentType).trim() || "discovery",
        competitorScript,
        topComments,
      },
    });

    const parsed = await callModel(prompt, process.env.OPENAI_MODEL_ANALYZE?.trim() || "gpt-5-mini", Number(process.env.ANALYZE_MAX_TOKENS || 5000));
    const result = normalizeExtraction(parsed, topComments.length);

    return NextResponse.json({ result: { ...result, inputComments: topComments } });
  } catch (err: unknown) {
    console.error("[/api/analyze]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unexpected error" }, { status: 500 });
  }
}
