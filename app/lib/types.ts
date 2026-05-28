/**
 * ─────────────────────────────────────────
 * CORE PIPELINE TYPES (FINAL CLEAN VERSION)
 * ─────────────────────────────────────────
 */

/* ─────────────────────────────
   SHARED BASIC TYPES
───────────────────────────── */

export type Confidence = "high" | "medium" | "low";

export type SectionKey =
  | "hook"
  | "crack"
  | "expose"
  | "validate"
  | "framework"
  | "close";

export const SECTION_KEYS: SectionKey[] = [
  "hook",
  "crack",
  "expose",
  "validate",
  "framework",
  "close",
];

/* ─────────────────────────────
   STEP 1 - ANALYSIS
───────────────────────────── */

export interface AnalysisResult {
  hook: {
    raw: string;
    type: "curiosity" | "fear" | "story" | "identity" | "authority";
    mechanism: string;
    confidence: Confidence;
  };

  angle: {
    claim: string;
    hiddenAssumption: string;
    confidence: Confidence;
  };

  coreTruth: {
    insight: string;
    triggerMoment: string;
    confidence: Confidence;
  };

  attention: {
    retentionDriver: {
      description: string;
      confidence: Confidence;
    };
  };

  competitorPosition: {
    stanceInStory:
      | "before_problem"
      | "explain_mechanism"
      | "inside_feeling"
      | "after_advice";
    voiceType:
      | "authority"
      | "validator"
      | "investigator"
      | "contrarian";
  };

  audience: {
    profile: string;
    painMap: Array<{
      pain: string;
      realScenario: string;
    }>;
    emotionalRegister: {
      dominant:
        | "anger"
        | "shame"
        | "resignation"
        | "confusion"
        | "hope";
      evidence: string;
    };
    commentInsight: {
      repeatedPain: string;
      emotionalExample: string;
      unspokenNeed: string;
    };
  };

  weakPoints: {
    whereItLosesAttention: string;
    why: string;
  };

  priority: {
    primaryDriver: string;
    why: string;
  };

  viewerProfile: {
    ageRange: string;
    incomeOrSituation: string;
    coreBelief: string;
    recentPainTrigger: string;
    whatTheyAlreadyTried: string;
    aspirationalAnchor: string;
  };

  inputComments: string[];
}

/* ─────────────────────────────
   STEP 2 - RESEARCH
───────────────────────────── */

export interface ResearchDirective {
  primaryContradiction: {
    type:
      | "know_vs_do"
      | "belief_collapse"
      | "identity_pressure"
      | "forced_tradeoff"
      | "no_win_loop";

    description: string;
    searchInstinct: string;
    whyItMatters: string;
  };

  searchInstincts: string[];
  painSignals: string[];

  ranking: {
    top1: string;
    top2: string;
    top3: string;
    reason: string;
  };

  confidence: Confidence;
}

/* ─────────────────────────────
   STEP 3 - SYNTHESIS
───────────────────────────── */

export interface ScriptBridgeOption {
  action: string;
  cost: string;
}

export interface ScriptBridge {
  optionA: ScriptBridgeOption;
  optionB: ScriptBridgeOption;
  noWinAsymmetry: string;
  unspokenNeed: string;
  constraint: string;
  coreTruth: string;
}

export interface StrategicSynthesis {
  focusPriority: {
    primary: "contradiction" | "behavior" | "identity" | "no_win";
    reason: string;
  };

  coreEngine: {
    contradiction: string;
    behaviorLoop: string;
    identityPressure: string;
    noWinLoop: string;
    villain: {
      entity: string;
      howItOperates: string;
    };
  };

  pain: {
    surface: string;
    real: string;
    scenario: string;
  };

  beliefShift: {
    from: string;
    breakMoment: string;
    to: string;
  };

  anchors: Array<{
    scenario: string;
    emotion: "fear" | "shame" | "ego" | "relief";
    use: "hook" | "mid" | "proof";
  }>;

  positioning: {
    competitorStance: string;
    yourStance: "before_problem" | "inside_feeling" | "after_advice";
    voicePreset: "investigative" | "conspiratorial" | "contrarian";
  };

  forwardTension: {
    openQuestion: string;
    aspirationalGlimpse: string;
    watchReason: string;
  };

  execution: {
    hook: string;
    mid: string;
    peak: string;
    end: string;
  };

  authorControl: {
    mode: "augment" | "replace" | "none";
    overridePoint: string;
  };

  ranking: {
    top1: string;
    top2: string;
    top3: string;
    reason: string;
  };

  scriptBridge: ScriptBridge;

  confidenceNotes: string;

  physicalDetail?: string[];
}

/* ─────────────────────────────
   STEP 4 - SCRIPT
───────────────────────────── */

export interface ScriptSection {
  text: string;
  wordCount: number;
}

