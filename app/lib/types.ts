/**
 * Định nghĩa kiểu dữ liệu cho toàn bộ pipeline 3 bước
 * - AnalysisResult: Bước 1 — trích xuất cấu trúc video đối thủ
 * - ResearchDirective: Bước 2 — hướng dẫn tìm kiếm trên Reddit
 * - StrategicSynthesis: Bước 3 — chiến lược hành động cuối cùng
 * 
 * ✅ CẬP NHẬT 17/4/2026 — KHỚP 100% CẤU TRÚC DATA THẬT
 */

// ── Bước 1: TRÍCH XUẤT — những gì có trong video ──

export type Confidence = "high" | "medium" | "low";

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

// ── Bước 2: HƯỚNG DẪN NGHIÊN CỨU — tìm gì trên Reddit ──
// Format này khớp với output từ RESEARCH_PROMPT

export interface ResearchDirective {
  primaryContradiction: {
    type: "know_vs_do" | "belief_collapse" | "identity_pressure" | "no_win_loop";
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

  confidence: "high" | "medium" | "low";
}

// Legacy interface (for backward compatibility if needed)
export interface ResearchDirectiveLegacy {
  "status": "FINAL" | "DRAFT_ONLY";
  "viewerProfileQuality": "STRONG" | "WEAK";
  "missingProfileFields": string[];
  "creatorStanceActive": boolean;
  "confidenceNotes": string;
  
  "creatorInterrogation": Array<{
    source: "weakPoint" | "contestedClaim" | "commentGap";
    triggerEvidence: string;
    gapType: "unaddressed_villain" | "contested_fact" | "deeper_pain" | "missed_contradiction";
    whyThisOpens: string;
    questionForCreator: string;
  }>;

  primaryContradiction: {
    type: "know_vs_do" | "belief_collapse" | "identity_pressure" | "forced_tradeoff" | "no_win_loop";
    description: string;
    whyThisMatters: string;
    "groundingTrace": {
      "mappedTo": string;
      "exactReference": string;
    };
  };

  contradictionSearch: Array<{
    type: "know_vs_do" | "belief_collapse" | "identity_pressure" | "failed_outcome" | "no_win_loop";
    targetAssumption: string;
    direction: string;
    query: string;
    subreddits: string[];
    whatToFind: string;
    successSignal: string;
    severity: "low" | "medium" | "high";
    "severityReason": string;
    whyItBreaksTheVideo: string;
    counterAngleValue: string;
    "groundingTrace": {
      "mappedTo": string;
      "exactReference": string;
    };
  }>;

  behaviorPatterns: Array<{
    pattern: string;
    exampleLanguage: string[];
    actionLoop: string;
    cost: string;
    emotionalDriver: "fear" | "shame" | "ego" | "comparison" | "avoidance";
    hiddenTruth: string;
    groundingTrace: {
      mappedTo: string;
      exactReference: string;
    };
  }>;

  identityPressure: Array<{
    identity: string;
    pressure: string;
    exampleLanguage: string[];
    fearIfNotAct: string;
    whyIrrational: string;
    groundingTrace: {
      mappedTo: string;
      exactReference: string;
    };
  }>;

  failureStories: Array<{
    query: string;
    subreddits: string[];
    whatToFind: string;
    signal: string;
    competitorClaimTargeted: string;
    groundingTrace: {
      mappedTo: string;
      exactReference: string;
    };
  }>;

  noWinLoops: Array<{
    situation: string;
    optionA: {
      action: string;
      costType: "financial" | "social" | "identity" | "time";
      immediateFeel: string;
      longTermCost: string;
    };
    optionB: {
      action: string;
      costType: "financial" | "social" | "identity" | "time";
      immediateFeel: string;
      longTermCost: string;
    };
    asymmetry: string;
    exampleLanguage: string[];
    whyPowerful: string;
    groundingTrace: {
      mappedTo: string;
      exactReference: string;
    };
  }>;
}

// ── Bước 3: MINI-SYNTHESIS — ưu tiên và xếp hạng ──
export interface CreatorAnswer {
  questionId: number;
  question: string;
  answer: string;
}

export interface MiniSynthesis {
  status: "FINAL" | "DRAFT_ONLY";

  priorityRanking: {
    topContradictionIndex: number;
    topBehaviorPatternIndex: number;
    topNoWinLoopIndex: number;
    reason: string;
  };

  tensionPoints: Array<{
    sourceLayer: "extraction" | "research" | "creator";
    reference: string;
    tensionType: "internal_conflict" | "contradiction" | "hidden_assumption";
    intensity: 1 | 2 | 3 | 4 | 5;
    placement: "hook" | "mid_video" | "close" | "proof";
  }>;

  alignmentReport: {
    creatorStanceApplied: boolean;
    adjustedEntries: number[];
    removedEntries: number[];
    overrideReason: string;
  };

  // ✅ FIX: rõ ràng hơn usage layer
  usageSignal: "hook" | "retention" | "payoff";
}

// ── Bước 4: TỔNG HỢP CHIẾN LƯỢC — làm gì khác biệt ──

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

  // ✅ MOVED HERE (logic hợp lý hơn MiniSynthesis)
  ranking: {
    top1: string;
    top2: string;
    top3: string;
    reason: string;
  };

  confidenceNotes: string;
}

// ── Bước 4: TẠO SCRIPT VIDEO (Script Writing) ──

export interface GeneratedScript {
  "status": "FINAL" | "DRAFT_ONLY";
  "fullScript": string;

  "sections": {
    "hook": { text: string; wordCount: number };
    "setup": { text: string; wordCount: number };
    "contradiction": { text: string; wordCount: number };
    "reframe": { text: string; wordCount: number };
    "solution": { text: string; wordCount: number };
    "close": { text: string; wordCount: number };
  };
}