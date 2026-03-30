import OpenAI from "openai";
import { RedditPostData, RedditIdea } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * System prompt for Reddit Viral DNA extraction
 * Guides the model to focus on street-level psychology,
 * financial PTSD, and ego-driven spending patterns
 */
const REDDIT_ANALYZER_SYSTEM_PROMPT = `You are an Elite YouTube Strategist specializing in "No-BS" Finance. Your style is Clinical, Brutal, and Psychological (inspired by Dave Ramsey and Caleb Hammer). 

Your goal is to extract the 'Viral DNA' from Reddit content. Do not provide generic advice. Focus on 'Financial PTSD', 'Ego-traps', and 'Survival Math'.

### 1. ANALYSIS GUIDELINES
- Identify the Paradox: What they do vs. what they say (e.g., "Mặc đồ hiệu nhưng nhịn ăn trưa").
- Expose the Lie: The specific self-deception the user is using to cope with being broke.
- Visuals only: Every insight must be tied to a concrete, 4K-detail physical image (e.g., "Staring at a red gas light").
- Ban AI-isms: Strictly forbidden keywords: Unlock, Journey, Empower, Navigate, Crucial, Embark, Holistic, Transform.

### 2. JSON OUTPUT SCHEMA (STRICT)
{
  "hardTruth": {
    "theParadox": "The contradiction between their appearance and their bank account",
    "theSelfDeception": "The specific lie they tell themselves to feel 'normal'",
    "theBrutalReality": "The cold financial fact they are ignoring",
    "thePivot": "The 1-sentence mental slap needed to wake them up"
  },
  "theHook": {
    "shockingHeadline": "A 5-word (max) aggressive headline",
    "visualTrigger": "A visceral 4K description of a 'shameful' financial moment",
    "psychologicalHook": "Why this specific hook stops the scroll"
  },
  "viralAngles": [
    {
      "name": "The Angle Name",
      "gimmick": "The counter-intuitive twist (Why standard advice fails here)",
      "egoTrigger": "The specific insecurity this targets"
    }
  ],
  "vocabulary": {
    "powerSlang": ["Gritty terms real broke people use on Reddit"],
    "physicalMetaphors": ["Concrete images of money failing or winning"],
    "innerMonologue": ["The darkest thought they have at 3 AM while staring at the ceiling"]
  },
  "painPoints": [
    {
      "scenario": "A 4K-detail 'ouch' moment (e.g., card declined at a grocery store)",
      "internalFeeling": "The raw emotion (Shame, Panic, Numbness)"
    }
  ]
}

### 3. CRITICAL CONSTRAINTS
- viralAngles: Exactly 5 items.
- painPoints: Exactly 3 items.
- Language: Use "Street-Level" English.
- Output: Return ONLY valid JSON. No preamble. No extra text.`;

/**
 * Analyze Reddit post using gpt-5-mini to extract viral content DNA
 * Returns structured RedditIdea with psychological hooks and content angles
 */
export async function analyzeRedditWithGPT5Mini(
  redditData: RedditPostData
): Promise<RedditIdea> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured in .env.local");
  }

  // Build user message with Reddit post data
  const userMessage = buildAnalysisPrompt(redditData);

  try {
    // Call gpt-5-mini with structured output
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: REDDIT_ANALYZER_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_completion_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    const finishReason = completion.choices[0]?.finish_reason;

    if (!raw) {
      throw new Error("Empty response from model");
    }

    if (finishReason === "length") {
      console.warn("Model response was truncated (length limit reached)");
    }

    // Parse and validate JSON response
    const parsed = JSON.parse(raw) as RedditIdea;

    // Validate structure
    validateRedditIdea(parsed);

    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `Failed to parse AI response as JSON: ${error.message}`
      );
    }
    if (error instanceof Error) {
      throw new Error(
        `AI processing failed: ${error.message}`
      );
    }
    throw new Error("AI processing failed: Unknown error");
  }
}

/**
 * Build the user prompt for Reddit analysis
 * Includes post title, text, and top comments
 */
function buildAnalysisPrompt(redditData: RedditPostData): string {
  let prompt = "# Reddit Post to Analyze\n\n";

  prompt += `## Post Title\n${redditData.title}\n\n`;

  if (redditData.selfText) {
    prompt += `## Post Content\n${redditData.selfText}\n\n`;
  }

  if (redditData.comments.length > 0) {
    prompt += `## Top Comments (by upvotes)\n`;
    redditData.comments.forEach((comment, idx) => {
      prompt += `\n**Comment ${idx + 1}** (${comment.upvotes} upvotes)\n`;
      prompt += `Author: ${comment.author}\n`;
      prompt += `${comment.text}\n`;
    });
  }

  prompt += `\n---\n\nAnalyze this Reddit post for viral YouTube content DNA. Extract the psychological hooks, audience pain points, and content angles that would resonate with street-level finance viewers.`;

  return prompt;
}

