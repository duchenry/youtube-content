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

    const systemPrompt = `
You are an elite YouTube script architect AND content quality editor.

Your job:
1. Generate structured script sections
2. Detect generic/AI-like phrasing
3. Suggest better alternatives WITHOUT rewriting the whole script

Return JSON only.
`;

const userPrompt = `
Create a detailed 20-minute YouTube script structure AND content refinement suggestions based on this analysis:

${JSON.stringify(analysis, null, 2)}

=== REQUIREMENTS ===

1) SCRIPT STRUCTURE
Provide 8 sections:
- Hook
- Setup
- Story
- Reveal
- Value
- Actions
- Proof
- CTA

Each section must include:
- narration (30–60 words, natural but NOT overly polished)
- key bullets (2–4 bullets)

---

2) HOOK OPTIONS
Generate 6 hooks:
- 2 pattern interrupt
- 2 curiosity gap
- 2 emotional

Also:
- Select 1 best hook (chosenHook)

---

3) GENERIC DETECTION + SUGGESTIONS (VERY IMPORTANT)

For EACH section narration:

- Identify phrases that sound:
  - generic
  - overly formal
  - AI-like
  - low-emotion
  - vague

- DO NOT rewrite the whole narration

Instead return:
- problematicPhrases: array of exact phrases
- reasons: why each phrase is weak
- suggestions: 2–3 alternative ways to say EACH phrase

Guidelines for suggestions:
- more conversational
- more direct
- more emotional
- more “spoken language”
- may include light personality or edge

---

4) STYLE RULES

- Avoid corporate tone
- Avoid clichés
- Use “you” when possible
- Slightly imperfect, natural spoken rhythm

---

=== OUTPUT FORMAT ===

{
  "scriptStructure": [
    {
      "time": "0:00-0:30",
      "section": "Hook",
      "narration": "...",
      "bullets": ["...", "..."],
      "improvement": {
        "problematicPhrases": ["..."],
        "reasons": ["..."],
        "suggestions": [
          {
            "original": "...",
            "alternatives": ["...", "...", "..."]
          }
        ]
      }
    }
  ],
  "hooks": ["...", "..."],
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
