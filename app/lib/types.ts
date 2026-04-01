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

  // Backward-compatible alias for newer prompt schema
  proofMechanics?: {
    evidenceUsed: string;
    perceptionEffect: string;
    framing: string;
    transferablePattern?: string;
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
    riskLevel?: string;
    whyRisky?: string;
    bridge?: string;
  }>;
  script: {
    keyTurnLine?: string;
    opening?: string;
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

// ─────────────────────────────────────────
// PILOT SYSTEM — 10-Step Interactive Flow
// ─────────────────────────────────────────

// STEP 1: DATA INTAKE
export interface Step1DataIntake {
  competitorTranscript: string;
  topComments: string[];
}

// STEP 2: LOGIC ANALYSIS
export interface Step2LogicAnalysis {
  coreProblem: string;
  audienceEmotion: {
    fear: string;
    desire: string;
    insecurity: string;
  };
  attentionTrigger: string;
  competitorAngle?: {
    mainAngle: string;
    focusAreas: string[];
    ignoredAreas: string[];
  };
}

// STEP 3: POV GATE
export interface Step3POVGate {
  whatYouBelieve: string;
  whatYouAttack: string;
  whoYouDefend: string;
}

// STEP 4: STRATEGIC GAPS & ANGLES
export interface Step4StrategicGaps {
  gaps: Array<{
    gap: string;
    reason: string;
  }>;
  angles: Array<{
    name: string;
    description: string;
    emotionalPull: string;
  }>;
  selectionNotice?: string;
}

export interface CoreAngleSelection {
  angleIndex: number;
  angleName: string;
  angleDescription: string;
  reasoning?: string;
  realWorldExample?: string;
  emotionalRelevance?: string;
  challengeResponse?: string;
  confirmation: string;
}

// STEP 5: HUMAN INPUT REQUEST
export interface Step5HumanInput {
  requestedInputs: Array<{
    id: string;
    label: string;
    prompt: string;
    whyNeeded?: string;
    response: string;
    required?: boolean;
  }>;
  // Backward-compatible fields for older saved sessions
  story1?: string;
  story2?: string;
  emotionalMoment?: string;
  metaphorSource?: string;
  angleDeepDiveAnswers: Array<{
    question: string;
    answer: string;
  }>;
}

// STEP 5A: HUMAN INPUT GUIDANCE (generated from prior analysis)
export interface Step5InputGuidance {
  rationale: string;
  missingSignals: string[];
  deepDiveQuestions: string[];
  requestedInputs: Array<{
    id: string;
    label: string;
    prompt: string;
    whyNeeded?: string;
    required?: boolean;
  }>;
  minimumRequired?: number;
}

// STEP 6: INPUT VALIDATION
export interface Step6InputValidation {
  isValid: boolean;
  feedback: string;
  approved: boolean;
  povLockedLines?: string[];
}

// STEP 7: STRUCTURE BLUEPRINT
export interface Step7StructureBlueprint {
  hookDirection: string;
  sections: Array<{
    title: string;
    purpose: string;
    contentSource: string;
  }>;
  emotionalSpikes: Array<{
    location: string;
    trigger: string;
  }>;
  dataSuggestions?: {
    needed: boolean;
    queries: string[];
    note: string;
  };
}

// STEP 8: SCRIPT PERMISSION GATE
export interface Step8ScriptPermissionGate {
  askForPermission: boolean;
  userApproved?: boolean;
}

// STEP 9: SCRIPT GENERATION
export interface Step9ScriptGeneration {
  hook: string;
  fullScript: string;
  scriptWithHumanSlots?: string;
  naturalFlow: string;
  embeddedEmotion: string;
  humanInsertions?: Array<{
    slotId: string;
    location: string;
    purpose: string;
    whatToAdd: string;
    whyNow: string;
    exampleStarter: string;
    consistencyNote: string;
  }>;
}

export interface Step10HumanizationInput {
  slotEdits: Array<{
    slotId: string;
    userText: string;
  }>;
  finalNotes?: string;
}

// STEP 10: DISTORTION REMINDER
export interface Step10DistortionReminder {
  tips: Array<{
    technique: string;
    description: string;
  }>;
  exampleEdit: string;
  finalScript: string;
  slotResolution: Array<{
    slotId: string;
    usedText: string;
    integratedWhere: string;
  }>;
  consistencyCheck: {
    coreAngle: string;
    driftDetected: boolean;
    fixApplied: string;
  };
}

// PILOT SESSION — Main state container
export interface PilotSession {
  id: string;
  createdAt: string;
  currentStep: number;
  inputContract: {
    platform: string;
    niche: string;
    creatorVoice: string;
    targetViewer: string;
  };
  step1?: Step1DataIntake;
  step2?: Step2LogicAnalysis;
  step3?: Step3POVGate;
  step4?: Step4StrategicGaps;
  coreAngle?: CoreAngleSelection;
  step5Guidance?: Step5InputGuidance;
  step5?: Step5HumanInput;
  step6?: Step6InputValidation;
  step7?: Step7StructureBlueprint;
  step8?: Step8ScriptPermissionGate;
  step9?: Step9ScriptGeneration;
  step10?: Step10DistortionReminder;
  finalScript?: string;
}