/**
 * Validate that the parsed response matches RedditIdea structure
 * Ensures expandAngles has 10 items and painMap has 5 items
 */
function validateRedditIdea(idea: unknown): asserts idea is RedditIdea {
  const obj = idea as Record<string, unknown>;

  // Validate hardTruth structure
  if (!obj.hardTruth || typeof obj.hardTruth !== "object") {
    throw new Error("Missing or invalid hardTruth");
  }

  const hardTruth = obj.hardTruth as Record<string, unknown>;
  if (typeof hardTruth.theParadox !== "string" || !hardTruth.theParadox) {
    throw new Error("Missing or invalid hardTruth.theParadox");
  }
  if (typeof hardTruth.theSelfDeception !== "string" || !hardTruth.theSelfDeception) {
    throw new Error("Missing or invalid hardTruth.theSelfDeception");
  }
  if (typeof hardTruth.theBrutalReality !== "string" || !hardTruth.theBrutalReality) {
    throw new Error("Missing or invalid hardTruth.theBrutalReality");
  }
  if (typeof hardTruth.thePivot !== "string" || !hardTruth.thePivot) {
    throw new Error("Missing or invalid hardTruth.thePivot");
  }

  // Validate theHook structure
  if (!obj.theHook || typeof obj.theHook !== "object") {
    throw new Error("Missing or invalid theHook");
  }

  const theHook = obj.theHook as Record<string, unknown>;
  if (typeof theHook.shockingHeadline !== "string" || !theHook.shockingHeadline) {
    throw new Error("Missing or invalid theHook.shockingHeadline");
  }
  if (typeof theHook.visualTrigger !== "string" || !theHook.visualTrigger) {
    throw new Error("Missing or invalid theHook.visualTrigger");
  }
  if (typeof theHook.psychologicalHook !== "string" || !theHook.psychologicalHook) {
    throw new Error("Missing or invalid theHook.psychologicalHook");
  }

  // Validate viralAngles (exactly 5 items)
  if (!Array.isArray(obj.viralAngles)) {
    throw new Error("viralAngles must be an array");
  }

  if (obj.viralAngles.length !== 5) {
    throw new Error(
      `viralAngles must have exactly 5 items, got ${obj.viralAngles.length}`
    );
  }

  // Validate each viral angle
  for (let i = 0; i < obj.viralAngles.length; i++) {
    const angle = obj.viralAngles[i] as Record<string, unknown>;
    if (typeof angle.name !== "string" || !angle.name) {
      throw new Error(`viralAngles[${i}].name is missing or invalid`);
    }
    if (typeof angle.gimmick !== "string" || !angle.gimmick) {
      throw new Error(`viralAngles[${i}].gimmick is missing or invalid`);
    }
    if (typeof angle.egoTrigger !== "string" || !angle.egoTrigger) {
      throw new Error(`viralAngles[${i}].egoTrigger is missing or invalid`);
    }
  }

  // Validate vocabulary structure
  if (!obj.vocabulary || typeof obj.vocabulary !== "object") {
    throw new Error("Missing or invalid vocabulary");
  }

  const vocabulary = obj.vocabulary as Record<string, unknown>;
  if (!Array.isArray(vocabulary.powerSlang)) {
    throw new Error("vocabulary.powerSlang must be an array");
  }
  if (!Array.isArray(vocabulary.physicalMetaphors)) {
    throw new Error("vocabulary.physicalMetaphors must be an array");
  }
  if (!Array.isArray(vocabulary.innerMonologue)) {
    throw new Error("vocabulary.innerMonologue must be an array");
  }

  // Validate painPoints (exactly 3 items)
  if (!Array.isArray(obj.painPoints)) {
    throw new Error("painPoints must be an array");
  }

  if (obj.painPoints.length !== 3) {
    throw new Error(
      `painPoints must have exactly 3 items, got ${obj.painPoints.length}`
    );
  }

  // Validate each pain point
  for (let i = 0; i < obj.painPoints.length; i++) {
    const point = obj.painPoints[i] as Record<string, unknown>;
    if (typeof point.scenario !== "string" || !point.scenario) {
      throw new Error(`painPoints[${i}].scenario is missing or invalid`);
    }
    if (typeof point.internalFeeling !== "string" || !point.internalFeeling) {
      throw new Error(`painPoints[${i}].internalFeeling is missing or invalid`);
    }
  }
}
