export interface AnalysisResult {
  // STEP 1: Core extraction
  coreTruth: {
    insight: string;
    trigger: string;
  };
  attention: {
    patternBreak: {
      whatFeelsDifferent: string;
      whyItGrabs: string;
    };
    escalation: string;
    retention: string;
  };
  persuasion: {
    beliefDestroyed: string;
    beliefInstalled: string;
  };
  structure: {
    hookMechanism: string;
    revealMoment: string;
    payoff: string;
  };

  financialReality?: {
    numbersUsed: string;
    perceptionEffect: string;
    manipulation: string;
  };

  structureDNA?: {
    phases: Array<{
      phase: string;
      timeRange: string;
      goal: string;
      tactic: string;
      viewerState: string;
    }>;
    transitions: Array<{
      from: string;
      to: string;
      method: string;
      lineExample: string;
    }>;
    retentionMoments: Array<{
      moment: string;
      whyItWorks: string;
      pattern: string;
    }>;
  };

  // STEP 2: Audience psychology
  viewer: {
    profile: string;
    externalMask: string;
    internalFear: string;
    triggerMoment: string;
  };
  egoThreat: {
    whatHurts: string;
    comparison: string;
    privateTruth: string;
  };
  painMap: Array<{
    pain: string;
    feeling: string;
    realScenario: string;
  }>;
  desire: {
    surface: string;
    real: string;
    identityShift: string;
  };

  // STEP 2.5: Differentiation (optional)
  differentiation?: {
    povMode: 'anti-system' | 'balanced' | 'strategic';
    agreement: string;
    destruction: string[];
    newPOV: {
      core: string;
      edge: string;
    };
    truthFilter: {
      fakeGood: string;
      realTruth: string;
    };
  };

  // STEP 3A: Idea engine
  angles: Array<{
    type: string;
    idea: string;
    whyItWorks: string;
  }>;
  contentIdeas: Array<{
    title: string;
    angle: string;
    coreConflict: string;
  }>;

  // STEP 3B: Execution
  hooks: Array<{
    type: string;
    text: string;
  }>;
  script: {
    opening: string;
    closing: string;
  };
  antiAI: {
    avoid: string[];
    fix: string;
  };
  risk: {
    whyFeelsAI: string;
    fix: string;
  };

  // Optional input metadata
  inputComments?: string[];
}

export interface RedditIdea {
  hardTruth: {
    theParadox: string;
    theSelfDeception: string;
    theBrutalReality: string;
    thePivot: string;
  };
  theHook: {
    shockingHeadline: string;
    visualTrigger: string;
    psychologicalHook: string;
  };
  viralAngles: Array<{
    name: string;
    gimmick: string;
    egoTrigger: string;
  }>;
  vocabulary: {
    powerSlang: string[];
    physicalMetaphors: string[];
    innerMonologue: string[];
  };
  painPoints: Array<{
    scenario: string;
    internalFeeling: string;
  }>;
  label?: string;
  notes?: string;
}

export interface RedditPostData {
  title: string;
  selfText: string;
  upvotes: number;
  comments: Array<{
    author: string;
    text: string;
    upvotes: number;
  }>;
}
