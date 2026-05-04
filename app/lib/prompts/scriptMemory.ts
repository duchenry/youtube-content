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
// APPLY SECTION
// ─────────────────────────────────────────────────────────────

export function applySectionToMemory(memory: ScriptMemory, section: string): ScriptMemory {
  const next = { ...memory };

  switch (section) {
    case "hook":
      next.emotionalTrace.push("Hook: tension opened");
      break;
    case "setup":
      next.emotionalTrace.push("Setup: grounded");
      next.anchorsUsed.push("physicalDetail");
      break;
    case "contradiction":
      next.emotionalTrace.push("Contradiction: peak tension");
      next.clipAnchors.push("contradiction");
      break;
    case "reframe":
      next.emotionalTrace.push("Reframe: shift");
      next.clipAnchors.push("reframe");
      break;
    case "solution":
      next.emotionalTrace.push("Solution: partial relief");
      break;
    case "close":
      next.emotionalTrace.push("Close: fade");
      next.anchorsUsed.push("almostMoment");
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
    lines.push(`RULE: no new idea, only echo`);
  }

  // ENERGY CONTROL
  lines.push(`ENERGY: Hook→Setup→Peak→Shift→Soft→Fade`);

  return lines.slice(0, 6).join("\n");
}