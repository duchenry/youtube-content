/**
 * Chuẩn hóa data AI trả về → đúng kiểu TypeScript
 */

import type {
  AnalysisResult,
  ResearchDirective,
  StrategicSynthesis,
  GeneratedScript,
} from "./types";

import {
  asRecord,
  asString,
  asConfidence,
  type JsonRecord,
} from "./openai";

// ─────────────────────────────────────────────
// SAFE UNWRAP ROOT (FIX RỖNG DATA)
// ─────────────────────────────────────────────

function unwrap(raw: JsonRecord) {
  const r = asRecord(raw);

  return asRecord(
    r.result ??
    r.data ??
    r.output ??
    r.analysis ??
    raw
  );
}

const INSUFFICIENT = "Insufficient data — need more comments";

// ─────────────────────────────────────────────
// STEP 1: EXTRACT
// Schema ref: EXTRACTION_PROMPT
// ─────────────────────────────────────────────

export function normalizeExtraction(
  raw: JsonRecord,
  comments: string[]
): AnalysisResult {
  const source = unwrap(raw);

  const hook = asRecord(source.hook);
  const angle = asRecord(source.angle);
  const ct = asRecord(source.coreTruth);
  const att = asRecord(source.attention);
  const rd = asRecord(att.retentionDriver);
  const aud = asRecord(source.audience);
  const ci = asRecord(aud.commentInsight);
  const er = asRecord(aud.emotionalRegister);
  const pri = asRecord(source.priority);
  const vp = asRecord(source.viewerProfile);
  const cp = asRecord(source.competitorPosition);
  const wp = asRecord(source.weakPoints);

  const tooFew = (comments?.length || 0) < 5;

  return {
    hook: {
      raw: asString(hook.raw),
      type: asString(hook.type) as any,
      mechanism: asString(hook.mechanism),
      confidence: asConfidence(hook.confidence),
    },

    angle: {
      claim: asString(angle.claim),
      hiddenAssumption: asString(angle.hiddenAssumption),
      confidence: asConfidence(angle.confidence),
    },

    coreTruth: {
      insight: asString(ct.insight),
      triggerMoment: asString(ct.triggerMoment),
      confidence: asConfidence(ct.confidence),
    },

    attention: {
      retentionDriver: {
        description: asString(rd.description),
        confidence: asConfidence(rd.confidence),
      },
    },

    // NEW: competitorPosition (EXTRACTION_PROMPT schema)
    competitorPosition: {
      stanceInStory: asString(cp.stanceInStory) as any,
      voiceType: asString(cp.voiceType) as any,
    },

    audience: {
      profile: asString(aud.profile),

      painMap: Array.isArray(aud.painMap)
        ? aud.painMap.map((i) => {
            const p = asRecord(i);
            return {
              pain: asString(p.pain),
              realScenario: asString(p.realScenario),
            };
          })
        : [],

      // NEW: emotionalRegister (EXTRACTION_PROMPT schema)
      emotionalRegister: {
        dominant: asString(er.dominant) as any,
        evidence: asString(er.evidence),
      },

      commentInsight: {
        repeatedPain: tooFew ? INSUFFICIENT : asString(ci.repeatedPain),
        emotionalExample: tooFew ? INSUFFICIENT : asString(ci.emotionalExample),
        unspokenNeed: tooFew ? INSUFFICIENT : asString(ci.unspokenNeed),
      },
    },

    // NEW: weakPoints (EXTRACTION_PROMPT schema)
    weakPoints: {
      whereItLosesAttention: asString(wp.whereItLosesAttention),
      why: asString(wp.why),
    },

    priority: {
      primaryDriver: asString(pri.primaryDriver),
      why: asString(pri.why),
    },

    viewerProfile: {
      ageRange: asString(vp.ageRange),
      incomeOrSituation: asString(vp.incomeOrSituation),
      coreBelief: asString(vp.coreBelief),
      recentPainTrigger: asString(vp.recentPainTrigger),
      // NEW: whatTheyAlreadyTried + aspirationalAnchor (EXTRACTION_PROMPT schema)
      whatTheyAlreadyTried: asString(vp.whatTheyAlreadyTried),
      aspirationalAnchor: asString(vp.aspirationalAnchor),
    },

    inputComments: comments || [],
  };
}

// ─────────────────────────────────────────────
// STEP 2: RESEARCH
// Schema ref: RESEARCH_PROMPT
// ─────────────────────────────────────────────

