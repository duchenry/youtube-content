// app/api/evaluate-script/route.ts

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { supabase } from "@/app/lib/supabase";
import { SECTION_KEYS, type GeneratedScript } from "@/app/lib/types";
import { buildScriptEvaluatePrompt } from "@/app/lib/prompts/evaluateScript";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  baseURL: "https://api.shopaikey.com",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      sections,
      analysisId,
    }: {
      sections: GeneratedScript["sections"];
      analysisId: string;
    } = body;

    if (!sections) {
      return NextResponse.json(
        { error: "Missing sections" },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────
    // BUILD FULL SCRIPT
    // ─────────────────────────────────────

    const fullScript = SECTION_KEYS
      .map((key) => {
        const text = sections[key]?.text?.trim();

        if (!text) return "";

        return `[${key.toUpperCase()}]\n${text}`;
      })
      .filter(Boolean)
      .join("\n\n");

    // ─────────────────────────────────────
    // BUILD PROMPT
    // ─────────────────────────────────────

    const prompt = buildScriptEvaluatePrompt(fullScript);

    // ─────────────────────────────────────
    // CLAUDE
    // ─────────────────────────────────────

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = response.content[0];

    if (raw.type !== "text") {
      throw new Error("Claude returned non-text response");
    }

    // ─────────────────────────────────────
    // CLEAN + EXTRACT JSON
    // ─────────────────────────────────────

    let result;

    try {
      const jsonMatch = raw.text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("No JSON object found");
      }

      const cleaned = jsonMatch[0]
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      result = JSON.parse(cleaned);
    } catch (err) {
      console.error("❌ JSON parse failed");
      console.error("RAW:", raw.text);

      return NextResponse.json(
        {
          error: "Invalid JSON returned from Claude",
          raw: raw.text,
        },
        { status: 500 }
      );
    }

    // ─────────────────────────────────────
    // SAVE DB
    // ─────────────────────────────────────

    if (analysisId) {
      const { error } = await supabase
        .from("analyses")
        .update({
          script_evaluation: result,
        })
        .eq("id", analysisId);

      if (error) {
        console.error("❌ Save script evaluation error:", error);
      }
    }

    // ─────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────

    return NextResponse.json({
      result,
    });
  } catch (err) {
    console.error("❌ evaluate-script route error:", err);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}