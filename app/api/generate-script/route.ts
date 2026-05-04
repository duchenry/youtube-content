import { NextRequest, NextResponse } from "next/server";
import { generateFullScript } from "@/app/lib/services/scriptGenerator";
import { MapperData, VoicePreset } from "@/app/lib/prompts/scriptInputMapper";

export async function POST(req: NextRequest) {
  try {
    const { synthesis, extraction, research, preset } = await req.json();

    if (!synthesis || typeof synthesis !== "object") {
      return NextResponse.json(
        { error: "synthesis (Step 3 result) is required." },
        { status: 400 }
      );
    }

    const mapperData: MapperData = {
      synthesis,
      extraction: extraction ?? {},
      research:   research   ?? {},
    };

    const voicePreset: VoicePreset =
      preset === "building" || preset === "raw" ? preset : "resigned";

    const result = await generateFullScript(mapperData, voicePreset);

    return NextResponse.json({ result });

  } catch (err: unknown) {
    console.error("[/api/generate-script]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 }
    );
  }
}