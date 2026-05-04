/**
 * Tiện ích AI dùng chung cho toàn bộ API
 * Hiện tại sử dụng Claude (Anthropic) — model mặc định: Sonnet 4.6
 *
 * - callModel: gọi model JSON-style → parse JSON trả về
 * - renderPromptTemplate: thay thế {{biến}} trong prompt
 * - asRecord/asString/asStringArray/asConfidence: ép kiểu an toàn cho dữ liệu AI trả về
 */
import Anthropic from "@anthropic-ai/sdk";

export type JsonRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

export function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
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
  if (normalized === "high" || normalized === "medium" || normalized === "low")
    return normalized;
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
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}

export function renderPromptTemplate(
  template: string,
  context: JsonRecord,
): string {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, path: string) => {
    const value = getPathValue(context, path.trim());
    return stringifyTemplateValue(value);
  });
}

// Trích text từ content trả về — hỗ trợ cả OpenAI-style lẫn Anthropic-style blocks
function extractMessageText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";

  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (!isRecord(part)) return "";

      // Anthropic messages API: { type: "text", text: string }
      if (typeof part.text === "string") return part.text;
      if (isRecord(part.text) && typeof part.text.value === "string")
        return part.text.value;

      // Fallback for any nested structure
      if (typeof part.content === "string") return part.content;
      return "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function extractJsonObject(raw: string): JsonRecord {
  const trimmed = raw.trim();
  const candidates: string[] = [trimmed];

  // 1. Extract từ markdown fence
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) candidates.push(fencedMatch[1].trim());

  // 2. Cắt chính xác từ { đến }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  // ✅ Fix chuyên dụng cho Claude 4.6 Sonnet:
  // Claude 4.6 thường return trailing commas, comments và syntax JSON không hợp lệ khác
  for (let candidate of candidates) {
    try {
      // Clean lỗi phổ biến của Claude 4.6
      let cleaned = candidate
        // Bỏ trailing commas trước ] hoặc }
        .replace(/,(\s*[\]}])/g, '$1')
        // Bỏ comments dạng //
        .replace(/\/\/.*$/gm, '')
        // Bỏ comments dạng /* */
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Fix quotes bị lỗi
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

      const parsed = JSON.parse(cleaned);
      if (isRecord(parsed)) return parsed;
    } catch {
      /* next candidate */
    }
  }

  // Fallback cuối: thử parse mọi thứ tìm được
  for (const candidate of candidates) {
    try {
      // Fallback lỏng lẻo cho trường hợp xấu nhất
      const lazyParse = new Function(`return ${candidate}`)();
      if (isRecord(lazyParse)) return lazyParse;
    } catch {
      /* next candidate */
    }
  }

  // Log chi tiết lỗi để debug
  console.error("\n❌ JSON PARSE FAILED. RAW OUTPUT FROM MODEL:\n", raw, "\n");
  throw new Error("Failed to parse model JSON output");
}

/** Shared Claude call: renders prompt → calls model → returns parsed JSON */
export async function callModel(
  prompt: string,
  model: string,
  maxTokens: number,
): Promise<JsonRecord> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured in .env.local");
  }

  const anthropic = new Anthropic({
    apiKey,
    baseURL: "https://api.shopaikey.com",
  });
  console.log("[callModel] apiKey:", apiKey?.slice(0, 10));
  console.log("[callModel] baseURL:", process.env.ANTHROPIC_BASE_URL);

  const completion = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature: 0.1,
    top_p: 0.95,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    system:
      "You are a precise JSON engine. Return only valid JSON for the user prompt, no extra text, no comments, no markdown fences.",
  });

  console.log("[callModel] finish_reason:", completion.stop_reason);
  const raw = extractMessageText(completion.content as unknown);
  if (!raw) throw new Error("Empty response from model");

  // ✅ Fix Claude 4.6 max tokens truncation
  // Claude 4.6 rất thường bị cắt ngang output khi đạt max_tokens, không báo lỗi gì cả
  if (completion.stop_reason === "max_tokens") {
    console.warn("⚠️  Claude 4.6 bị cắt ngang output do max tokens giới hạn!");
    // Thêm dấu đóng ngoặc thủ công để cứu JSON đã cắt
    const addClosingBrackets = (str: string): string => {
      let result = str;
      // Đếm số ngoặc mở chưa đóng
      let openBraces = (result.match(/{/g) || []).length;
      let closeBraces = (result.match(/}/g) || []).length;
      let openBrackets = (result.match(/\[/g) || []).length;
      let closeBrackets = (result.match(/]/g) || []).length;
      
      // Đóng tất cả ngoặc còn thiếu
      while (closeBraces < openBraces) { result += '}'; closeBraces++; }
      while (closeBrackets < openBrackets) { result += ']'; closeBrackets++; }
      
      // Clean trailing comma cuối cùng nếu có
      result = result.replace(/,\s*([}\]])/g, '$1');
      
      return result;
    };
    
    const rescued = addClosingBrackets(raw);
    console.log("✅ Đã cứu JSON bị cắt ngang từ Claude 4.6");
    
    try {
      return extractJsonObject(rescued);
    } catch {
      console.warn("⚠️  Không thể cứu JSON, thử raw gốc");
    }
  }

  return extractJsonObject(raw);
}
