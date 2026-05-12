import { buildEditFragment } from "@/app/lib/prompts/buildEditFragment";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  baseURL: "https://api.shopaikey.com",
});

export async function POST(req: Request) {
  const {
    fullSection,
    targetQuote,
    issue,
    impactLevel,
    suggestion,
    rewriteHint,
    context,
  } = await req.json();

  const prompt = buildEditFragment({
    fullSection,
    targetQuote,
    issue,
    impactLevel,
    suggestion,
    rewriteHint,
    context,
  });

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0]?.type === "text"
    ? msg.content[0].text
    : "";

  // 👉 EXPECTED: parse 3 versions
  return NextResponse.json({
    versions: parseVersions(text),
  });
}

/**
 * Extract 3 versions from raw model output
 */
function parseVersions(text: string) {
  const blocks = text.split(/VERSION \d+:/g).filter(Boolean);

  return blocks.map((b, i) => ({
    id: `v${i + 1}`,
    text: b.trim(),
    score: 1 - i * 0.05,
    reason: i === 0 ? "best structural match" : "alternative variation",
  }));
}