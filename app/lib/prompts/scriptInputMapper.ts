import {
  buildArcContract,
  buildIdentityLock,
  buildVoice,
} from "./scriptGenerator";

export const VOICE_PRESET: Record<
  string,
  "resigned" | "building" | "raw"
> = {
  hook: "raw",
  setup: "resigned",
  contradiction: "building",
  reframe: "resigned",
  solution: "resigned",
  close: "resigned",
};

export const ENERGY_MAP: Record<string, string> = {
  hook: "ambient — not crisis, discomfort is background noise",
  setup: "tightening — pressure building, not arrived yet",
  contradiction: "peak — both exits closed, do not flatten anything",
  reframe: "deflating — quieter than contradiction, something shifted sideways",
  solution: "low — running out of things to say, options considered with no conviction",
  close: "dissipating — flat, no energy for meaning, sentences smallest in script",
};

export function mapToScriptInputs(data: any, previousOutputs: Record<string, string> = {}) {
  const research = data?.research || {};
  const synthesis = data?.synthesis || {};
  const extraction = data?.extraction || {};

  // ─────────────────────────────────────────────────────────────
  // SHARED FALLBACKS
  // ─────────────────────────────────────────────────────────────

  const primaryScenario =
    synthesis?.pain?.scenario ||
    synthesis?.anchors?.[0]?.scenario ||
    extraction?.audience?.painMap?.[0]?.realScenario ||
    "Small apartment. Same routine.";

  const primaryPain =
    synthesis?.pain?.real ||
    extraction?.audience?.painMap?.[0]?.pain ||
    "Feels stuck financially.";

  const primaryLoop =
    synthesis?.coreEngine?.behaviorLoop ||
    "Checks numbers. Closes app. Repeats later.";

  const primaryContradiction =
    research?.primaryContradiction?.description ||
    synthesis?.coreEngine?.contradiction ||
    "Working more doesn't seem to change anything.";

  const primaryOpenQuestion =
    synthesis?.forwardTension?.openQuestion ||
    "";

  const primaryAspirationalGlimpse =
    synthesis?.forwardTension?.aspirationalGlimpse ||
    extraction?.viewerProfile?.aspirationalAnchor ||
    "";

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
  // SYSTEM VARS
  // ─────────────────────────────────────────────────────────────

  const sys = (section: string, prev?: string) => {
    const prevOutput = prev != null ? previousOutputs[prev] : undefined;

    return {
      arcContract: buildArcContract(section as any),

      identityLock: buildIdentityLock({
        age:
          extraction?.viewerProfile?.ageRange ||
          "late 20s",

        income:
          extraction?.viewerProfile?.incomeOrSituation ||
          "unstable income",

        job:
          extraction?.audience?.profile ||
          "works online",

        livingSituation: primaryScenario,
      }),

      voice: buildVoice(
        characterProse || primaryPain,
        VOICE_PRESET[section] || "resigned",
        prev ? VOICE_PRESET[prev] : undefined
      ),

      lastLines: prevOutput
        ? prevOutput.trim().split("\n").filter(Boolean).slice(-4).join("\n")
        : "Opening section — no previous lines.",

      physicalDetail:
        synthesis?.anchors?.[0]?.physicalDetail ||
        primaryScenario,

      scriptMemory:
        synthesis?.beliefShift?.breakMoment ||
        synthesis?.pain?.real ||
        primaryScenario,

      habitLoop: primaryLoop,

      almostMoment:
        synthesis?.anchors?.find(
          (a: any) => a?.emotion === "relief"
        )?.scenario ||
        synthesis?.anchors?.[0]?.scenario ||
        primaryScenario,
    };
  };

  return {
    hook: {
      ...sys("hook"),

      rawPain:
        extraction?.audience?.painMap?.[0]?.pain ||
        synthesis?.pain?.surface ||
        primaryPain,

      contradiction: primaryContradiction,

      falseBelief:
        synthesis?.beliefShift?.from ||
        "If I keep pushing harder it'll eventually work.",

      openQuestion: primaryOpenQuestion,
    },

    setup: {
      ...sys("setup", "hook"),

      scenario:
        extraction?.audience?.painMap?.[0]?.realScenario ||
        primaryScenario,

      behaviorLoop: primaryLoop,

      behaviorCost:
        synthesis?.pain?.real ||
        primaryPain,

      constraint:
        synthesis?.pain?.scenario ||
        primaryScenario,
    },

    contradiction: {
      ...sys("contradiction", "setup"),

      optionAAction:
        synthesis?.coreEngine?.noWinLoop ||
        "Keep grinding harder",

      optionACost:
        synthesis?.coreEngine?.identityPressure ||
        "Gets more exhausted",

      optionBAction:
        synthesis?.beliefShift?.from ||
        "Try changing direction",

      optionBCost:
        synthesis?.beliefShift?.to ||
        "Might lose stability completely",

      noWinAsymmetry:
        primaryContradiction,

      fearIfNotAct:
        synthesis?.coreEngine?.identityPressure ||
        "Nothing changes if he stays the same",
    },

    reframe: {
      ...sys("reframe", "contradiction"),

      falseBelief:
        synthesis?.coreEngine?.contradiction ||
        primaryContradiction,

      crackMoment:
        synthesis?.beliefShift?.breakMoment ||
        "Something about the pattern stopped feeling normal.",

      hiddenTruth:
        synthesis?.beliefShift?.to ||
        "Maybe the system itself changed.",

      aspirationalGlimpse: primaryAspirationalGlimpse,
    },

    solution: {
      ...sys("solution", "reframe"),

      unspokenNeed:
        extraction?.audience?.commentInsight?.unspokenNeed ||
        "Needs relief more than motivation.",

      behaviorLoop: primaryLoop,

      aspirationalGlimpse: primaryAspirationalGlimpse,
    },

    close: {
      ...sys("close", "solution"),

      coreTruth:
        extraction?.coreTruth?.insight ||
        "The pressure never fully leaves.",

      coreBelief:
        extraction?.viewerProfile?.coreBelief ||
        "Hard work is supposed to fix things.",
    },
  };
}