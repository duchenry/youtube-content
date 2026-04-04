/**
 * API Bước 3: TỔNG HỢP CHIẾN LƯỢC (Enrich / Synthesis)
 * Nhận kết quả Bước 1 + Reddit posts & comments tách riêng → tạo chiến lược
 * Đây là bước DUY NHẤT tạo ra chiến lược — Bước 1-2 chỉ quan sát & nghiên cứu
 */
import { NextRequest, NextResponse } from "next/server";
import { SYNTHESIS_PROMPT, INPUT_CONTRACT } from "@/app/lib/prompt";
import { callModel, renderPromptTemplate } from "@/app/lib/openai";
import { normalizeSynthesis } from "@/app/lib/normalizers";

export async function POST(req: NextRequest) {
  try {
    const { extraction, redditData, contentType } = await req.json();
    if (!extraction || typeof extraction !== "object") {
      return NextResponse.json({ error: "extraction (Step 1 result) is required." }, { status: 400 });
    }
    const data = (typeof redditData === "string" ? redditData : "").trim();
    if (data.length < 50) {
      return NextResponse.json({ error: "Reddit data phải tối thiểu 50 ký tự." }, { status: 400 });
    }

    const prompt = renderPromptTemplate(SYNTHESIS_PROMPT, {
      EXTRACTION_JSON: JSON.stringify(extraction, null, 2),
      REDDIT_DATA: data,
      CONTENT_TYPE: (contentType || "discovery").trim(),
      VIEWER_PROFILE: INPUT_CONTRACT.targetViewer,
    });
    const parsed = await callModel(prompt, process.env.OPENAI_MODEL_ENRICH?.trim() || "gpt-5-mini", Number(process.env.ENRICH_MAX_TOKENS || 4000));

    return NextResponse.json({ result: normalizeSynthesis(parsed) });
  } catch (err: unknown) {
    console.error("[/api/enrich]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unexpected error" }, { status: 500 });
  }
}
