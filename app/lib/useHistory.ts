/**
 * Hook quản lý lịch sử phân tích (Supabase)
 * - fetchHistory: lấy 50 bản ghi gần nhất
 * - saveAnalysis: lưu kết quả phân tích mới
 * - deleteAnalysis: xóa bản ghi
 * - getAnalysisBySlug: tìm bản ghi theo slug (dùng cho URL thân thiện)
 * Có normalizer riêng phía client vì normalizers.ts phụ thuộc openai (server-only)
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabase";
import { textToSlug } from "./utils";
import type { AnalysisResult, ResearchDirective, StrategicSynthesis } from "@/app/lib/types";

export interface HistoryEntry {
  id: string;
  created_at: string;
  script_preview: string;
  comments: string | null;
  result: AnalysisResult;
  research: ResearchDirective | null;
  synthesis: StrategicSynthesis | null;
  reddit_raw: string | null;
  title: string | null;
  slug: string | null;
}

// Client-side normalizer: handles old Supabase records with removed fields
// (cannot import normalizers.ts because it depends on server-only openai.ts)

type R = Record<string, unknown>;
const r = (v: unknown): R => (typeof v === "object" && v !== null && !Array.isArray(v) ? v as R : {});
const s = (v: unknown): string => typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
const sa = (v: unknown): string[] => Array.isArray(v) ? v.map(s).filter(Boolean) : [];
const c = (v: unknown): "high" | "medium" | "low" => { const n = s(v).toLowerCase(); return n === "high" || n === "medium" || n === "low" ? n : "low"; };

function normalize(result: AnalysisResult): AnalysisResult {
  const raw = r(result as unknown);
  const hook = r(raw.hook); const hq = r(raw.hookQuality); const angle = r(raw.angle);
  const ct = r(raw.coreTruth); const att = r(raw.attention); const rd = r(att.retentionDriver);
  const pm = r(raw.proofMechanics); const tp = r(pm.transferablePattern);
  const sd = r(raw.structureDNA); const aud = r(raw.audience); const cp = r(aud.commentPatterns);
  const wp = r(raw.weakPoints); const pri = r(raw.priority);

  return {
    hook: { raw: s(hook.raw), type: s(hook.type), mechanism: s(hook.mechanism), confidence: c(hook.confidence) },
    hookQuality: { strength: s(hq.strength) || (hq.why ? `${s(hq.strength)} \u2014 ${s(hq.why)}` : ""), risk: s(hq.risk) },
    angle: { claim: s(angle.claim), supportingLogic: s(angle.supportingLogic), hiddenAssumption: s(angle.hiddenAssumption), confidence: c(angle.confidence) },
    coreTruth: { insight: s(ct.insight), triggerMoment: s(ct.triggerMoment), confidence: c(ct.confidence) },
    attention: { patternBreak: s(att.patternBreak), escalation: sa(att.escalation), retentionDriver: { description: s(rd.description), confidence: c(rd.confidence) } },
    proofMechanics: { evidenceUsed: sa(pm.evidenceUsed), transferablePattern: { pattern: s(tp.pattern), confidence: c(tp.confidence) } },
    structureDNA: {
      phases: (Array.isArray(sd.phases) ? sd.phases : []).map((i) => { const p = r(i); return { phase: s(p.phase), goal: s(p.goal), tactic: s(p.tactic), source: s(p.source) || "INFERRED" }; }),
      retentionMoments: (Array.isArray(sd.retentionMoments) ? sd.retentionMoments : []).map((i) => { const m = r(i); return { moment: s(m.moment), whyItWorks: s(m.whyItWorks), pattern: s(m.pattern), isPrimary: Boolean(m.isPrimary) }; }),
    },
    audience: {
      profile: s(aud.profile),
      painMap: (Array.isArray(aud.painMap) ? aud.painMap : []).map((i) => { const p = r(i); return { pain: s(p.pain), realScenario: s(p.realScenario) }; }),
      commentPatterns: {
        dominantSentiment: s(cp.dominantSentiment),
        repeatedPain: s(cp.repeatedPain),
        emotionalTriggers: (Array.isArray(cp.emotionalTriggers) ? cp.emotionalTriggers : []).map((i) => { const t = r(i); return { quote: s(t.quote), emotion: s(t.emotion), insight: s(t.insight) }; }),
        languageFingerprint: sa(cp.languageFingerprint).length ? sa(cp.languageFingerprint) : sa(cp.languageUsed),
        unspokenNeed: s(cp.unspokenNeed),
        misunderstanding: s(cp.misunderstanding),
      },
    },
    weakPoints: { whereItLosesAttention: s(wp.whereItLosesAttention), why: s(wp.why) },
    priority: { primaryDriver: s(pri.primaryDriver), why: s(pri.why) },
  };
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    let { data, error } = await supabase
      .from("analyses")
      .select("id, created_at, script_preview, comments, result, research, synthesis, reddit_raw, title, slug")
      .order("created_at", { ascending: false })
      .limit(50);

    // Fallback if new columns don't exist yet
    if (error?.message?.toLowerCase().includes("research") || error?.message?.toLowerCase().includes("synthesis") || error?.message?.toLowerCase().includes("reddit_raw") || error?.message?.toLowerCase().includes("slug") || error?.code === "42703") {
      const fallback = await supabase
        .from("analyses")
        .select("id, created_at, script_preview, comments, result, title")
        .order("created_at", { ascending: false })
        .limit(50);
      data = fallback.data as typeof data;
      error = fallback.error;
    }

    if (!error && data) {
      setHistory(
        (data as Array<Partial<HistoryEntry>>).map((item) => ({
          ...item,
          result: normalize((item.result || {}) as AnalysisResult),
          research: (item.research as ResearchDirective) || null,
          synthesis: (item.synthesis as StrategicSynthesis) || null,
          reddit_raw: (item.reddit_raw as string) || null,
          slug: item.slug || null,
        })) as HistoryEntry[]
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const saveAnalysis = useCallback(async (script: string, comments: string[], result: AnalysisResult): Promise<string | null> => {
    const normalized = normalize(result);
    const scriptPreview = script.trim().slice(0, 200);
    const title = normalized.coreTruth.insight.slice(0, 80) || scriptPreview.slice(0, 80);
    const slug = textToSlug(normalized.coreTruth.insight || scriptPreview || "draft-script") || `draft-${Date.now()}`;
    const commentsStr = comments.filter((x) => x.trim()).join("\n") || null;

    let { data, error } = await supabase
      .from("analyses")
      .insert({ script_preview: scriptPreview, comments: commentsStr, result: normalized, research: null, synthesis: null, reddit_raw: null, title, slug })
      .select("id")
      .single();

    if (error?.message?.toLowerCase().includes("slug") || error?.message?.toLowerCase().includes("research") || error?.code === "42703") {
      ({ data, error } = await supabase
        .from("analyses")
        .insert({ script_preview: scriptPreview, comments: commentsStr, result: normalized, title })
        .select("id")
        .single());
    }

    if (error || !data) { if (error) console.error("[saveAnalysis]", error); return null; }

    setHistory((prev) => [
      { id: data.id, created_at: new Date().toISOString(), script_preview: scriptPreview, comments: commentsStr, result: normalized, research: null, synthesis: null, reddit_raw: null, title, slug },
      ...prev,
    ]);
    return data.id || null;
  }, []);

  const deleteAnalysis = useCallback(async (id: string) => {
    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (!error) setHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateAnalysis = useCallback(async (id: string, fields: { research?: ResearchDirective; synthesis?: StrategicSynthesis; reddit_raw?: string }) => {
    const { error } = await supabase.from("analyses").update(fields).eq("id", id);
    if (error) { console.error("[updateAnalysis]", error); return false; }
    setHistory((prev) => prev.map((e) => e.id === id ? { ...e, ...fields } : e));
    return true;
  }, []);

  const getAnalysisBySlug = useCallback(async (slug: string): Promise<HistoryEntry | null> => {
    const { data } = await supabase.from("analyses").select("*").eq("slug", slug).single();
    if (data) return { ...data, result: normalize((data as HistoryEntry).result), research: data.research || null, synthesis: data.synthesis || null, reddit_raw: data.reddit_raw || null, slug: data.slug || null } as HistoryEntry;

    const { data: all } = await supabase.from("analyses").select("*");
    const match = (all as HistoryEntry[] || []).find((i) => (i.slug || textToSlug(i.result?.coreTruth?.insight || "")) === slug);
    return match ? { ...match, result: normalize(match.result), research: match.research || null, synthesis: match.synthesis || null, reddit_raw: match.reddit_raw || null, slug: match.slug || textToSlug(match.result?.coreTruth?.insight || "") } : null;
  }, []);

  return { history, loading, saveAnalysis, updateAnalysis, deleteAnalysis, fetchHistory, getAnalysisBySlug };
}
