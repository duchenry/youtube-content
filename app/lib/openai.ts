/**
 * Tiện ích OpenAI dùng chung cho toàn bộ API
 * - callModel: gọi AI → parse JSON trả về
 * - renderPromptTemplate: thay thế {{biến}} trong prompt
 * - asRecord/asString/asStringArray/asConfidence: ép kiểu an toàn cho dữ liệu AI trả về
 */
import OpenAI from "openai";

export type JsonRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

export function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const single = asString(value);
    return single ? [single] : [];
  }
  return value.map((item) => asString(item)).filter(Boolean);
}

export function asConfidence(value: unknown): "high" | "medium" | "low" {
  const normalized = asString(value).toLowerCase();
  if (normalized === "high" || normalized === "medium" || normalized === "low") return normalized;
  return "low";
}

function getPathValue(source: unknown, path: string): unknown {
  const tokens = path.match(/[^.[\]]+|\[(\d+)\]/g) ?? [];
  let current: unknown = source;
  for (const token of tokens) {
    if (current === null || current === undefined) return undefined;
    if (token.startsWith("[")) {
      const index = Number(token.slice(1, -1));
      if (!Array.isArray(current) || Number.isNaN(index)) return undefined;
      current = current[index];
      continue;
    }
    if (!isRecord(current)) return undefined;
    current = current[token];
  }
  return current;
}

function stringifyTemplateValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function renderPromptTemplate(template: string, context: JsonRecord): string {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, path: string) => {
    const value = getPathValue(context, path.trim());
    return stringifyTemplateValue(value);
  });
}

function extractMessageText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (!isRecord(part)) return "";
      if (typeof part.text === "string") return part.text;
      if (isRecord(part.text) && typeof part.text.value === "string") return part.text.value;
      return "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function extractJsonObject(raw: string): JsonRecord {
  const trimmed = raw.trim();
  const candidates = [trimmed];
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) candidates.push(fencedMatch[1].trim());
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (isRecord(parsed)) return parsed;
    } catch { /* next candidate */ }
  }
  throw new Error("Failed to parse model JSON output");
}

/** Shared OpenAI call: renders prompt → calls model → returns parsed JSON */
export async function callModel(
  prompt: string,
  model: string,
  maxTokens: number,
): Promise<JsonRecord> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured in .env.local");
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: "Return valid JSON only." },
    ],
    max_completion_tokens: maxTokens,
    response_format: { type: "json_object" },
  });
  const firstChoice = completion.choices[0];
  const raw =
    firstChoice && "message" in firstChoice && isRecord(firstChoice.message)
      ? extractMessageText(firstChoice.message.content)
      : "";
  if (!raw) throw new Error("Empty response from model");
  return extractJsonObject(raw);
}
