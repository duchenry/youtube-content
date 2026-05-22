"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabase";

import type {
  AnalysisResult,
  ResearchDirective,
  StrategicSynthesis,
  GeneratedScript,
  EvaluationMap,
} from "@/app/lib/types";

import { normalizeExtraction } from "./normalizers";

/* ─────────────────────────────
   SAFE HELPERS
───────────────────────────── */

const safeObj = (v: any) =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {};

const safeStr = (v: any) =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : "";

const safeArr = <T = any,>(v: any): T[] => (Array.isArray(v) ? v : []);

const commentsToArray = (comments: any): string[] => {
  if (Array.isArray(comments)) {
    return comments.map(safeStr).filter(Boolean);
  }

  if (typeof comments === "string") {
    return comments
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
  }

  return [];
};

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

  evaluations: EvaluationMap | null;

  reddit_raw: string | null;

  title: string | null;
  slug: string | null;
}

/* ─────────────────────────────
   NORMALIZER FOR OLD + NEW DB SHAPES
───────────────────────────── */

function normalizeStoredResult(item: any): AnalysisResult {
  const storedResult = safeObj(item?.result);

  /**
   * Supports both shapes:
   *
   * OLD:
   * result: {
   *   extraction: {...}
   * }
   *
   * NEW:
   * result: {...}
   */
  const extractionCandidate = safeObj(storedResult?.extraction);
  const extraction =
    Object.keys(extractionCandidate).length > 0
      ? extractionCandidate
      : storedResult;

  const inputComments =
    safeArr<string>(extraction?.inputComments).length > 0
      ? safeArr<string>(extraction?.inputComments)
      : commentsToArray(item?.comments);

  return normalizeExtraction(extraction, inputComments);
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
        id: safeStr(item?.id),
        created_at: safeStr(item?.created_at),

        script_preview:
          safeStr(item?.script_preview) || safeStr(item?.script).slice(0, 200),

        comments: Array.isArray(item?.comments)
          ? item.comments.join("\n")
          : item?.comments ?? null,

        result: normalizeStoredResult(item),

        research: item?.research ?? null,
        synthesis: item?.synthesis ?? null,
        generated_script: item?.generated_script ?? null,

        evaluations: item?.evaluations ?? null,

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
    const normalizedResult: AnalysisResult = {
      ...result,
      inputComments:
        Array.isArray(result.inputComments) && result.inputComments.length > 0
          ? result.inputComments
          : comments,
    };

    const { data, error } = await supabase
      .from("analyses")
      .insert({
        script_preview: script.slice(0, 200),
        comments: comments.join("\n"),
        result: normalizedResult,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[saveAnalysis] ERROR:", error);
      return null;
    }

    await fetchHistory();
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
    const { error } = await supabase.from("analyses").delete().eq("id", id);

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
    updateAnalysis,
    deleteAnalysis,
  };
}