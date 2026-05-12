import { buildEvaluatePrompt } from "@/app/lib/prompts/evaluateSection";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  baseURL: "https://api.shopaikey.com",
});

export async function POST(req: Request) {
  try {
    const { section, text, previous, next } = await req.json();

    const prompt = buildEvaluatePrompt({
      section,
      text,
      previous,
      next,
    });

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    // ✅ Lấy toàn bộ text (không assume chỉ có [0])
    const raw = msg.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n");

    // ✅ Clean markdown nếu có
    const clean = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(clean);
    } catch (err) {
      console.error("❌ JSON parse failed");
      console.error("RAW:", raw);

      return NextResponse.json(
        {
          error: "Invalid JSON from model",
          raw, // giúp debug frontend luôn
        },
        { status: 500 }
      );
    }

    // ✅ Optional: validate basic structure
    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json(
        { error: "Parsed result is not an object", raw },
        { status: 500 }
      );
    }

    return NextResponse.json({
      result: parsed,
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