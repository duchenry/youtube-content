import { NextRequest, NextResponse } from "next/server";
import { processPilotAction } from "@/app/lib/pilot/engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await processPilotAction(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Pilot API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
