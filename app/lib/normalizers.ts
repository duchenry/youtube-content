/**
 * Chuẩn hóa data AI trả về → đúng kiểu TypeScript
 * Mỗi API route import từ đây → không trùng lặp code
 * - normalizeExtraction: Bước 1 (phân tích video)
 * - normalizeResearch: Bước 2 (hướng dẫn nghiên cứu Reddit)
 * - normalizeSynthesis: Bước 3 (tổng hợp chiến lược)
 */
import type { AnalysisResult, ResearchDirective, StrategicSynthesis, GeneratedScript } from "./types";
import { asRecord, asString, asStringArray, asConfidence, type JsonRecord } from "./openai";

const INSUFFICIENT = "Insufficient data — need more comments";

// ── Step 1: Extraction ──────────────────────────────────────

export function normalizeExtraction(raw: JsonRecord, comments: string[]): AnalysisResult {
  const hook = asRecord(raw.hook);
  const hookQuality = asRecord(raw.hookQuality);
  const angle = asRecord(raw.angle);
  const ct = asRecord(raw.coreTruth);
  const att = asRecord(raw.attention);
  const rd = asRecord(att.retentionDriver);
  const pm = asRecord(raw.proofMechanics);
  const tp = asRecord(pm.transferablePattern);
  const sd = asRecord(raw.structureDNA);
  const aud = asRecord(raw.audience);
  const cp = asRecord(aud.commentPatterns);
    const wp = asRecord(raw.weakPoints);
    const pri = asRecord(raw.priority);
    const vp = asRecord(raw.viewerProfile);
 
  const tooFew = comments.length < 5; // ← dùng comments.length thay vì commentCount
 
  return {
    hook: {
      raw: asString(hook.raw),
      type: asString(hook.type) as "Curiosity" | "Pain" | "Question" | "Story",
      mechanism: asString(hook.mechanism),
      confidence: asConfidence(hook.confidence),
    },
    hookQuality: {
      strength: asString(hookQuality.strength),
      risk: asString(hookQuality.risk),
    },
    angle: {
      claim: asString(angle.claim),
      supportingLogic: asStringArray(angle.supportingLogic),
      hiddenAssumption: asString(angle.hiddenAssumption),
      confidence: asConfidence(angle.confidence),
    },
    coreTruth: {
      insight: asString(ct.insight),
      triggerMoment: asString(ct.triggerMoment),
      confidence: asConfidence(ct.confidence),
    },
    attention: {
      patternBreak: asString(att.patternBreak),
      escalation: asStringArray(att.escalation),
      retentionDriver: { description: asString(rd.description), confidence: asConfidence(rd.confidence) },
    },
    proofMechanics: {
      evidenceUsed: asStringArray(pm.evidenceUsed),
      transferablePattern: { pattern: asString(tp.pattern), confidence: asConfidence(tp.confidence) },
    },
    structureDNA: {
      phases: (Array.isArray(sd.phases) ? sd.phases : []).map((item) => {
        const p = asRecord(item);
        return { phase: asString(p.phase) as "Hook" | "Build" | "Pivot" | "Close", goal: asString(p.goal), tactic: asString(p.tactic), source: asString(p.source) || "INFERRED" };
      }),
      retentionMoments: (Array.isArray(sd.retentionMoments) ? sd.retentionMoments : []).map((item) => {
        const m = asRecord(item);
        return { moment: asString(m.moment), whyItWorks: asString(m.whyItWorks), pattern: asString(m.pattern), isPrimary: Boolean(m.isPrimary) };
      }),
    },
    audience: {
      profile: asString(aud.profile),
      painMap: (Array.isArray(aud.painMap) ? aud.painMap : []).map((item) => {
        const p = asRecord(item);
        return { pain: asString(p.pain), realScenario: asString(p.realScenario) };
      }),
      commentPatterns: {
        dominantSentiment: tooFew ? INSUFFICIENT : asString(cp.dominantSentiment),
        repeatedPain: tooFew ? INSUFFICIENT : asString(cp.repeatedPain),
        emotionalTriggers: tooFew ? [] : (Array.isArray(cp.emotionalTriggers) ? cp.emotionalTriggers : []).slice(0, 3).map((item) => {
          const t = asRecord(item);
          return { quote: asString(t.quote), emotion: asString(t.emotion), insight: asString(t.insight) };
        }),
        languageFingerprint: tooFew ? [] : asStringArray(cp.languageFingerprint),
        unspokenNeed: tooFew ? INSUFFICIENT : asString(cp.unspokenNeed),
        misunderstanding: tooFew ? INSUFFICIENT : asString(cp.misunderstanding),
      },
    },
    weakPoints: { whereItLosesAttention: asString(wp.whereItLosesAttention), why: asString(wp.why) },
    priority: { primaryDriver: asString(pri.primaryDriver), why: asString(pri.why) },
    viewerProfile: {
      ageRange: asString(vp.ageRange),
      incomeOrSituation: asString(vp.incomeOrSituation),
      coreBelief: asString(vp.coreBelief),
      recentPainTrigger: asString(vp.recentPainTrigger),
    },
    inputComments: comments, // ← thêm field này để thoả mãn AnalysisResult type
  };
}

