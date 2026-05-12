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
  | "setup"
  | "contradiction"
  | "reframe"
  | "solution"
  | "close";

export const SECTION_KEYS: SectionKey[] = [
  "hook",
  "setup",
  "contradiction",
  "reframe",
  "solution",
  "close",
];

/* ─────────────────────────────
   STEP 1 - ANALYSIS
───────────────────────────── */

export interface AnalysisResult {
  hook: {
    raw: string;
    type: "Curiosity" | "Pain" | "Question" | "Story";
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

  audience: {
    profile: string;
    painMap: Array<{
      pain: string;
      realScenario: string;
    }>;
    commentInsight: {
      repeatedPain: string;
      emotionalExample: string;
      unspokenNeed: string;
    };
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
  };

  inputComments: string[];
}

/* ─────────────────────────────
   STEP 2 - RESEARCH (CLEAN ONLY)
───────────────────────────── */

export interface ResearchDirective {
  primaryContradiction: {
    type:
      | "know_vs_do"
      | "belief_collapse"
      | "identity_pressure"
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

export interface StrategicSynthesis {
  focusPriority: {
    primary:
      | "contradiction"
      | "behavior"
      | "identity"
      | "no_win";

    reason: string;
  };

  coreEngine: {
    contradiction: string;
    behaviorLoop: string;
    identityPressure: string;
    noWinLoop: string;
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
  physicalDetail: string[];

  confidenceNotes: string;
}

/* ─────────────────────────────
   STEP 4 - SCRIPT (CRITICAL FIX)
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
   EVALUATION SYSTEM (FIXED CORE)
───────────────────────────── */

export type ImpactLevel = "low" | "medium" | "high";

export type RewriteHint = {
  rhythm: "short" | "broken" | "trailing" | "heavy";
  action: string;
  omission: string;
};

export type EvaluationEdit = {
  quote: string;
  issue: string;
  impactLevel: ImpactLevel;
  suggestion: string;

  rewriteHint: RewriteHint;
};

/**
 * ✅ FIX CRITICAL:
 * - NOT array wrapper anymore
 * - DIRECT AI STRUCTURE MATCH
 */
export type SectionEvaluation = {
  edits: EvaluationEdit[];
};

/**
 * SAFE FOR SUPABASE JSONB
 */
export type EvaluationMap = Record<
  SectionKey,
  SectionEvaluation | null
>;

/* ─────────────────────────────
   API TYPES
───────────────────────────── */

export type EvaluateSectionRequest = {
  section: SectionKey;
  text: string;
  previous: string;
  next: string;
  context?: any;
};

export type EvaluateSectionResponse = {
  result: SectionEvaluation;
};

export type RewriteFragmentRequest = {
  /**
   * Full section for emotional continuity reference only.
   * AI must rewrite ONLY the targetQuote.
   */
  fullSection: string;

  /**
   * Exact fragment selected from evaluation.
   */
  targetQuote: string;

  /**
   * Evaluation output
   */
  issue: string;

  impactLevel: ImpactLevel;

  suggestion: string;

  rewriteHint: RewriteHint;

  /**
   * Optional generation context
   * (audience, synthesis, voice profile, etc.)
   */
  context?: any;
};

export type RewriteFragmentResponse = {
  result: string;
};

/* ─────────────────────────────
   SUPABASE MODEL (CRITICAL FIX)
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