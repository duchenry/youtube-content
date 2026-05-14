// app/lib/evaluation/buildNarrativeState.ts

type BuildNarrativeStateParams = {
  evaluation: any;
  currentSection: string;
  currentText: string;
  previousText: string;
};

export function buildNarrativeState({
  evaluation,
  currentSection,
  currentText,
  previousText,
}: BuildNarrativeStateParams) {
  // ─────────────────────────────────────
  // EMPTY FALLBACK
  // ─────────────────────────────────────

  if (!evaluation) {
    return {
      overusedMotifs: [],
      overusedAnchors: [],
      tensionWarnings: [],
      conclusiveRisks: [],
    };
  }

  // ─────────────────────────────────────
  // SEARCHABLE CONTEXT
  // ─────────────────────────────────────

  const searchable = `
${currentText ?? ""}
${previousText ?? ""}
  `.toLowerCase();

  // ─────────────────────────────────────
  // OVERUSED MOTIFS
  // ─────────────────────────────────────

const overusedMotifs =
  evaluation.motifFlags
    ?.filter((motif: any) => {
      if (motif.verdict !== "overused") return false;

      const motifParts = String(motif.motif ?? "")
        .toLowerCase()
        .split("/")
        .map((s: string) => s.trim())
        .filter(Boolean);

      return motifParts.some((part: string) =>
        searchable.includes(part)
      );
    })
    .map((motif: any) => ({
      motif: motif.motif,
      count: motif.count,
      advice: motif.advice,
    })) ?? [];

  // ─────────────────────────────────────
  // OVERUSED ANCHORS
  // ─────────────────────────────────────

  const overusedAnchors =
    evaluation.anchorOveruse?.filter((anchor: any) => {
      if (anchor.verdict !== "overused") return false;

      return searchable.includes(
        String(anchor.detail ?? "").toLowerCase()
      );
    }).map((anchor: any) => ({
      detail: anchor.detail,
      sections: anchor.sections,
      advice: anchor.advice,
    })) ?? [];

  // ─────────────────────────────────────
  // TENSION WARNINGS
  // ─────────────────────────────────────

  const tensionWarnings =
    evaluation.tensionCurve?.filter((item: any) => {
      return (
        String(item.section ?? "").toLowerCase() ===
          currentSection.toLowerCase() &&
        item.issue
      );
    }).map((item: any) => ({
      issue: item.issue,
      advice: item.advice,
      expectedLevel: item.expectedLevel,
    })) ?? [];

  // ─────────────────────────────────────
  // CONCLUSIVE RISKS
  // ─────────────────────────────────────

  const conclusiveRisks =
    evaluation.conclusiveEndings?.filter((item: any) => {
      return (
        String(item.section ?? "").toLowerCase() ===
        currentSection.toLowerCase()
      );
    }).map((item: any) => ({
      quote: item.quote,
      issue: item.issue,
      advice: item.advice,
    })) ?? [];

  // ─────────────────────────────────────
  // FINAL STATE
  // ─────────────────────────────────────

  return {
    overusedMotifs,
    overusedAnchors,
    tensionWarnings,
    conclusiveRisks,
  };
}