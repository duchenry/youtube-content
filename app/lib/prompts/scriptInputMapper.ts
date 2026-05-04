export function mapToScriptInputs(data: any) {
  const research = data.research || {};
  const synthesis = data.synthesis || {};
  const extraction = data.extraction || {};

  return {
    hook: {
      rawPain: extraction?.audience?.painMap?.[0]?.pain ?? "",
      contradiction: research?.primaryContradiction?.description ?? "",
      falseBelief: synthesis?.coreEngine?.contradiction ?? "",
    },

    setup: {
      scenario: extraction?.audience?.painMap?.[0]?.realScenario ?? "",
      behaviorLoop: synthesis?.coreEngine?.behaviorLoop ?? "",
      behaviorCost: synthesis?.pain?.real ?? "",
      constraint: synthesis?.pain?.scenario ?? "",
    },

    contradiction: {
      optionAAction: research?.noWinLoops?.[0]?.optionA?.action ?? "",
      optionACost: research?.noWinLoops?.[0]?.optionA?.longTermCost ?? "",
      optionBAction: research?.noWinLoops?.[0]?.optionB?.action ?? "",
      optionBCost: research?.noWinLoops?.[0]?.optionB?.longTermCost ?? "",
      noWinAsymmetry: research?.noWinLoops?.[0]?.asymmetry ?? "",
      fearIfNotAct: synthesis?.coreEngine?.identityPressure ?? "",
    },

    reframe: {
      falseBelief: synthesis?.coreEngine?.contradiction ?? "",
      crackMoment: synthesis?.beliefShift?.breakMoment ?? "",
      hiddenTruth: synthesis?.beliefShift?.to ?? "",
    },

    solution: {
      unspokenNeed: synthesis?.pain?.real ?? "",
      behaviorLoop: synthesis?.coreEngine?.behaviorLoop ?? "",
    },

    close: {
      coreTruth: extraction?.coreTruth?.insight ?? "",
      coreBelief: extraction?.viewerProfile?.coreBelief ?? "",
    }
  };
}