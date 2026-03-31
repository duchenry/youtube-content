"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabase";
import { textToSlug } from "./utils";
import { AnalysisResult } from "@/app/lib/types";

export interface HistoryEntry {
  id: string;
  created_at: string;
  script_preview: string;
  comments: string | null;
  result: AnalysisResult;
  title: string | null;
  slug: string | null;
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    let data = null;
    let error = null;

    // Try with slug first (new schema)
    ({ data, error } = await supabase
      .from("analyses")
      .select("id, created_at, script_preview, comments, result, title, slug")
      .order("created_at", { ascending: false })
      .limit(50));

    const slugColumnMissing =
      error &&
      (error.message?.toLowerCase().includes("column \"slug\" does not exist") ||
        error.code === "42703" ||
        (String(error.code).startsWith("40") && error.message?.toLowerCase().includes("slug")));

    if (slugColumnMissing) {
      console.warn("Slug column missing in DB, falling back to safe fetchHistory.");
      ({ data, error } = await supabase
        .from("analyses")
        .select("id, created_at, script_preview, comments, result, title")
        .order("created_at", { ascending: false })
        .limit(50));
    }

    if (!error && data) {
      setHistory(
        (data as Array<Partial<HistoryEntry>>).map((item) => ({
          ...item,
          slug: item.slug || null,
        })) as HistoryEntry[]
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveAnalysis = useCallback(
    async (
      script: string,
      comments: string[],
      result: AnalysisResult
    ): Promise<string | null> => {
      const script_preview = script.trim().slice(0, 200);
      const title =
        result.coreTruth?.insight?.slice(0, 80) || script_preview.slice(0, 80);

      const baseSlug =
        result.coreTruth?.insight || script_preview || "draft-script";
      const slug = textToSlug(baseSlug) || `draft-${Date.now()}`;

      // Convert comments array to newline-separated string for storage
      const commentsStr = comments.filter(c => c.trim()).join("\n") || null;

      let data = null;
      let error = null;

      ({ data, error } = await supabase
        .from("analyses")
        .insert({
          script_preview,
          comments: commentsStr,
          result,
          title,
          slug,
        })
        .select("id")
        .single());

      const slugMissing =
        error &&
        (error.message?.toLowerCase().includes("column \"slug\" does not exist") ||
          error.code === "42703" ||
          (String(error.code).startsWith("40") && error.message?.toLowerCase().includes("slug")));

      if (slugMissing) {
        console.warn("Slug column missing in DB, inserting without slug.");
        ({ data, error } = await supabase
          .from("analyses")
          .insert({
            script_preview,
            comments: commentsStr,
            result,
            title,
          })
          .select("id")
          .single());
      }

      if (error || !data) {
        if (error) console.error("[saveAnalysis]", error);
        return null;
      }

      // Optimistically prepend to local state
      setHistory((prev) => [
        {
          id: data?.id,
          created_at: new Date().toISOString(),
          script_preview,
          comments: commentsStr,
          result,
          title,
          slug,
        },
        ...prev,
      ]);

      return data?.id || null;
    },
    []
  );

  const deleteAnalysis = useCallback(async (id: string) => {
    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (!error) {
      setHistory((prev) => prev.filter((e) => e.id !== id));
    }
  }, []);

  const getAnalysisBySlug = useCallback(async (slug: string): Promise<HistoryEntry | null> => {
    // 1) Direct lookup by slug column
    let { data, error } = await supabase
      .from("analyses")
      .select("id, created_at, script_preview, comments, result, title, slug")
      .eq("slug", slug)
      .single();

    const slugColumnMissing =
      error &&
      (error.message?.toLowerCase().includes("column \"slug\" does not exist") ||
        error.code === "42703" ||
        (String(error.code).startsWith("40") && error.message?.toLowerCase().includes("slug")));

    if (slugColumnMissing) {
      console.warn("Slug column missing in DB, fallback getAnalysisBySlug without slug lookup.");
      data = null;
      error = null;
    }

    if (data) {
      return {
        ...data,
        slug: (data as any).slug || null,
      } as HistoryEntry;
    }

    // 2) If no slug row, try fallback searching all analyses and matching computed slug
    const { data: allData, error: allError } = await supabase
      .from("analyses")
      .select("id, created_at, script_preview, comments, result, title, slug");

    if (allError || !allData) {
      return null;
    }

    const match = (allData as HistoryEntry[]).find((item) => {
      if (item.slug) return item.slug === slug;
      const generatedSlug = textToSlug(item.result?.coreTruth?.insight || "");
      return generatedSlug === slug;
    });

    if (!match) {
      return null;
    }

    return {
      ...match,
      slug: match.slug || textToSlug(match.result?.coreTruth?.insight || ""),
    };
  }, []);

  return { history, loading, saveAnalysis, deleteAnalysis, fetchHistory, getAnalysisBySlug };
}