export function normalizeResearch(raw: JsonRecord): ResearchDirective {
  const r = asRecord(raw);
  const pc = asRecord(r.primaryContradiction);
  const rk = asRecord(r.ranking);

  return {
    primaryContradiction: {
      type: asString(pc.type) as ResearchDirective["primaryContradiction"]["type"],
      description: asString(pc.description),
      searchInstinct: asString(pc.searchInstinct),
      whyItMatters: asString(pc.whyItMatters),
    },

    searchInstincts: Array.isArray(r.searchInstincts)
      ? r.searchInstincts.map((i) => asString(i))
      : [],

    painSignals: Array.isArray(r.painSignals)
      ? r.painSignals.map((i) => asString(i))
      : [],

    ranking: {
      top1: asString(rk.top1),
      top2: asString(rk.top2),
      top3: asString(rk.top3),
      reason: asString(rk.reason),
    },

    confidence: asConfidence(r.confidence),
  };
}

// ─────────────────────────────────────────────
// STEP 3: SYNTHESIS
// ─────────────────────────────────────────────

export function normalizeSynthesis(raw: JsonRecord): StrategicSynthesis {
  const r = asRecord(raw);

  const fp = asRecord(r.focusPriority);
  const ce = asRecord(r.coreEngine);
  const ceVillain = asRecord(ce.villain);
  const pain = asRecord(r.pain);
  const bs = asRecord(r.beliefShift);
  const pos = asRecord(r.positioning);
  const ft = asRecord(r.forwardTension);
  const exec = asRecord(r.execution);
  const ac = asRecord(r.authorControl);
  const rk = asRecord(r.ranking);
  const sb = asRecord(r.scriptBridge);
  const sbA = asRecord(sb.optionA);
  const sbB = asRecord(sb.optionB);

  return {
    focusPriority: {
      primary: asString(fp.primary) as any,
      reason: asString(fp.reason),
    },

    coreEngine: {
      contradiction: asString(ce.contradiction),
      behaviorLoop: asString(ce.behaviorLoop),
      identityPressure: asString(ce.identityPressure),
      noWinLoop: asString(ce.noWinLoop),
      villain: {
        entity: asString(ceVillain.entity),
        howItOperates: asString(ceVillain.howItOperates),
      },
    },

    pain: {
      surface: asString(pain.surface),
      real: asString(pain.real),
      scenario: asString(pain.scenario),
    },

    beliefShift: {
      from: asString(bs.from),
      breakMoment: asString(bs.breakMoment),
      to: asString(bs.to),
    },

    anchors: Array.isArray(r.anchors)
      ? r.anchors.map((a) => {
          const x = asRecord(a);
          return {
            scenario: asString(x.scenario),
            emotion: asString(x.emotion) as any,
            use: asString(x.use) as any,
          };
        })
      : [],

    positioning: {
      competitorStance: asString(pos.competitorStance),
      yourStance: asString(pos.yourStance) as any,
      voicePreset: asString(pos.voicePreset) as any,
    },

    forwardTension: {
      openQuestion: asString(ft.openQuestion),
      aspirationalGlimpse: asString(ft.aspirationalGlimpse),
      watchReason: asString(ft.watchReason),
    },

    execution: {
      hook: asString(exec.hook),
      mid: asString(exec.mid),
      peak: asString(exec.peak),
      end: asString(exec.end),
    },

    authorControl: {
      mode: asString(ac.mode) as any,
      overridePoint: asString(ac.overridePoint),
    },

    ranking: {
      top1: asString(rk.top1),
      top2: asString(rk.top2),
      top3: asString(rk.top3),
      reason: asString(rk.reason),
    },

    scriptBridge: {
      optionA: {
        action: asString(sbA.action),
        cost: asString(sbA.cost),
      },
      optionB: {
        action: asString(sbB.action),
        cost: asString(sbB.cost),
      },
      noWinAsymmetry: asString(sb.noWinAsymmetry),
      unspokenNeed: asString(sb.unspokenNeed),
      constraint: asString(sb.constraint),
      coreTruth: asString(sb.coreTruth),
    },

    physicalDetail: Array.isArray(r.physicalDetail)
      ? r.physicalDetail.map((i: any) => asString(i))
      : [],

    confidenceNotes: asString(r.confidenceNotes),
  };
}

// ─────────────────────────────────────────────
// STEP 4: SCRIPT
// ─────────────────────────────────────────────

export function normalizeScript(raw: JsonRecord): GeneratedScript {
  const r = asRecord(raw);
  const sections = asRecord(r.sections);

  const get = (k: string) => {
    const s = asRecord(sections[k]);
    return {
      text: asString(s.text),
      wordCount: Number(s.wordCount) || 0,
    };
  };

  return {
    id: asString(r.id),
    status: r.status === "FINAL" ? "FINAL" : "DRAFT",
    fullScript: asString(r.fullScript),

    // FIX: keys align với SectionKey (hook|crack|expose|validate|framework|close)
    sections: {
      hook: get("hook"),
      crack: get("crack"),
      expose: get("expose"),
      validate: get("validate"),
      framework: get("framework"),
      close: get("close"),
    },
  };
}