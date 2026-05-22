// app/lib/evaluation/buildNarrativeState.ts

type BuildNarrativeStateParams = {
  evaluation: any;
  currentSection: string;
  currentText: string;
  previousText: string;
};

function emptyNarrativeState() {
  return {
    overusedMotifs: [],
    overusedAnchors: [],
    tensionWarnings: [],
    conclusiveRisks: [],
    sectionContractFlags: [],
  };
}

function normalizeSection(value: any): string {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeText(value: any): string {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function unwrapEvaluation(input: any) {
  if (!input) return null;

  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  }

  if (input?.result && typeof input.result === "object") {
    return input.result;
  }

  if (input?.scriptEvaluation && typeof input.scriptEvaluation === "object") {
    return input.scriptEvaluation;
  }

  return input;
}

function quoteAppearsInText(quote: any, text: string): boolean {
  const q = normalizeText(quote);
  if (!q) return false;

  return text.includes(q);
}

function textIncludesDetail(detail: any, text: string): boolean {
  const d = normalizeText(detail);
  if (!d) return false;

  if (text.includes(d)) return true;

  // Handles compound labels like:
  // "gym membership / gym equipment in spare room"
  // without requiring the full combined label to appear verbatim.
  const parts = d
    .split(/[\/|,;]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 4);

  return parts.some((part) => text.includes(part));
}

export function buildNarrativeState({
  evaluation,
  currentSection,
  currentText,
  previousText,
}: BuildNarrativeStateParams) {
  // Keep previousText in the function contract for route compatibility.
  // Adjacent-flow checks are handled inside evaluateSection prompt via previous excerpt.
  void previousText;

  // ─────────────────────────────────────
  // NORMALIZE INPUT
  // Supports raw evaluation, { result }, JSON string, or null.
  // ─────────────────────────────────────

  const evalData = unwrapEvaluation(evaluation);

  if (!evalData) {
    return emptyNarrativeState();
  }

  const sectionKey = normalizeSection(currentSection);
  const currentSearchable = normalizeText(currentText);

  // ─────────────────────────────────────
  // OVERUSED MOTIFS
  // Prefer confirmed current-section quote matches when possible.
  // Keep section membership as a fallback because motif labels may be abstract.
  // Avoid matching motifs from previousText alone, because that can pollute CURRENT.
  // ─────────────────────────────────────

  const overusedMotifs =
    evalData.motifFlags
      ?.filter((motif: any) => {
        if (motif.verdict !== "overused") return false;

        const appearances = Array.isArray(motif.appearances)
          ? motif.appearances
          : [];

        if (appearances.length > 0) {
          return appearances.some((a: any) => {
            const sameSection = normalizeSection(a?.section) === sectionKey;
            const quoteMatch = quoteAppearsInText(
              a?.quote,
              currentSearchable
            );

            return sameSection || quoteMatch;
          });
        }

        return textIncludesDetail(motif.motif, currentSearchable);
      })
      .map((motif: any) => {
        const appearances = Array.isArray(motif.appearances)
          ? motif.appearances.filter((a: any) => {
              const sameSection = normalizeSection(a?.section) === sectionKey;
              const quoteMatch = quoteAppearsInText(
                a?.quote,
                currentSearchable
              );

              return sameSection || quoteMatch;
            })
          : [];

        return {
          motif: motif.motif,
          count: motif.count,
          advice: motif.advice,
          appearances,
        };
      }) ?? [];

  // ─────────────────────────────────────
  // OVERUSED ANCHORS
  // Prefer explicit sections list, but require CURRENT to still contain
  // the anchor detail when the detail is concrete enough to verify.
  // This prevents stale full-script warnings from polluting a section
  // after the user has already removed that anchor.
  // ─────────────────────────────────────

  const overusedAnchors =
    evalData.anchorOveruse
      ?.filter((anchor: any) => {
        if (anchor.verdict !== "overused") return false;

        const sections = Array.isArray(anchor.sections)
          ? anchor.sections.map(normalizeSection)
          : [];

        const appearsInCurrent = textIncludesDetail(
          anchor.detail,
          currentSearchable
        );

        if (sections.length > 0) {
          return sections.includes(sectionKey) && appearsInCurrent;
        }

        return appearsInCurrent;
      })
      .map((anchor: any) => ({
        detail: anchor.detail,
        sections: anchor.sections,
        advice: anchor.advice,
      })) ?? [];

  // ─────────────────────────────────────
  // TENSION WARNINGS
  // Current section only.
  // ─────────────────────────────────────

  const tensionWarnings =
    evalData.tensionCurve
      ?.filter((item: any) => {
        return normalizeSection(item.section) === sectionKey && item.issue;
      })
      .map((item: any) => ({
        section: item.section,
        issue: item.issue,
        advice: item.advice,
        expectedLevel: item.expectedLevel,
      })) ?? [];

  // ─────────────────────────────────────
  // CONCLUSIVE RISKS
  // Current section only.
  // ─────────────────────────────────────

  const conclusiveRisks =
    evalData.conclusiveEndings
      ?.filter((item: any) => {
        return normalizeSection(item.section) === sectionKey;
      })
      .map((item: any) => ({
        section: item.section,
        quote: item.quote,
        issue: item.issue,
        advice: item.advice,
      })) ?? [];

  // ─────────────────────────────────────
  // SECTION CONTRACT FLAGS
  // Current section only.
  // ─────────────────────────────────────

  const sectionContractFlags =
    evalData.sectionContractFlags
      ?.filter((item: any) => {
        return normalizeSection(item.section) === sectionKey;
      })
      .map((item: any) => ({
        section: item.section,
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
    sectionContractFlags,
  };
}