export interface GeneratedScript {
  id: string;
  status: "DRAFT" | "PROCESSING" | "FINAL";
  context?: any;

  sections: Record<SectionKey, ScriptSection>;

  fullScript?: string;
}

/* ─────────────────────────────
   EVALUATION SYSTEM
───────────────────────────── */

export type ImpactLevel = "low" | "medium" | "high";

export type EvaluationEditType = "line_edit" | "structure_edit";

export type StructuralAction = "move" | "cut";

export type StructuralPlacement = {
  move: "before" | "after";
  anchorQuote: string;
  reason: string;
  bridgeSuggestion?: string;
};

/**
 * Deprecated in the new 2-API pipeline.
 * Kept only to avoid breaking older imports/routes.
 */
export type RewriteHint = {
  rhythm: "short" | "broken" | "trailing" | "heavy";
  action: string;
  omission: string;
  anchor: string;
};

export type RewriteOption = {
  type: string;
  text: string;
  score: number;
  reason: string;
};

export type EvaluationEdit = {
  /**
   * line_edit:
   * - can receive rewriteOptions from API 2
   *
   * structure_edit:
   * - action "move" should include placement
   * - action "cut" should NOT include placement
   * - should NOT receive rewriteOptions
   */
  type?: EvaluationEditType;

  /**
   * Only for structure_edit.
   * move = block belongs in CURRENT but is in the wrong position.
   * cut = block belongs to NEXT or should be removed from CURRENT.
   */
  action?: StructuralAction;

  quote: string;
  issue: string;
  impactLevel: ImpactLevel;
  suggestion: string;

  /**
   * Only for structure_edit with action "move".
   */
  placement?: StructuralPlacement;

  /**
   * Only for line_edit after API 2 enrichment.
   */
  rewriteOptions?: RewriteOption[];

  /**
   * Deprecated.
   * Do not rely on this in UI.
   */
  rewriteHint?: RewriteHint;
};

export type SectionEvaluation = {
  verdict?: string;
  mainProblem?: string;
  highestROIEdit?: string;
  edits: EvaluationEdit[];
};

export type EvaluationMap = Partial<Record<SectionKey, SectionEvaluation>>;

/* ─────────────────────────────
   API TYPES
───────────────────────────── */

export type EvaluateSectionRequest = {
  section: SectionKey;
  text: string;
  previous: string;
  next: string;
  context?: any;
  scriptEvaluation?: ScriptEvaluateResult | null;
};

export type EvaluateSectionResponse = {
  result: {
    verdict?: string;
    mainProblem?: string;
    highestROIEdit?: string;
    edits: EvaluationEdit[];
  };
};

export type GenerateRewriteOptionsRequest = {
  section: SectionKey;
  text: string;
  previous: string;
  edits: Array<{
    type?: "line_edit";
    quote: string;
    issue: string;
    impactLevel: ImpactLevel;
    suggestion: string;
  }>;
};

export type GenerateRewriteOptionsResponse = {
  result: {
    edits: EvaluationEdit[];
  };
};

/**
 * Deprecated legacy rewrite endpoint types.
 * Kept to avoid breaking older files if still imported.
 */
export type RewriteFragmentRequest = {
  fullSection: string;
  targetQuote: string;
  issue: string;
  impactLevel: ImpactLevel;
  suggestion: string;
  rewriteHint?: RewriteHint;
  context?: any;
};

export type RewriteFragmentResponse = {
  result: string;
};

/* ─────────────────────────────
   SUPABASE MODEL
───────────────────────────── */

export type AnalysisDBRow = {
  id: string;

  script: string;
  comments: string;

  result: AnalysisResult;

  research: ResearchDirective | null;
  synthesis: StrategicSynthesis | null;
  generated_script: GeneratedScript | null;

  evaluations: EvaluationMap | null;

  reddit_raw?: string;

  created_at: string;
};

export interface ScriptEvaluateResult {
  motifFlags: MotifFlag[];
  tensionCurve: TensionCurveFlag[];
  anchorOveruse: AnchorFlag[];
  conclusiveEndings: ConclusiveEndingFlag[];
  sectionContractFlags: SectionContractFlag[];
  summary: {
    passCount: number;
    flagCount: number;
    critical: boolean;
  };
}

export interface MotifFlag {
  motif: string;
  count: number;
  appearances: {
    section: SectionKey;
    quote: string;
  }[];
  verdict: "overused";
  advice?: string;
}

export interface TensionCurveFlag {
  section: SectionKey;
  expectedLevel: number;
  issue: string | null;
  advice?: string;
}

export interface AnchorFlag {
  detail: string;
  sections: SectionKey[];
  verdict: "overused";
  advice?: string;
}

export interface ConclusiveEndingFlag {
  section: SectionKey;
  quote: string;
  issue: string;
  advice?: string;
}

export interface SectionContractFlag {
  section: SectionKey;
  quote: string;
  issue: string;
  advice?: string;
}