export interface AnalysisResult {
  coreInsight: {
    summary: string;
  };
  coreAngle: {
    uniqueAngle: string;
    beliefChallenged: string;
    whyItWorks: string;
  };
  angleExpansion: Array<{
    name: string;
    explanation: string;
    emotionalTrigger: string;
  }>;
  keywordAnalysis: {
    repeatedKeywords: string[];
    emotionalWords: string[];
    powerWords: string[];
    simplePhrasing: string[];
    psychologicalExplanation: string;
  };
  hookBreakdown: {
    patternInterrupt: string;
    curiosityGap: string;
    emotionalTrigger: string;
    newHooks: string[];
  };
  structureDNA: {
    hook: string;
    setup: string;
    contrastStory: string;
    insightReveal: string;
    valueDelivery: string;
    actionConclusion: string;
  };
  audienceProfile: {
    idealViewer: string;
    ageRange: string;
    incomeLevel: string;
    lifeStage: string;
    situation: string;
  };
  painMap: Array<{
    pain: string;
    explanation: string;
    realLifeExample: string;
  }>;
  commentMining: Array<{
    theme: string;
    examplePhrases: string[];
    psychologicalMeaning: string;
  }>;
  desireMap: {
    whatTheyWant: string;
    emotionalStateChasing: string;
  };
  contentOpportunities: Array<{
    title: string;
    targetPain: string;
    desiredOutcome: string;
    uniqueAngle: string;
    hook: string;
  }>;
  differentiationStrategy: {
    tone: string;
    structure: string;
    storytelling: string;
    perspective: string;
  };
  viralRiskAnalysis: {
    massProducedRisk: string;
    inauthenticSignals: string;
    howToFix: string;
  };
  contentGapAnalysis: {
    missingElements: string;
    unansweredQuestions: string;
    underexploredAngles: string;
    gapBasedVideoIdeas: Array<{ title: string; gap: string }>;
  };
  formatVariations: Array<{
    format: string;
    description: string;
    viewerExperience: string;
  }>;
  scriptStarters: {
    openings: Array<{ tone: string; text: string }>;
    closings: string[];
  };
}
