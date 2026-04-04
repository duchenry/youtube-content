/**
 * Định nghĩa kiểu dữ liệu cho toàn bộ pipeline 3 bước
 * - AnalysisResult: Bước 1 — trích xuất cấu trúc video đối thủ
 * - ResearchDirective: Bước 2 — hướng dẫn tìm kiếm trên Reddit
 * - StrategicSynthesis: Bước 3 — chiến lược hành động cuối cùng
 */

// ── Bước 1: TRÍCH XUẤT — những gì có trong video ──

export type Confidence = "high" | "medium" | "low";

export interface AnalysisResult {
  hook: {
    raw: string;
    type: string;
    mechanism: string;
    confidence: Confidence;
  };
  hookQuality: {
    strength: string; // "strong � reason" embedded
    risk: string;
  };
  angle: {
    claim: string;
    supportingLogic: string;
    hiddenAssumption: string;
    confidence: Confidence;
  };
  coreTruth: {
    insight: string;
    triggerMoment: string;
    confidence: Confidence;
  };
  attention: {
    patternBreak: string;
    escalation: string[];
    retentionDriver: {
      description: string;
      confidence: Confidence;
    };
  };
  proofMechanics: {
    evidenceUsed: string[];
    transferablePattern: {
      pattern: string;
      confidence: Confidence;
    };
  };
  structureDNA: {
    phases: Array<{
      phase: string;
      goal: string;
      tactic: string;
      source: string;
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
      realScenario: string;
    }>;
    commentPatterns: {
      dominantSentiment: string;
      repeatedPain: string;
      emotionalTriggers: Array<{
        quote: string;
        emotion: string;
        insight: string;
      }>;
      languageFingerprint: string[];
      unspokenNeed: string;
      misunderstanding: string;
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
  inputComments?: string[];
}

// ── Bước 2: HƯỚNG DẪN NGHIÊN CỨU — tìm gì trên Reddit ──

export interface ResearchDirective {
  searchDirectives: Array<{
    query: string;
    subreddits: string[];
    purpose: string;
    targetField: string;
    viewerAngle: string;
  }>;
  deepDig: Array<{
    category: string;
    query: string;
    subreddits: string[];
    whatToFind: string;
    exampleLanguage: string[];
    signalStrength: string;
  }>;
  lookFor: Array<{
    pattern: string;
    why: string;
    emotionalLayer: string;
  }>;
}

// ── Bước 3: TỔNG HỢP CHIẾN LƯỢC — làm gì khác biệt ──

export interface StrategicSynthesis {
  viewerPsychology: {
    egoThreat: string;
    identityShift: string;
    shameTrigger: string;
  };
  painArchitecture: {
    rawPain: { surface: string; real: string; redditEvidence: string };
    resentment: { target: string; expression: string; redditEvidence: string };
    falseBeliefCollapse: { belief: string; crackMoment: string; redditEvidence: string };
    specificConstraint: { constraint: string; whyItMatters: string; redditEvidence: string };
    internalConflict: { know: string; cant: string; redditEvidence: string };
    identityThreat: { admission: string; avoidance: string; redditEvidence: string };
  };
  platformTranslation: Array<{
    redditInsight: string;
    emotion: string;
    youtubeLanguage: string;
    intensity: string;
  }>;
  differentiation: {
    competitorVoice: string;
    blindSpot: string;
    unownedAngle: string;
    voiceOpportunity: string;
  };
  hookStrategy: {
    type: string;
    targetEmotion: string;
    falseBeliefHook: string;
  };
  contentBriefSeed: {
    contentAngle: string;
    emotionalArc: string;
    keyDifferentiator: string;
    avoidList: string[];
  };
  qualityGate: {
    painDepth: string;
    resentmentFound: string;
    beliefIdentified: string;
    constraintSpecific: string;
    conflictPresent: string;
    hookStrength: string;
    novelty: string;
    rawVoiceSample: string;
  };
}