// ── Step 4: Script Generation ──────────────────────────────

export function normalizeScript(raw: JsonRecord): GeneratedScript {
  const sections = raw.sections as any;

  return {
    status: asString(raw.status) as "FINAL" | "DRAFT_ONLY",
    fullScript: asString(raw.fullScript),

    sections: {
      hook: { text: asString(sections?.hook?.text), wordCount: Number(sections?.hook?.wordCount) || 0 },
      setup: { text: asString(sections?.setup?.text), wordCount: Number(sections?.setup?.wordCount) || 0 },
      contradiction: { text: asString(sections?.contradiction?.text), wordCount: Number(sections?.contradiction?.wordCount) || 0 },
      reframe: { text: asString(sections?.reframe?.text), wordCount: Number(sections?.reframe?.wordCount) || 0 },
      solution: { text: asString(sections?.solution?.text), wordCount: Number(sections?.solution?.wordCount) || 0 },
      close: { text: asString(sections?.close?.text), wordCount: Number(sections?.close?.wordCount) || 0 },
    }
  };
}

// ── Step 2: Research Directive ──────────────────────────────

export function normalizeResearch(raw: JsonRecord): ResearchDirective {
  const pc = asRecord(raw.primaryContradiction);
  return {
    status: asString(raw.status) as "FINAL" | "DRAFT_ONLY",
    viewerProfileQuality: asString(raw.viewerProfileQuality) as "STRONG" | "WEAK",
    missingProfileFields: asStringArray(raw.missingProfileFields),
    creatorStanceActive: Boolean(raw.creatorStanceActive),
    confidenceNotes: asString(raw.confidenceNotes),
    
    creatorInterrogation: (Array.isArray(raw.creatorInterrogation) ? raw.creatorInterrogation : []).map((item) => {
      const ci = asRecord(item);
      return {
        source: asString(ci.source) as "weakPoint" | "contestedClaim" | "commentGap",
        triggerEvidence: asString(ci.triggerEvidence),
        gapType: asString(ci.gapType) as "unaddressed_villain" | "contested_fact" | "deeper_pain" | "missed_contradiction",
        whyThisOpens: asString(ci.whyThisOpens),
        questionForCreator: asString(ci.questionForCreator),
      };
    }),

    primaryContradiction: {
      type: asString(pc.type) as "know_vs_do" | "belief_collapse" | "identity_pressure" | "forced_tradeoff" | "no_win_loop",
      description: asString(pc.description),
      whyThisMatters: asString(pc.whyThisMatters),
      groundingTrace: (() => {
        const gt = asRecord(pc.groundingTrace);
        return {
          mappedTo: asString(gt.mappedTo),
          exactReference: asString(gt.exactReference),
        };
      })()
    },
    contradictionSearch: (Array.isArray(raw.contradictionSearch) ? raw.contradictionSearch : []).slice(0, 6).map((item) => {
      const d = asRecord(item);
      return {
        type: asString(d.type) as "know_vs_do" | "belief_collapse" | "identity_pressure" | "failed_outcome" | "no_win_loop",
        targetAssumption: asString(d.targetAssumption),
        direction: asString(d.direction),
        query: asString(d.query),
        subreddits: asStringArray(d.subreddits),
        whatToFind: asString(d.whatToFind),
        successSignal: asString(d.successSignal),
        severity: asString(d.severity) as "low" | "medium" | "high",
        severityReason: asString(d.severityReason),
        whyItBreaksTheVideo: asString(d.whyItBreaksTheVideo),
        counterAngleValue: asString(d.counterAngleValue) || "NOT_APPLICABLE",
        groundingTrace: (() => {
          const gt = asRecord(d.groundingTrace);
          return {
            mappedTo: asString(gt.mappedTo),
            exactReference: asString(gt.exactReference),
          };
        })()
      };
    }),
    behaviorPatterns: (Array.isArray(raw.behaviorPatterns) ? raw.behaviorPatterns : []).slice(0, 5).map((item) => {
      const d = asRecord(item);
      return {
        pattern: asString(d.pattern),
        exampleLanguage: asStringArray(d.exampleLanguage),
        actionLoop: asString(d.actionLoop),
        cost: asString(d.cost),
        emotionalDriver: asString(d.emotionalDriver) as "fear" | "shame" | "ego" | "comparison" | "avoidance",
        hiddenTruth: asString(d.hiddenTruth),
        groundingTrace: (() => {
          const gt = asRecord(d.groundingTrace ?? {});
          return {
            mappedTo: asString(gt.mappedTo),
            exactReference: asString(gt.exactReference) || "NO_DIRECT_REFERENCE",
          };
        })()
      };
    }),
    identityPressure: (Array.isArray(raw.identityPressure) ? raw.identityPressure : []).slice(0, 4).map((item) => {
      const d = asRecord(item);
      return {
        identity: asString(d.identity),
        pressure: asString(d.pressure),
        exampleLanguage: asStringArray(d.exampleLanguage),
        fearIfNotAct: asString(d.fearIfNotAct),
        whyIrrational: asString(d.whyIrrational),
        groundingTrace: (() => {
          const gt = asRecord(d.groundingTrace ?? {});
          return {
            mappedTo: asString(gt.mappedTo),
            exactReference: asString(gt.exactReference) || "NO_DIRECT_REFERENCE",
          };
        })()
      };
    }),
    failureStories: (Array.isArray(raw.failureStories) ? raw.failureStories : []).slice(0, 4).map((item) => {
      const d = asRecord(item);
      return {
        query: asString(d.query),
        subreddits: asStringArray(d.subreddits),
        whatToFind: asString(d.whatToFind),
        signal: asString(d.signal),
        competitorClaimTargeted: asString(d.competitorClaimTargeted),
        groundingTrace: (() => {
          const gt = asRecord(d.groundingTrace ?? {});
          return {
            mappedTo: asString(gt.mappedTo),
            exactReference: asString(gt.exactReference) || "NO_DIRECT_REFERENCE",
          };
        })()
      };
    }),
    noWinLoops: (Array.isArray(raw.noWinLoops) ? raw.noWinLoops : []).slice(0, 3).map((item) => {
      const d = asRecord(item);
      const oa = asRecord(d.optionA);
      const ob = asRecord(d.optionB);
      const gt = asRecord(d.groundingTrace);
      return {
        situation: asString(d.situation),
        optionA: {
          action: asString(oa.action),
          costType: asString(oa.costType) as "financial" | "social" | "identity" | "time",
          immediateFeel: asString(oa.immediateFeel),
          longTermCost: asString(oa.longTermCost),
        },
        optionB: {
          action: asString(ob.action),
          costType: asString(ob.costType) as "financial" | "social" | "identity" | "time",
          immediateFeel: asString(ob.immediateFeel),
          longTermCost: asString(ob.longTermCost),
        },
        asymmetry: asString(d.asymmetry),
        exampleLanguage: asStringArray(d.exampleLanguage),
        whyPowerful: asString(d.whyPowerful),
        groundingTrace: {
          mappedTo: asString(gt.mappedTo),
          exactReference: asString(gt.exactReference),
        },
      };
    }),
  };
}

