// ─────────────────────────────────────────────────────────────
// VOICE PRESET MAP — Arc 3
// ─────────────────────────────────────────────────────────────

import { buildArcContract, buildIdentityLock, buildVoice } from "./scriptGenerator";

export const VOICE_PRESET: Record<
  string,
  "investigative" | "conspiratorial" | "contrarian"
> = {
  hook: "conspiratorial",
  crack: "investigative",
  expose: "conspiratorial",
  validate: "investigative",
  framework: "contrarian",
  close: "conspiratorial",
};

// ─────────────────────────────────────────────────────────────
// ENERGY MAP — Arc 3
// ─────────────────────────────────────────────────────────────

export const ENERGY_MAP: Record<string, string> = {
  hook: "8/10 — dissonance. 1 unexplained fact. Let it sit.",
  crack: "7/10 — assumption breaking. Show the seam. Don't explain the full mechanism.",
  expose: "9/10 — peak. Name the villain mechanism. Do not soften.",
  validate: "7/10 — proof before relief. Screenshot-able line required.",
  framework: "6/10 — new lens. 1 concrete action. End on open edge.",
  close: "9/10 — divide the room. Debate question. No summary. No conclusion.",
};

// ─────────────────────────────────────────────────────────────
// MAP TO SCRIPT INPUTS — Arc 3 Final
// ─────────────────────────────────────────────────────────────

