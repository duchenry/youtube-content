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
  const pri = asRecord(source.priority);
  const vp = asRecord(source.viewerProfile);

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

      commentInsight: {
        repeatedPain: tooFew ? INSUFFICIENT : asString(ci.repeatedPain),
        emotionalExample: tooFew ? INSUFFICIENT : asString(ci.emotionalExample),
        unspokenNeed: tooFew ? INSUFFICIENT : asString(ci.unspokenNeed),
      },
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
    },

    inputComments: comments || [],
  };
}

// ─────────────────────────────────────────────
// STEP 2: RESEARCH
// ─────────────────────────────────────────────

export function normalizeResearch(raw: any): ResearchDirective {
  const pc = raw?.primaryContradiction ?? {};

  return {
    primaryContradiction: {
      type: pc.type || "",
      description: pc.description || "",
      searchInstinct: pc.searchInstinct || "",
      whyItMatters: pc.whyItMatters || "",
    },

    searchInstincts: raw?.searchInstincts || [],
    painSignals: raw?.painSignals || [],

    ranking: raw?.ranking || {
      top1: "",
      top2: "",
      top3: "",
      reason: "",
    },

    confidence: raw?.confidence || "low",
  };
}

// ─────────────────────────────────────────────
// STEP 3: SYNTHESIS
// ─────────────────────────────────────────────

export function normalizeSynthesis(raw: JsonRecord): StrategicSynthesis {
  const r = asRecord(raw);

  const fp = asRecord(r.focusPriority);
  const ce = asRecord(r.coreEngine);
  const pain = asRecord(r.pain);
  const bs = asRecord(r.beliefShift);
  const exec = asRecord(r.execution);
  const ac = asRecord(r.authorControl);
  const rk = asRecord(r.ranking);

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

    sections: {
      hook: get("hook"),
      setup: get("setup"),
      contradiction: get("contradiction"),
      reframe: get("reframe"),
      solution: get("solution"),
      close: get("close"),
    },
  };
}