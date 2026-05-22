// app/api/generate-rewrite-options/route.ts

import { buildRewriteOptionsPrompt } from "@/app/lib/prompts/generateRewriteOptions";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  baseURL: "https://api.shopaikey.com",
});

// ─────────────────────────────────────
// JSON EXTRACTION
// ─────────────────────────────────────

function extractJson(raw: string) {
  const cleanRaw = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const jsonMatch = cleanRaw.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("No JSON object found");
  }

  return JSON.parse(jsonMatch[0]);
}

// ─────────────────────────────────────
// INPUT CLEANING
// API 2 should receive only line_edit fields.
// Do not carry rewriteHint / rewriteOptions from API 1.
// Do not send structure_edit to rewrite option generation.
// ─────────────────────────────────────

function cleanInputEdits(edits: unknown) {
  if (!Array.isArray(edits)) return [];

  return edits
    .filter((edit: any) => edit?.type === "line_edit")
    .map((edit: any) => ({
      type: "line_edit" as const,
      quote: typeof edit?.quote === "string" ? edit.quote : "",
      issue: typeof edit?.issue === "string" ? edit.issue : "",
      impactLevel:
        edit?.impactLevel === "low" ||
        edit?.impactLevel === "medium" ||
        edit?.impactLevel === "high"
          ? edit.impactLevel
          : "medium",
      suggestion:
        typeof edit?.suggestion === "string" ? edit.suggestion : "",
    }))
    .filter((edit) => edit.quote.trim() && edit.issue.trim());
}

// ─────────────────────────────────────
// OUTPUT CLEANING
// API 2 final response should include rewriteOptions only for line_edit.
// Do not return rewriteHint.
// Do not return structure_edit.
// ─────────────────────────────────────

function cleanRewriteOptions(options: unknown) {
  if (!Array.isArray(options)) return [];

  return options
    .slice(0, 3)
    .map((option: any) => ({
      type: typeof option?.type === "string" ? option.type : "compression",
      text: typeof option?.text === "string" ? option.text : "",
      score:
        typeof option?.score === "number"
          ? option.score
          : Number(option?.score) || 0,
      reason: typeof option?.reason === "string" ? option.reason : "",
    }))
    .filter((option) => option.text.trim());
}

function cleanOutputEdits(parsedEdits: unknown, fallbackEdits: any[]) {
  if (!Array.isArray(parsedEdits)) {
    return fallbackEdits.map((edit) => ({
      ...edit,
      type: "line_edit" as const,
      rewriteOptions: [],
    }));
  }

  return parsedEdits
    .map((edit: any, index: number) => {
      const fallback = fallbackEdits[index] ?? {};

      return {
        type: "line_edit" as const,
        quote:
          typeof edit?.quote === "string" && edit.quote.trim()
            ? edit.quote
            : fallback.quote,
        issue:
          typeof edit?.issue === "string" && edit.issue.trim()
            ? edit.issue
            : fallback.issue,
        impactLevel:
          edit?.impactLevel === "low" ||
          edit?.impactLevel === "medium" ||
          edit?.impactLevel === "high"
            ? edit.impactLevel
            : fallback.impactLevel ?? "medium",
        suggestion:
          typeof edit?.suggestion === "string"
            ? edit.suggestion
            : fallback.suggestion ?? "",
        rewriteOptions: cleanRewriteOptions(edit?.rewriteOptions),
      };
    })
    .filter((edit) => edit.quote && edit.issue);
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    const { section, text, previous, edits } = await req.json();

    // ─────────────────────────────────────
    // BASIC INPUT GUARD
    // ─────────────────────────────────────

    if (!section || typeof section !== "string") {
      return NextResponse.json(
        {
          error: "Missing section",
        },
        { status: 400 }
      );
    }

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        {
          error: "Missing text",
        },
        { status: 400 }
      );
    }

    const cleanEdits = cleanInputEdits(edits);

    if (cleanEdits.length === 0) {
      return NextResponse.json({
        result: {
          edits: [],
        },
      });
    }

    // ─────────────────────────────────────
    // BUILD PROMPT
    // ─────────────────────────────────────

    const prompt = buildRewriteOptionsPrompt({
      section,
      text,
      previous: previous || "",
      edits: cleanEdits,
    });

    console.log("[generate-rewrite-options] prompt length:", prompt.length);

    // ─────────────────────────────────────
    // CLAUDE
    // ─────────────────────────────────────

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    console.log(
      "[generate-rewrite-options] model done in:",
      Date.now() - startedAt,
      "ms"
    );

    // ─────────────────────────────────────
    // EXTRACT TEXT
    // ─────────────────────────────────────

    const raw = msg.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n")
      .trim();

    console.log("[generate-rewrite-options] raw length:", raw.length);

    if (!raw) {
      return NextResponse.json(
        {
          error: "Empty response from model",
          stop_reason: msg.stop_reason,
          usage: msg.usage,
          content: msg.content,
        },
        { status: 502 }
      );
    }

    // ─────────────────────────────────────
    // CLEAN + EXTRACT JSON
    // ─────────────────────────────────────

    let parsed;

    try {
      parsed = extractJson(raw);
    } catch (err) {
      console.error("❌ Rewrite options JSON parse failed");
      console.error("RAW:", raw);

      return NextResponse.json(
        {
          error: "Invalid JSON from model",
          raw,
        },
        { status: 500 }
      );
    }

    // ─────────────────────────────────────
    // RESPONSE
    // IMPORTANT:
    // Strip rewriteHint here.
    // API 2 returns only line_edit + rewriteOptions.
    // ─────────────────────────────────────

    const finalEdits = cleanOutputEdits(parsed?.edits, cleanEdits);

    return NextResponse.json({
      result: {
        edits: finalEdits,
      },
    });
  } catch (error) {
    console.error("❌ REWRITE OPTIONS API ERROR:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}