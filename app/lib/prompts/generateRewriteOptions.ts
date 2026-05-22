// app/lib/prompts/generateRewriteOptions.ts

export function buildRewriteOptionsPrompt({
  section,
  text,
  previous,
  edits,
}: {
  section: string;
  text: string;
  previous: string;
  edits: any[];
}): string {
  return `
You are generating rewrite options for flagged line edits in a personal finance voiceover script.

SECTION: ${section}

[PREVIOUS — REFERENCE ONLY]
${previous}
[END PREVIOUS]

[CURRENT SCRIPT SECTION]
${text}
[END CURRENT SCRIPT SECTION]

[FLAGGED EDITS]
${JSON.stringify(edits, null, 2)}
[END FLAGGED EDITS]

Only process edits where type is "line_edit".
If any structure_edit appears, ignore it.
Do not generate rewriteOptions for structure_edit.

For each line_edit, preserve these fields exactly:
- type
- quote
- issue
- impactLevel
- suggestion

Add only:
- exactly 3 rewriteOptions

Do NOT include structure_edit.
Do NOT include placement.
Do NOT include action.
Do NOT include rewriteHint.
Do NOT include rhythm, action, omission, or anchor.

━━━━━━━━━━━━━━━━━━━
CORE REWRITE RULE
━━━━━━━━━━━━━━━━━━━
Each rewriteOption.text must directly replace the exact quote.

The replacement must work if inserted into the script using:
originalText.replaceAll(quote, rewriteOption.text)

This means:
- Do NOT assume surrounding words will be removed
- Do NOT duplicate surrounding words unless they are inside the quote
- If the quote is a phrase, the rewrite must fit as a phrase
- If the quote is a full sentence or paragraph, the rewrite may be a full sentence or paragraph
- Never write a replacement that requires changing text outside the quote

━━━━━━━━━━━━━━━━━━━
DETAIL SAFETY RULE
━━━━━━━━━━━━━━━━━━━
Use ONLY details that already appear in CURRENT or PREVIOUS.

Do NOT invent new:
- objects
- amenities
- locations
- numbers
- brands
- people
- apps
- events
- scenarios

Invalid examples:
- adding "gym" if no gym is mentioned
- adding a new dollar amount
- adding a new store, app, brand, person, or location
- adding a new action that did not happen in the script

If no concrete detail exists, use one of these mechanisms instead of inventing detail:
- compression
- interruption
- contradiction
- implication
- unresolved trailing thought

Any rewriteOption that introduces a new concrete detail not found in CURRENT or PREVIOUS is invalid.

━━━━━━━━━━━━━━━━━━━
REWRITE OPTION RULES
━━━━━━━━━━━━━━━━━━━
Each rewriteOption must:
- directly replace the flagged quote
- max 18 words
- preserve the same emotional context
- solve the issue through a DIFFERENT mechanism
- avoid moralizing
- avoid generic finance phrasing
- avoid polished or literary writing
- sound human, spoken, and specific
- feel naturally unfinished when appropriate
- use ONLY objects, numbers, actions, locations, or phrases that already appear in CURRENT or PREVIOUS
- do not invent new details
- do not repeat the original sentence structure mechanically

Do not suggest a rewriteOption that reintroduces the same issue described in the input.
If the issue says a phrase is generic, no rewriteOption may reuse that phrase or a close abstract equivalent.

Choose 3 mechanisms from this list that best fit the flagged issue:
avoidance
implication
physical behavior
environmental tension
interruption
contradiction
escalation
silence
deflection
compression
unresolved trailing thought

Do not include adjacent punctuation or repeated trailing words that already exist immediately outside the quote.
If the original text immediately after the quote already says "Again.", do not include "Again." in rewriteOption.text.
The rewriteOption must replace only the quote, without duplicating surrounding text.

Use the "type" field inside rewriteOptions to name the mechanism.
Pick 3 different mechanisms.
Do NOT default to the same 3 types every time.

━━━━━━━━━━━━━━━━━━━
SCORING RULES
━━━━━━━━━━━━━━━━━━━
Each rewriteOption needs:
- type
- text
- score from 1 to 10
- reason max 12 words

Scores must be spread across at least a 3-point range.
Do not give all 3 options scores within 1 point of each other.

Example scores:
- 9, 7, 5
- 8, 6, 4
- 10, 7, 4

Higher scores for:
- preserving tension without naming it
- using a number, object, behavior, or concrete moment already present in the script
- sounding naturally spoken
- cutting before the thought becomes too clean

Lower scores for:
- sounding too polished
- summarizing the emotion in different words
- repeating the original sentence rhythm
- feeling like an obvious AI rewrite
- relying on abstract explanation
- introducing any new detail not found in CURRENT or PREVIOUS

"reason" must name the specific structural benefit only.

BAD reason: "feels more natural"
BAD reason: "more grounded"
GOOD reason: "uses the number instead of explaining"
GOOD reason: "cuts before the self-awareness lands"

━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━
Return ONLY valid JSON.
No markdown.
No explanation.
No text before or after JSON.
Do NOT include rewriteHint.
Do NOT include structure_edit.
Do NOT include placement.
Do NOT include action.

{
  "edits": [
    {
      "type": "line_edit",
      "quote": "same quote from input",
      "issue": "same issue from input",
      "impactLevel": "same impactLevel from input",
      "suggestion": "same suggestion from input",
      "rewriteOptions": [
        {
          "type": "mechanism name",
          "text": "replacement sentence",
          "score": 8,
          "reason": "specific structural benefit"
        },
        {
          "type": "mechanism name",
          "text": "replacement sentence",
          "score": 6,
          "reason": "specific structural benefit"
        },
        {
          "type": "mechanism name",
          "text": "replacement sentence",
          "score": 4,
          "reason": "specific structural weakness"
        }
      ]
    }
  ]
}
`.trim();
}