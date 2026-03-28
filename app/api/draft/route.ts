import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/app/lib/supabase";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("analyses")
      .select("result")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Analysis not found for this slug" }, { status: 404 });
    }

    const analysis = data.result;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured in .env.local" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an elite YouTube script architect. Create an actionable 20-minute video script structure and hook set based on analysis data. Return JSON only.`;

    const userPrompt = `Create a detailed 20-minute script outline and hook suggestions based on this analysis result object:

${JSON.stringify(analysis, null, 2)}

Requirements:
1) Provide a timeline sections array with 8 parts (hook, setup, story, reveal, value, actions, proof, CTA).
2) Each section includes a brief narration text (30-60 words) and key bullets.
3) Generate 6 hook options (2x pattern interrupt, 2x curiosity gap, 2x emotional) suited to this content.
4) Suggest one chosen hook by default.
5) Keep content aligned to coreInsight, structureDNA, hookBreakdown, and contentOpportunities.

Return exactly this JSON structure:
{
  "scriptStructure": [
    { "time": "0:00-0:30", "section": "Hook", "narration": "...", "bullets": ["...", "..."] },
    ...
  ],
  "hooks": ["...", "...", ...],
  "chosenHook": "..."
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("No response from draft generator");
    }

    const draftResult =
      typeof raw === "string" ? (JSON.parse(raw) as Record<string, unknown>) : raw;

    if (!draftResult || typeof draftResult !== "object") {
      throw new Error("Invalid draft response format");
    }

    return NextResponse.json({
      draft: (draftResult as any).scriptStructure || [],
      hooks: (draftResult as any).hooks || [],
      chosenHook: (draftResult as any).chosenHook || null,
    });
  } catch (err: unknown) {
    console.error("[/api/draft] Error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
