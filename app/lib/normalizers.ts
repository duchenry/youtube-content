/**
 * Chuẩn hóa data AI trả về → đúng kiểu TypeScript
 * Mỗi API route import từ đây → không trùng lặp code
 * - normalizeExtraction: Bước 1 (phân tích video)
 * - normalizeResearch: Bước 2 (hướng dẫn nghiên cứu Reddit)
 * - normalizeSynthesis: Bước 3 (tổng hợp chiến lược)
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
  asStringArray,
  asConfidence,
  type JsonRecord,
} from "./openai";

import { SECTION_ORDER } from "./prompts/scriptGenerator";

const INSUFFICIENT = "Insufficient data — need more comments";

// ── Step 1: Extraction ──────────────────────────────────────

export function normalizeExtraction(
  raw: JsonRecord,
  comments: string[]
): AnalysisResult {
  const hook = asRecord(raw.hook);
  const angle = asRecord(raw.angle);
  const ct = asRecord(raw.coreTruth);
  const att = asRecord(raw.attention);
  const rd = asRecord(att.retentionDriver);
  const aud = asRecord(raw.audience);
  const ci = asRecord(aud.commentInsight);
  const pri = asRecord(raw.priority);
  const vp = asRecord(raw.viewerProfile);

  const tooFew = comments.length < 5;

  return {
    hook: {
      raw: asString(hook.raw),
      type: asString(hook.type) as
        | "Curiosity"
        | "Pain"
        | "Question"
        | "Story",
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

      painMap: (Array.isArray(aud.painMap) ? aud.painMap : []).map((item) => {
        const p = asRecord(item);

        return {
          pain: asString(p.pain),
          realScenario: asString(p.realScenario),
        };
      }),

      commentInsight: {
        repeatedPain: tooFew
          ? INSUFFICIENT
          : asString(ci.repeatedPain),

        emotionalExample: tooFew
          ? INSUFFICIENT
          : asString(ci.emotionalExample),

        unspokenNeed: tooFew
          ? INSUFFICIENT
          : asString(ci.unspokenNeed),
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

    inputComments: comments,
  };
}

// ── Step 2: Research Directive ──────────────────────────────

export function normalizeResearch(raw: any): ResearchDirective {
  const pc = raw?.primaryContradiction ?? {};

  return {
    primaryContradiction: {
      type: pc.type,
      description: pc.description,
      searchInstinct: pc.searchInstinct,
      whyItMatters: pc.whyItMatters ?? "",
    },

    searchInstincts: Array.isArray(raw?.searchInstincts)
      ? raw.searchInstincts
      : [],

    painSignals: Array.isArray(raw?.painSignals)
      ? raw.painSignals
      : [],

    ranking: raw?.ranking ?? {
      top1: "",
      top2: "",
      top3: "",
      reason: "",
    },

    confidence: raw?.confidence ?? "low",
  };
}

// ── Step 3: Strategic Synthesis ─────────────────────────────

export function normalizeSynthesis(
  raw: JsonRecord
): StrategicSynthesis {
  const fp = asRecord(raw.focusPriority);
  const ce = asRecord(raw.coreEngine);
  const pain = asRecord(raw.pain);
  const bs = asRecord(raw.beliefShift);
  const exec = asRecord(raw.execution);
  const ac = asRecord(raw.authorControl);
  const rk = asRecord(raw.ranking);

  return {
    focusPriority: {
      primary: asString(fp.primary) as
        | "contradiction"
        | "behavior"
        | "identity"
        | "no_win",

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

    anchors: (
      Array.isArray(raw.anchors)
        ? raw.anchors
        : []
    ).map((item) => {
      const a = asRecord(item);

      return {
        scenario: asString(a.scenario),

        emotion: asString(a.emotion) as
          | "fear"
          | "shame"
          | "ego"
          | "relief",

        use: asString(a.use) as
          | "hook"
          | "mid"
          | "proof",
      };
    }),

    execution: {
      hook: asString(exec.hook),
      mid: asString(exec.mid),
      peak: asString(exec.peak),
      end: asString(exec.end),
    },

    authorControl: {
      mode: asString(ac.mode) as
        | "augment"
        | "replace"
        | "none",

      overridePoint: asString(ac.overridePoint),
    },

    ranking: {
      top1: asString(rk.top1),
      top2: asString(rk.top2),
      top3: asString(rk.top3),
      reason: asString(rk.reason),
    },

    // ✅ FIX: thêm field bị thiếu
    physicalDetail: Array.isArray(raw.physicalDetail)
      ? raw.physicalDetail.map((item) => asString(item))
      : [],

    confidenceNotes: asString(raw.confidenceNotes),
  };
}

// ── Step 4: Script Generation ──────────────────────────────

export function normalizeScript(
  raw: JsonRecord
): GeneratedScript {
  const sections = (raw.sections ?? {}) as Record<string, any>;

  function normalizeSection(key: string) {
    const s = sections[key] ?? {};

    return {
      text: asString(s.text),
      wordCount: Number(s.wordCount) || 0,
    };
  }

  return {
    id: asString(raw.id),
    status:
      raw.status === "FINAL"
        ? "FINAL"
        : "DRAFT",

    fullScript: asString(raw.fullScript),

    sections: {
      hook: normalizeSection("hook"),
      setup: normalizeSection("setup"),
      contradiction: normalizeSection("contradiction"),
      reframe: normalizeSection("reframe"),
      solution: normalizeSection("solution"),
      close: normalizeSection("close"),
    },
  };
}