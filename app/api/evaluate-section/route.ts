// app/api/evaluate-section/route.ts

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import { buildEvaluatePrompt } from "@/app/lib/prompts/evaluateSection";
import { buildNarrativeState } from "@/app/lib/evaluation/buildNarrativeState";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  baseURL: "https://api.shopaikey.com",
});

// ─────────────────────────────────────
// CONTEXT TRIMMING
// previous / next are flow-reference only.
// Keep CURRENT full, trim only surrounding context.
// ─────────────────────────────────────
function getSentences(
  input: string | undefined,
  mode: "first" | "last",
  count: number
): string {
  const sentences = String(input || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  if (mode === "first") {
    return sentences.slice(0, count).join(" ");
  }

  return sentences.slice(-count).join(" ");
}

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
// SUMMARY CLEANING
// Keep user-facing decision fields short and safe.
// ─────────────────────────────────────

function cleanSummaryField(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";

  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

// ─────────────────────────────────────
// CLEAN STRUCTURAL PLACEMENT
// structure_edit requires placement.
// This is used for manual move/reorder guidance.
// ─────────────────────────────────────

function cleanPlacement(placement: any) {
  if (!placement || typeof placement !== "object") return null;

  const move =
    placement.move === "before" || placement.move === "after"
      ? placement.move
      : null;

  const anchorQuote =
    typeof placement.anchorQuote === "string"
      ? placement.anchorQuote.trim()
      : "";

  const reason =
    typeof placement.reason === "string" ? placement.reason.trim() : "";

  const bridgeSuggestion =
    typeof placement.bridgeSuggestion === "string"
      ? placement.bridgeSuggestion.trim()
      : "";

  if (!move || !anchorQuote || !reason) return null;

  return {
    move,
    anchorQuote,
    reason,
    ...(bridgeSuggestion ? { bridgeSuggestion } : {}),
  };
}

// ─────────────────────────────────────
// CLEAN API 1 OUTPUT
// API 1 returns issue-level fields.
// It may return:
// - line_edit: later enriched by API 2 with rewriteOptions
// - structure_edit: includes placement, does NOT get rewriteOptions
// ─────────────────────────────────────

function cleanEvaluationEdits(edits: unknown, currentText: string) {
  if (!Array.isArray(edits)) return [];

  return edits
    .map((edit: any) => {
      const quote = typeof edit?.quote === "string" ? edit.quote.trim() : "";
      const issue = typeof edit?.issue === "string" ? edit.issue.trim() : "";

      const impactLevel =
        edit?.impactLevel === "low" ||
        edit?.impactLevel === "medium" ||
        edit?.impactLevel === "high"
          ? edit.impactLevel
          : "medium";

      const suggestion =
        typeof edit?.suggestion === "string" ? edit.suggestion.trim() : "";

      const type =
        edit?.type === "structure_edit" ? "structure_edit" : "line_edit";

      const baseEdit: any = {
        type,
        quote,
        issue,
        impactLevel,
        suggestion,
      };

      if (type === "structure_edit") {
        const action =
          edit?.action === "cut" || edit?.action === "move"
            ? edit.action
            : null;

        if (!action) {
          return null;
        }

        baseEdit.action = action;

        if (action === "move") {
          const placement = cleanPlacement(edit?.placement);

          if (!placement) {
            return null;
          }

          baseEdit.placement = placement;
        }

        return baseEdit;
      }

      return baseEdit;
    })
    .filter((edit: any) => {
      if (!edit) return false;
      if (!edit.quote || !edit.issue) return false;

      // Keep only quotes that appear in CURRENT to avoid broken highlights.
      if (!currentText.includes(edit.quote)) return false;

      if (edit.type === "structure_edit") {
        if (edit.action !== "cut" && edit.action !== "move") return false;

        if (edit.action === "move") {
          if (!edit.placement?.anchorQuote) return false;
          if (!currentText.includes(edit.placement.anchorQuote)) return false;
        }
      }

      return true;
    });
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    const { section, text, previous, next, scriptEvaluation } =
      await req.json();

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

    // ─────────────────────────────────────
    // TRIM FLOW CONTEXT
    // ─────────────────────────────────────

    const previousExcerpt = getSentences(previous, "last", 4);
    const nextExcerpt = getSentences(next, "first", 3);

    // ─────────────────────────────────────
    // BUILD STRUCTURAL NARRATIVE STATE
    // ─────────────────────────────────────

    const narrativeState = buildNarrativeState({
      evaluation: scriptEvaluation,
      currentSection: section,
      currentText: text,
      previousText: previousExcerpt,
    });

    // ─────────────────────────────────────
    // BUILD PROMPT
    // ─────────────────────────────────────

    const prompt = buildEvaluatePrompt({
      section,
      text,
      previous: previousExcerpt,
      next: nextExcerpt,
      narrativeState,
    });

    // ─────────────────────────────────────
    // CLAUDE
    // ─────────────────────────────────────

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    console.log(
      "[evaluate-section] model done in:",
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

    console.log("[evaluate-section] raw length:", raw.length);

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
      console.error("❌ JSON parse failed");
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
    // VALIDATE BASIC STRUCTURE
    // ─────────────────────────────────────

    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json(
        {
          error: "Parsed result is not an object",
          raw,
        },
        { status: 500 }
      );
    }

    // ─────────────────────────────────────
    // RESPONSE
    // IMPORTANT:
    // - Strip rewriteHint / rewriteOptions here.
    // - Keep type and placement.
    // - API 2 will enrich only line_edit with rewriteOptions.
    // - Keep short decision summary for UI.
    // ─────────────────────────────────────

    const cleanEdits = cleanEvaluationEdits(parsed?.edits, text);

    const verdict = cleanSummaryField(parsed?.verdict, 120);
    const mainProblem = cleanSummaryField(parsed?.mainProblem, 180);
    const highestROIEdit = cleanSummaryField(parsed?.highestROIEdit, 220);

    return NextResponse.json({
      result: {
        verdict,
        mainProblem,
        highestROIEdit,
        edits: cleanEdits,
      },
    });
  } catch (error) {
    console.error("❌ API ERROR:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}