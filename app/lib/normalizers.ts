/**
 * Chuẩn hóa dữ liệu AI trả về → đúng kiểu TypeScript
 * Mỗi API route import từ đây → không trùng lặp code
 * - normalizeExtraction: Bước 1 (phân tích video)
 * - normalizeResearch: Bước 2 (hướng dẫn nghiên cứu Reddit)
 * - normalizeSynthesis: Bước 3 (tổng hợp chiến lược)
 */
import type { AnalysisResult, ResearchDirective, StrategicSynthesis } from "./types";
import { asRecord, asString, asStringArray, asConfidence, type JsonRecord } from "./openai";

const INSUFFICIENT = "Insufficient data — need more comments";

// ── Step 1: Extraction ──────────────────────────────────────

export function normalizeExtraction(raw: JsonRecord, commentCount: number): AnalysisResult {
  const hook = asRecord(raw.hook);
  const hq = asRecord(raw.hookQuality);
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

  const tooFew = commentCount < 5;

  return {
    hook: {
      raw: asString(hook.raw),
      type: asString(hook.type),
      mechanism: asString(hook.mechanism),
      confidence: asConfidence(hook.confidence),
    },
    hookQuality: {
      strength: asString(hq.strength),
      risk: asString(hq.risk),
    },
    angle: {
      claim: asString(angle.claim),
      supportingLogic: asString(angle.supportingLogic),
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
        return { phase: asString(p.phase), goal: asString(p.goal), tactic: asString(p.tactic), source: asString(p.source) || "INFERRED" };
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
  };
}

// ── Step 2: Research Directive ──────────────────────────────

export function normalizeResearch(raw: JsonRecord): ResearchDirective {
  return {
    searchDirectives: (Array.isArray(raw.searchDirectives) ? raw.searchDirectives : []).slice(0, 6).map((item) => {
      const d = asRecord(item);
      return { query: asString(d.query), subreddits: asStringArray(d.subreddits), purpose: asString(d.purpose), targetField: asString(d.targetField), viewerAngle: asString(d.viewerAngle) };
    }),
    deepDig: (Array.isArray(raw.deepDig) ? raw.deepDig : []).slice(0, 5).map((item) => {
      const d = asRecord(item);
      return { category: asString(d.category), query: asString(d.query), subreddits: asStringArray(d.subreddits), whatToFind: asString(d.whatToFind), exampleLanguage: asStringArray(d.exampleLanguage), signalStrength: asString(d.signalStrength) };
    }),
    lookFor: (Array.isArray(raw.lookFor) ? raw.lookFor : []).slice(0, 6).map((item) => {
      const l = asRecord(item);
      return { pattern: asString(l.pattern), why: asString(l.why), emotionalLayer: asString(l.emotionalLayer) };
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
    qualityGate: { painDepth: asString(qg.painDepth), resentmentFound: asString(qg.resentmentFound), beliefIdentified: asString(qg.beliefIdentified), constraintSpecific: asString(qg.constraintSpecific), conflictPresent: asString(qg.conflictPresent), hookStrength: asString(qg.hookStrength), novelty: asString(qg.novelty), rawVoiceSample: asString(qg.rawVoiceSample) },
  };
}
