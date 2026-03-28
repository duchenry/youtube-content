import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { BATCH_1_PROMPT, BATCH_2_PROMPT, BATCH_3_PROMPT } from "@/app/lib/prompt";

// OpenAI client — server-side only. Key never sent to browser.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─────────────────────────────────────────────────────────────
// Helper: call GPT for a single batch
// ─────────────────────────────────────────────────────────────
async function callBatch(
  systemPrompt: string,
  userMessage: string,
  batchName: string
): Promise<Record<string, unknown>> {
  const completion = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    // temperature: 0.85,
    // max_tokens: 4000,           // Each batch gets its own 4k token budget
    max_completion_tokens: 4000,           // Each batch gets its own 4k token budget, for gpt-5-mini which doesn't support max_tokens
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  const finishReason = completion.choices[0]?.finish_reason;

  if (!raw) {
    throw new Error(`Batch ${batchName}: empty response from model`);
  }

  if (finishReason === "length") {
    // Response was cut — still try to parse what we got
    console.warn(`[${batchName}] finish_reason=length — response may be truncated`);
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(`Batch ${batchName}: failed to parse JSON response`);
  }
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
    const { script, comments } = body as { script?: string; comments?: string };

    if (!script || script.trim().length < 50) {
      return NextResponse.json(
        { error: "Script is required and must be at least 50 characters." },
        { status: 400 }
      );
    }

    // Build the shared user message sent to all 3 batches
    const userMessage = `Here is the YouTube script to analyze:

---
${script.trim()}
---

${
  comments && comments.trim().length > 0
    ? `Here are the viewer comments:\n---\n${comments.trim()}\n---`
    : "No viewer comments were provided."
}`;

    // ── Run all 3 batches in parallel ────────────────────────
    const [batch1, batch2, batch3] = await Promise.all([
      callBatch(BATCH_1_PROMPT, userMessage, "BATCH_1"),
      callBatch(BATCH_2_PROMPT, userMessage, "BATCH_2"),
      callBatch(BATCH_3_PROMPT, userMessage, "BATCH_3"),
    ]);

    // ── Merge all results into one complete object ────────────
    const result = {
      // Batch 1: sections 1–6
      coreInsight:    batch1.coreInsight,
      coreAngle:      batch1.coreAngle,
      angleExpansion: batch1.angleExpansion,
      keywordAnalysis: batch1.keywordAnalysis,
      hookBreakdown:  batch1.hookBreakdown,
      structureDNA:   batch1.structureDNA,

      // Batch 2: sections 7–11
      audienceProfile:      batch2.audienceProfile,
      painMap:              batch2.painMap,
      commentMining:        batch2.commentMining,
      desireMap:            batch2.desireMap,
      contentOpportunities: batch2.contentOpportunities,

      // Batch 3: sections 12–16
      differentiationStrategy: batch3.differentiationStrategy,
      viralRiskAnalysis:       batch3.viralRiskAnalysis,
      contentGapAnalysis:      batch3.contentGapAnalysis,
      formatVariations:        batch3.formatVariations,
      scriptStarters:          batch3.scriptStarters,
    };

    return NextResponse.json({ result });
  } catch (err: unknown) {
    console.error("[/api/analyze] Error:", err);
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