export function mapToScriptInputs(
  data: any,
  previousOutputs: Record<string, string> = {}
) {
  const research = data?.research || {};
  const synthesis = data?.synthesis || {};
  const extraction = data?.extraction || {};

  // ─────────────────────────────────────────────────────────────
  // SHARED — all from real pipeline data, no fabrication
  // ─────────────────────────────────────────────────────────────

  const primaryScenario =
    synthesis?.pain?.scenario ||
    synthesis?.anchors?.[0]?.scenario ||
    extraction?.audience?.painMap?.[0]?.realScenario ||
    "";

  const primaryPain =
    synthesis?.pain?.real ||
    extraction?.audience?.painMap?.[0]?.pain ||
    "";

  const primaryLoop =
    synthesis?.coreEngine?.behaviorLoop || "";

  const primaryContradiction =
    research?.primaryContradiction?.description ||
    synthesis?.coreEngine?.contradiction ||
    "";

  const primaryOpenQuestion =
    synthesis?.forwardTension?.openQuestion ||
    research?.primaryContradiction?.description ||
    "";

  // ─────────────────────────────────────────────────────────────
  // ANCHOR EXTRACTION — by use position
  // ─────────────────────────────────────────────────────────────

  const anchors: Array<{ scenario: string; emotion: string; use: string }> =
    synthesis?.anchors || [];

  const hookAnchor =
    anchors.find((a) => a.use === "hook")?.scenario || "";

  const midAnchor =
    anchors.find((a) => a.use === "mid")?.scenario || "";

  // Prefer relief proof anchor — creates stronger validate arc
  const proofAnchor =
    anchors.find((a) => a.use === "proof" && a.emotion === "relief")?.scenario ||
    anchors.find((a) => a.use === "proof")?.scenario ||
    "";

  // ─────────────────────────────────────────────────────────────
  // PHYSICAL DETAIL — join array into usable string
  // ─────────────────────────────────────────────────────────────

  const physicalDetail =
    synthesis?.physicalDetail?.length
      ? synthesis.physicalDetail.join("\n")
      : "";

  // ─────────────────────────────────────────────────────────────
  // VILLAIN — prefer current synthesis schema, keep old fallback
  // ─────────────────────────────────────────────────────────────

  const villainEntity =
    synthesis?.coreEngine?.villain?.entity || "";

  const villainMechanism =
    synthesis?.coreEngine?.villain?.howItOperates ||
    synthesis?.coreEngine?.noWinLoop ||
    "";

  const peakImplication =
    synthesis?.execution?.peak ||
    synthesis?.scriptBridge?.coreTruth ||
    extraction?.coreTruth?.insight ||
    synthesis?.pain?.real ||
    "";

  // ─────────────────────────────────────────────────────────────
  // VALIDATE fields — now includes unspokenNeed + structuralConstraint
  // ─────────────────────────────────────────────────────────────

  const structuralProof =
    synthesis?.coreEngine?.contradiction ||
    primaryContradiction ||
    "";

  const structuralGap =
    synthesis?.coreEngine?.noWinLoop || "";

  const validationLine =
    synthesis?.beliefShift?.to ||
    extraction?.coreTruth?.insight ||
    "";

  const unspokenNeed =
    synthesis?.scriptBridge?.unspokenNeed || "";

  const structuralConstraint =
    synthesis?.scriptBridge?.constraint || "";

  // ─────────────────────────────────────────────────────────────
  // FRAMEWORK fields — fallback chain
  // ─────────────────────────────────────────────────────────────

  const reframeLens =
    synthesis?.beliefShift?.to ||
    synthesis?.scriptBridge?.coreTruth ||
    synthesis?.execution?.end ||
    "";

  const concreteAction =
    synthesis?.forwardTension?.aspirationalGlimpse ||
    synthesis?.scriptBridge?.optionA?.action ||
    extraction?.audience?.commentInsight?.unspokenNeed ||
    "";

  const openEdge =
    extraction?.coreTruth?.insight ||
    synthesis?.coreEngine?.contradiction ||
    "";

  // ─────────────────────────────────────────────────────────────
  // CLOSE fields — now includes noWinAsymmetry
  // ─────────────────────────────────────────────────────────────

  const debateQuestion =
    synthesis?.forwardTension?.openQuestion ||
    primaryContradiction ||
    "";

  const noWinAsymmetry =
    synthesis?.scriptBridge?.noWinAsymmetry || "";

  // ─────────────────────────────────────────────────────────────
  // CHARACTER PROSE → feeds buildVoice()
  // ─────────────────────────────────────────────────────────────

  const characterProse = [
    extraction?.audience?.profile && `${extraction.audience.profile}.`,
    primaryScenario && `${primaryScenario}.`,
    primaryPain && `${primaryPain}.`,
    primaryLoop && `${primaryLoop}.`,
    synthesis?.beliefShift?.breakMoment
      ? `Once: ${synthesis.beliefShift.breakMoment}.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  // ─────────────────────────────────────────────────────────────
  // SYSTEM VARS — per section
  // ─────────────────────────────────────────────────────────────

  const sys = (section: string, prev?: string) => {
    const prevOutput = prev != null ? previousOutputs[prev] : undefined;

    return {
      arcContract: buildArcContract(section as any),

      identityLock: buildIdentityLock({
        age: extraction?.viewerProfile?.ageRange || "",
        income: extraction?.viewerProfile?.incomeOrSituation || "",
        job: extraction?.audience?.profile || "",
        livingSituation: primaryScenario,
      }),

      voice: buildVoice(
        characterProse || primaryPain,
        VOICE_PRESET[section] || "conspiratorial",
        prev ? VOICE_PRESET[prev] : undefined
      ),

      lastLines: prevOutput
        ? prevOutput.trim().split("\n").filter(Boolean).slice(-4).join("\n")
        : "",
    };
  };

  return {

    // ── HOOK ─────────────────────────────────────────────────────
    hook: {
      ...sys("hook"),
      rawPain:
        extraction?.audience?.painMap?.[0]?.pain ||
        synthesis?.pain?.surface ||
        "",
      contradiction: primaryContradiction,
      falseBelief: synthesis?.beliefShift?.from || "",
      openQuestion: primaryOpenQuestion,
      hookAnchor,
      physicalDetail,
    },

    // ── CRACK ────────────────────────────────────────────────────
    crack: {
      ...sys("crack", "hook"),
      falseBelief: synthesis?.beliefShift?.from || "",
      crackMoment: synthesis?.beliefShift?.breakMoment || "",
      contradiction: primaryContradiction,
      midAnchor,
      realPain: synthesis?.pain?.real || "",
    },

    // ── EXPOSE ───────────────────────────────────────────────────
    expose: {
      ...sys("expose", "crack"),
      villainEntity,
      villainMechanism,
      behaviorLoop: primaryLoop,
      peakImplication,
    },

    // ── VALIDATE ─────────────────────────────────────────────────
    validate: {
      ...sys("validate", "expose"),
      structuralProof,
      structuralGap,
      validationLine,
      proofAnchor,
      unspokenNeed,
      structuralConstraint,
    },

    // ── FRAMEWORK ────────────────────────────────────────────────
    framework: {
      ...sys("framework", "validate"),
      reframeLens,
      concreteAction,
      openEdge,
    },

    // ── CLOSE ────────────────────────────────────────────────────
    close: {
      ...sys("close", "framework"),
      debateQuestion,
      sideA: synthesis?.beliefShift?.from || "",
      sideB: synthesis?.beliefShift?.to || "",
      coreTruth: extraction?.coreTruth?.insight || "",
      noWinAsymmetry,
    },
  };
}