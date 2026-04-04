/**
 * API Bước 2: HƯỚNG DẪN NGHIÊN CỨU (Research Guide)
 * Nhận kết quả Bước 1 + hồ sơ viewer → tạo danh sách truy vấn Reddit
 * Kết hợp data đối thủ + demographic cụ thể để ra research chính xác nhất
 */
import { NextRequest, NextResponse } from "next/server";
import { RESEARCH_PROMPT, INPUT_CONTRACT } from "@/app/lib/prompt";
import { callModel, renderPromptTemplate } from "@/app/lib/openai";
import { normalizeResearch } from "@/app/lib/normalizers";

export async function POST(req: NextRequest) {
  try {
    const { extraction } = await req.json();
    if (!extraction || typeof extraction !== "object") {
      return NextResponse.json({ error: "extraction (Step 1 result) is required." }, { status: 400 });
    }

    const prompt = renderPromptTemplate(RESEARCH_PROMPT, {
      EXTRACTION_JSON: JSON.stringify(extraction, null, 2),
      VIEWER_PROFILE: INPUT_CONTRACT.targetViewer,
    });
    const parsed = await callModel(prompt, process.env.OPENAI_MODEL_RESEARCH?.trim() || "gpt-4o-mini", Number(process.env.RESEARCH_MAX_TOKENS || 3000));

    return NextResponse.json({ result: normalizeResearch(parsed) });
  } catch (err: unknown) {
    console.error("[/api/research-guide]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unexpected error" }, { status: 500 });
  }
}
