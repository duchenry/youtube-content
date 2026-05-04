/**
 * scriptGenerator.ts
 * Service layer — full script generation pipeline
 *
 * Pipeline (sequential):
 *   1. CHARACTER_SEED  → JSON { prose, anchors }
 *   2. HOOK            → text, lastLines = ""
 *   3. SETUP           → text, lastLines = Hook[-3:]
 *   4. CONTRADICTION   → text, lastLines = Setup[-3:]
 *   5. REFRAME         → text, lastLines = Contradiction[-3:]
 *   6. SOLUTION        → text, lastLines = Reframe[-3:]
 *   7. CLOSE           → text, lastLines = Solution[-3:]
 *
 * scriptMemory is built cumulatively after each section.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { GeneratedScript } from "@/app/lib/types";
import { buildSectionInput, buildVoice, CharacterAnchors, MapperData, VoicePreset } from "../prompts/scriptInputMapper";
import { CHARACTER_SEED_PROMPT, renderScriptPrompt, SECTION_ORDER, SECTION_PROMPTS } from "../prompts/scriptGenerator";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const TOKEN_BUDGET: Record<string, number> = {
  character:     1200,
  hook:           600,
  setup:         1200,
  contradiction: 1600,
  reframe:        900,
  solution:      1100,
  close:          500,
};

// ─────────────────────────────────────────────────────────────
// ANTHROPIC CLIENT
// ─────────────────────────────────────────────────────────────

const client = new Anthropic();

async function callClaude(
  prompt: string,
  maxTokens: number,
  maxRetries = 3
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      });

      const block = msg.content[0];
      if (!block || block.type !== "text") {
        throw new Error("Unexpected non-text response block from Claude");
      }
      return block.text;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }

  throw lastError;
}

// ─────────────────────────────────────────────────────────────
// PURE HELPERS
// ─────────────────────────────────────────────────────────────

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getLastLines(text: string, n = 3): string {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(-n)
    .join("\n");
}

function safeParseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

function buildScriptMemory(
  completedSections: Partial<Record<string, string>>,
  characterProse: string
): string {
  const lines: string[] = [];

  if (characterProse) {
    const anchor = characterProse.split(/[.!?]/)[0]?.trim();
    if (anchor) lines.push(`Character: ${anchor}.`);
  }

  const order = ["hook", "setup", "contradiction", "reframe", "solution"] as const;

  for (const sec of order) {
    const text = completedSections[sec];
    if (!text) continue;

    const firstMeaningfulLine = text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 20);

    if (firstMeaningfulLine) {
      lines.push(
        `${sec[0].toUpperCase()}${sec.slice(1)} opened: "${firstMeaningfulLine.slice(0, 90)}…"`
      );
    }
  }

  return lines.slice(0, 6).join("\n");
}

// ─────────────────────────────────────────────────────────────
// PIPELINE STEPS
// ─────────────────────────────────────────────────────────────

async function buildCharacter(mapperData: MapperData): Promise<{
  prose: string;
  anchors: CharacterAnchors;
}> {
  const record = buildSectionInput("character", mapperData);
  const prompt = renderScriptPrompt(CHARACTER_SEED_PROMPT, record);
  const raw = await callClaude(prompt, TOKEN_BUDGET.character);

  try {
    const parsed = safeParseJSON<{ prose: string; anchors: CharacterAnchors }>(raw);
    return {
      prose:   parsed.prose   ?? "",
      anchors: parsed.anchors ?? { physicalDetail: "", habitLoop: "", almostMoment: "" },
    };
  } catch {
    // Graceful degradation: model returned plain text instead of JSON
    return {
      prose:   raw,
      anchors: { physicalDetail: "", habitLoop: "", almostMoment: "" },
    };
  }
}

async function buildSection(
  section: string,
  mapperData: MapperData,
  characterAnchors: CharacterAnchors,
  voice: string,
  lastLines: string,
  scriptMemory: string
): Promise<string> {
  const template = SECTION_PROMPTS[section];
  if (!template) throw new Error(`No prompt template for section: ${section}`);

  const values: Record<string, string> = {
    ...buildSectionInput(section, mapperData, characterAnchors),
    voice,
    lastLines,
    scriptMemory,
  };

  return callClaude(
    renderScriptPrompt(template, values),
    TOKEN_BUDGET[section] ?? 1000
  );
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

export async function generateFullScript(
  mapperData: MapperData,
  preset: VoicePreset
): Promise<GeneratedScript> {
  // Step 1 — character
  const { prose, anchors } = await buildCharacter(mapperData);
  const voice = buildVoice(prose, preset);

  // Steps 2–7 — sections
  const sectionTexts: Partial<Record<string, string>> = {};
  let lastLines = "";

  for (const section of SECTION_ORDER) {
    const text = await buildSection(
      section,
      mapperData,
      anchors,
      voice,
      lastLines,
      buildScriptMemory(sectionTexts, prose)
    );

    sectionTexts[section] = text;
    lastLines = getLastLines(text);
  }

  // Assemble
  const fullScript = SECTION_ORDER
    .map((s) => sectionTexts[s] ?? "")
    .filter(Boolean)
    .join("\n\n");

  const s = (key: string) => sectionTexts[key] ?? "";

  return {
    status: "FINAL",
    fullScript,
    sections: {
      hook:          { text: s("hook"),          wordCount: countWords(s("hook"))          },
      setup:         { text: s("setup"),         wordCount: countWords(s("setup"))         },
      contradiction: { text: s("contradiction"), wordCount: countWords(s("contradiction")) },
      reframe:       { text: s("reframe"),       wordCount: countWords(s("reframe"))       },
      solution:      { text: s("solution"),      wordCount: countWords(s("solution"))      },
      close:         { text: s("close"),         wordCount: countWords(s("close"))         },
    },
  };
}