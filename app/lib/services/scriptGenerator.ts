import Anthropic from "@anthropic-ai/sdk";
import { SECTION_KEYS, type GeneratedScript, type SectionKey } from "@/app/lib/types";
import { mapToScriptInputs } from "../prompts/scriptInputMapper";
import {
  SECTION_PROMPTS,
  renderScriptPrompt,
} from "../prompts/scriptGenerator";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: "https://api.shopaikey.com",
});

const TOKEN_BUDGET: Record<SectionKey, number> = {
  hook: 600,
  setup: 1200,
  contradiction: 1600,
  reframe: 900,
  solution: 1100,
  close: 500,
};

async function callClaude(prompt: string, maxTokens: number) {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const block = msg.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Invalid Claude response");
  }

  return block.text;
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getLastLines(text: string, n = 3) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(-n)
    .join("\n");
}

function buildScriptMemory(sections: Partial<Record<SectionKey, string>>) {
  const lines: string[] = [];

  for (const key of SECTION_KEYS) {
    const t = sections[key];
    if (!t) continue;

    const first = t.split("\n").find((l) => l.trim().length > 20);
    if (first) lines.push(`${key.toUpperCase()}: ${first.slice(0, 80)}...`);
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────

export async function generateFullScript(data: any, analysisId: string): Promise<GeneratedScript> {
  const inputs = mapToScriptInputs(data);
  const sectionTexts: Partial<Record<SectionKey, string>> = {};
  let lastLines = "";

  for (const section of SECTION_KEYS) {
    const template = SECTION_PROMPTS[section];

    const values = {
      ...inputs[section],
      voice: "",
      lastLines,
      scriptMemory: buildScriptMemory(sectionTexts),
    };

    const prompt = renderScriptPrompt(template, values);

    const text = await callClaude(prompt, TOKEN_BUDGET[section]);

    sectionTexts[section] = text;
    lastLines = getLastLines(text);
  }

  const fullScript = SECTION_KEYS
    .map((k) => sectionTexts[k] ?? "")
    .join("\n\n");

  const s = (k: SectionKey) => ({
    text: sectionTexts[k] ?? "",
    wordCount: countWords(sectionTexts[k] ?? ""),
  });

  return {
    id: analysisId,
    status: "FINAL",
    fullScript,
    sections: {
      hook: s("hook"),
      setup: s("setup"),
      contradiction: s("contradiction"),
      reframe: s("reframe"),
      solution: s("solution"),
      close: s("close"),
    },
  };
}