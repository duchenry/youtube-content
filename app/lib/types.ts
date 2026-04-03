export interface AnalysisResult {
  hook: {
    raw: string;
    type: string;
    mechanism: string;
    confidence: "high" | "medium" | "low";
  };
  hookQuality: {
    strength: "weak" | "medium" | "strong";
    why: string;
    risk: string;
  };
  angle: {
    claim: string;
    supportingLogic: string;
    hiddenAssumption: string;
    confidence: "high" | "medium" | "low";
  };
  coreTruth: {
    insight: string;
    triggerMoment: string;
    confidence: "high" | "medium" | "low";
  };
  attention: {
    patternBreak: string;
    escalation: string[];
    retentionDriver: {
      description: string;
      confidence: "high" | "medium" | "low";
    };
  };
  proofMechanics: {
    evidenceUsed: string[];
    transferablePattern: {
      pattern: string;
      confidence: "high" | "medium" | "low";
    };
  };
  structureDNA: {
    phases: Array<{
      phase: string;
      goal: string;
      tactic: string;
      source: "OBSERVED" | "INFERRED" | string;
    }>;
    retentionMoments: Array<{
      moment: string;
      whyItWorks: string;
      pattern: string;
      isPrimary: boolean;
    }>;
  };
  audience: {
    profile: string;
    painMap: Array<{
      pain: string;
      feeling: string;
      realScenario: string;
    }>;
    commentPatterns: {
      repeatedPain: string;
      languageUsed: string[];
      misunderstanding: string;
    };
  };
  weakPoints: {
    whereItLosesAttention: string;
    why: string;
  };
  priority: {
    primaryDriver: string;
    secondaryDriver: string;
    why: string;
  };
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
