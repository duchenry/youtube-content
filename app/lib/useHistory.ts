"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabase";

import type {
  AnalysisResult,
  ResearchDirective,
  StrategicSynthesis,
  GeneratedScript,
} from "@/app/lib/types";
import { normalizeExtraction } from "./normalizers";

/* ─────────────────────────────
   SAFE HELPERS
───────────────────────────── */

const safeObj = (v: any) =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {};

const safeStr = (v: any) =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : "";

const safeArr = (v: any) =>
  Array.isArray(v) ? v : [];

/* ───────────────────────────── */

export interface HistoryEntry {
  id: string;
  created_at: string;
  script_preview: string;
  comments: string | null;

  result: AnalysisResult;

  research: ResearchDirective | null;
  synthesis: StrategicSynthesis | null;
  generated_script: GeneratedScript | null;

  reddit_raw: string | null;

  title: string | null;
  slug: string | null;
}

/* ─────────────────────────────
   NORMALIZER (DB SAFE)
───────────────────────────── */

function normalizeResult(raw: any): AnalysisResult {
  const r = safeObj(raw);

  return {
    hook: {
      raw: safeStr(r?.hook?.raw),
      type: r?.hook?.type ?? "Question",
      mechanism: safeStr(r?.hook?.mechanism),
      confidence: r?.hook?.confidence ?? "low",
    },

    angle: {
      claim: safeStr(r?.angle?.claim),
      hiddenAssumption: safeStr(r?.angle?.hiddenAssumption),
      confidence: r?.angle?.confidence ?? "low",
    },

    coreTruth: {
      insight: safeStr(r?.coreTruth?.insight),
      triggerMoment: safeStr(r?.coreTruth?.triggerMoment),
      confidence: r?.coreTruth?.confidence ?? "low",
    },

    attention: {
      retentionDriver: {
        description: safeStr(r?.attention?.retentionDriver?.description),
        confidence: r?.attention?.retentionDriver?.confidence ?? "low",
      },
    },

    audience: {
      profile: safeStr(r?.audience?.profile),

      painMap: safeArr(r?.audience?.painMap).map((p: any) => ({
        pain: safeStr(p?.pain),
        realScenario: safeStr(p?.realScenario),
      })),

      commentInsight: {
        repeatedPain: safeStr(r?.audience?.commentInsight?.repeatedPain),
        emotionalExample: safeStr(r?.audience?.commentInsight?.emotionalExample),
        unspokenNeed: safeStr(r?.audience?.commentInsight?.unspokenNeed),
      },
    },

    priority: {
      primaryDriver: safeStr(r?.priority?.primaryDriver),
      why: safeStr(r?.priority?.why),
    },

    viewerProfile: {
      ageRange: safeStr(r?.viewerProfile?.ageRange),
      incomeOrSituation: safeStr(r?.viewerProfile?.incomeOrSituation),
      coreBelief: safeStr(r?.viewerProfile?.coreBelief),
      recentPainTrigger: safeStr(r?.viewerProfile?.recentPainTrigger),
    },

    inputComments: safeArr(r?.inputComments),
  };
}

/* ───────────────────────────── */

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("[fetchHistory] ERROR:", error);
        return;
      }

      if (!data) return;

      const mapped: HistoryEntry[] = data.map((item: any) => ({
        ...item,
        result: normalizeExtraction(item?.result?.extraction, item?.result?.extraction?.inputComments),
        
        research: item?.research ?? null,
        synthesis: item?.synthesis ?? null,
        generated_script: item?.generated_script ?? null,
        reddit_raw: item?.reddit_raw ?? null,
        title: item?.title ?? null,
        slug: item?.slug ?? null,
      }));

      setHistory(mapped);
    } catch (e) {
      console.error("[fetchHistory] CRASH:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

    const saveAnalysis = async (
    script: string,
    comments: string[],
    result: AnalysisResult
  ) => {
    const { data, error } = await supabase
      .from("analyses")
      .insert({
        script_preview: script.slice(0, 200),
        comments: comments.join("\n"),
        result,
      })
      .select()
      .single();

    if (error) {
      console.error("[saveAnalysis] ERROR:", error);
      return null;
    }

    await fetchHistory(); // refresh list
    return data?.id ?? null;
  };

  const updateAnalysis = async (id: string, payload: any) => {
    const { error } = await supabase
      .from("analyses")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("[updateAnalysis] ERROR:", error);
      throw error;
    }

    await fetchHistory();
  };

  const deleteAnalysis = async (id: string) => {
    const { error } = await supabase
      .from("analyses")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[deleteAnalysis] ERROR:", error);
      throw error;
    }

    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  return {
    history,
    loading,
    fetchHistory,
    saveAnalysis, 
    deleteAnalysis
  };
}