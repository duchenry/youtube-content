export interface ScriptMemory {
  scenario?: string;
  coreBelief?: string;
  emotionalArc?: string;
  emotionalTrace: string[];
  structuralMoves: string[];
  anchorsUsed: string[];
  clipAnchors: string[];
}

export function initScriptMemory(data: any): ScriptMemory {
  return {
    scenario: data.extraction?.audience?.painMap?.[0]?.realScenario,
    coreBelief: data.extraction?.viewerProfile?.coreBelief,
    emotionalArc: data.synthesis?.contentBriefSeed?.emotionalArc,
    emotionalTrace: [],
    structuralMoves: [],
    anchorsUsed: [],
    clipAnchors: [],
  };
}

// ─────────────────────────────────────────────────────────────
// APPLY SECTION — updated to new Arc 3 keys
// ─────────────────────────────────────────────────────────────

export function applySectionToMemory(memory: ScriptMemory, section: string): ScriptMemory {
  const next = { ...memory };

  switch (section) {
    case "hook":
      next.emotionalTrace.push("Hook: dissonance opened");
      break;
    case "crack":
      next.emotionalTrace.push("Crack: assumption broken");
      next.anchorsUsed.push("physicalDetail");
      break;
    case "expose":
      next.emotionalTrace.push("Expose: peak tension");
      next.clipAnchors.push("expose");
      break;
    case "validate":
      next.emotionalTrace.push("Validate: proof before relief");
      next.clipAnchors.push("validate");
      break;
    case "framework":
      next.emotionalTrace.push("Framework: new lens");
      break;
    case "close":
      next.emotionalTrace.push("Close: debate question");
      next.anchorsUsed.push("debateQuestion");
      break;
  }

  return next;
}

// ─────────────────────────────────────────────────────────────
// BUILD MEMORY STRING (PRIORITIZED)
// ─────────────────────────────────────────────────────────────

export function buildScriptMemoryString(memory: ScriptMemory, nextSection: string): string {
  const lines: string[] = [];

  if (memory.scenario) {
    lines.push(`SCENARIO LOCK: "${memory.scenario}"`);
  }

  if (memory.emotionalArc) {
    lines.push(`ARC: ${memory.emotionalArc}`);
  }

  if (memory.emotionalTrace.length) {
    lines.push(`TRACE: ${memory.emotionalTrace.join(" → ")}`);
  }

  if (memory.clipAnchors.length) {
    lines.push(`CLIPS: ${memory.clipAnchors.join(", ")}`);
  }

  if (nextSection === "close") {
    lines.push(`RULE: end on debate question — no summary, no conclusion`);
  }

  // ENERGY CONTROL — Arc 3
  lines.push(`ENERGY: Hook(8)→Crack(7)→Expose(9)→Validate(7)→Framework(6)→Close(9)`);

  return lines.slice(0, 6).join("\n");
}