// ── Step 3: Strategic Synthesis ─────────────────────────────

export function normalizeSynthesis(raw: JsonRecord): StrategicSynthesis {
  const vp = asRecord(raw.viewerPsychology);
  const pa = asRecord(raw.painArchitecture);
  const rp = asRecord(pa.rawPain);
  const rs = asRecord(pa.resentment);
  const fb = asRecord(pa.falseBeliefCollapse);
  const sc = asRecord(pa.specificConstraint);
  const ic = asRecord(pa.internalConflict);
  const it = asRecord(pa.identityThreat);
  const diff = asRecord(raw.differentiation);
  const hs = asRecord(raw.hookStrategy);
  const cbs = asRecord(raw.contentBriefSeed);
  const qg = asRecord(raw.qualityGate);

  return {
    viewerPsychology: { egoThreat: asString(vp.egoThreat), identityShift: asString(vp.identityShift), shameTrigger: asString(vp.shameTrigger) },
    painArchitecture: {
      rawPain: { surface: asString(rp.surface), real: asString(rp.real), redditEvidence: asString(rp.redditEvidence) },
      resentment: { target: asString(rs.target), expression: asString(rs.expression), redditEvidence: asString(rs.redditEvidence) },
      falseBeliefCollapse: { belief: asString(fb.belief), crackMoment: asString(fb.crackMoment), redditEvidence: asString(fb.redditEvidence) },
      specificConstraint: { constraint: asString(sc.constraint), whyItMatters: asString(sc.whyItMatters), redditEvidence: asString(sc.redditEvidence) },
      internalConflict: { know: asString(ic.know), cant: asString(ic.cant), redditEvidence: asString(ic.redditEvidence) },
      identityThreat: { admission: asString(it.admission), avoidance: asString(it.avoidance), redditEvidence: asString(it.redditEvidence) },
    },
    platformTranslation: (Array.isArray(raw.platformTranslation) ? raw.platformTranslation : []).slice(0, 4).map((item) => {
      const t = asRecord(item);
      return { redditInsight: asString(t.redditInsight), emotion: asString(t.emotion), youtubeLanguage: asString(t.youtubeLanguage), intensity: asString(t.intensity) };
    }),
    differentiation: { competitorVoice: asString(diff.competitorVoice), blindSpot: asString(diff.blindSpot), unownedAngle: asString(diff.unownedAngle), voiceOpportunity: asString(diff.voiceOpportunity) },
    hookStrategy: { type: asString(hs.type), targetEmotion: asString(hs.targetEmotion), falseBeliefHook: asString(hs.falseBeliefHook) },
    contentBriefSeed: { contentAngle: asString(cbs.contentAngle), emotionalArc: asString(cbs.emotionalArc), keyDifferentiator: asString(cbs.keyDifferentiator), avoidList: asStringArray(cbs.avoidList) },
    qualityGate: { painDepth: asString(qg.painDepth), resentmentFound: asString(qg.resentmentFound), beliefIdentified: asString(qg.beliefIdentified), constraintSpecific: asString(qg.constraintSpecific), conflictPresent: asString(qg.conflictPresent), hookStrength: asString(qg.hookStrength), novelty: asString(qg.novelty), rawVoiceSample: asString(qg.rawVoiceSample), authorInputUsed: (asString(qg.authorInputUsed) as "YES" | "NO" | "NOT_PROVIDED") || "NOT_PROVIDED" },

    authorVoiceSeeds: (() => {
      const avs = asRecord(raw.authorVoiceSeeds ?? {});
      return {
        primaryMemory: asString(avs.primaryMemory),
        verifiedInsight: asString(avs.verifiedInsight),
        behaviorLoop: asString(avs.behaviorLoop),
      };
    })()
  };
}
