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

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const single = asString(value);
    return single ? [single] : [];
  }
  return value.map((item) => asString(item)).filter(Boolean);
}

function asConfidence(value: unknown): "high" | "medium" | "low" {
  const normalized = asString(value).toLowerCase();
  if (normalized === "high" || normalized === "medium" || normalized === "low") {
    return normalized;
  }
  return "low";
}

function asStrength(value: unknown): "weak" | "medium" | "strong" {
  const normalized = asString(value).toLowerCase();
  if (normalized === "weak" || normalized === "medium" || normalized === "strong") {
    return normalized;
  }
  return "medium";
}

function normalizeAnalysis(result: AnalysisResult): AnalysisResult {
  const raw = asRecord(result as unknown);

  const hook = asRecord(raw.hook);
  const hookQuality = asRecord(raw.hookQuality);
  const angle = asRecord(raw.angle);
  const coreTruth = asRecord(raw.coreTruth);
  const attention = asRecord(raw.attention);
  const retentionDriver = asRecord(attention.retentionDriver);
  const proofMechanics = asRecord(raw.proofMechanics);
  const transferablePattern = asRecord(proofMechanics.transferablePattern);
  const structureDNA = asRecord(raw.structureDNA);
  const audience = asRecord(raw.audience);
  const commentPatterns = asRecord(audience.commentPatterns);
  const weakPoints = asRecord(raw.weakPoints);
  const priority = asRecord(raw.priority);

  const phasesRaw = Array.isArray(structureDNA.phases) ? structureDNA.phases : [];
  const retentionRaw = Array.isArray(structureDNA.retentionMoments)
    ? structureDNA.retentionMoments
    : [];
  const painMapRaw = Array.isArray(audience.painMap) ? audience.painMap : [];

  return {
    hook: {
      raw: asString(hook.raw),
      type: asString(hook.type),
      mechanism: asString(hook.mechanism),
      confidence: asConfidence(hook.confidence),
    },
    hookQuality: {
      strength: asStrength(hookQuality.strength),
      why: asString(hookQuality.why),
      risk: asString(hookQuality.risk),
    },
    angle: {
      claim: asString(angle.claim),
      supportingLogic: asString(angle.supportingLogic),
      hiddenAssumption: asString(angle.hiddenAssumption),
      confidence: asConfidence(angle.confidence),
    },
    coreTruth: {
      insight: asString(coreTruth.insight),
      triggerMoment: asString(coreTruth.triggerMoment),
      confidence: asConfidence(coreTruth.confidence),
    },
    attention: {
      patternBreak: asString(attention.patternBreak),
      escalation: asStringArray(attention.escalation),
      retentionDriver: {
        description: asString(retentionDriver.description),
        confidence: asConfidence(retentionDriver.confidence),
      },
    },
    proofMechanics: {
      evidenceUsed: asStringArray(proofMechanics.evidenceUsed),
      transferablePattern: {
        pattern: asString(transferablePattern.pattern),
        confidence: asConfidence(transferablePattern.confidence),
      },
    },
    structureDNA: {
      phases: phasesRaw.map((item) => {
        const phase = asRecord(item);
        return {
          phase: asString(phase.phase),
          goal: asString(phase.goal),
          tactic: asString(phase.tactic),
          source: asString(phase.source) || "INFERRED",
        };
      }),
      retentionMoments: retentionRaw.map((item) => {
        const moment = asRecord(item);
        return {
          moment: asString(moment.moment),
          whyItWorks: asString(moment.whyItWorks),
          pattern: asString(moment.pattern),
          isPrimary: Boolean(moment.isPrimary),
        };
      }),
    },
    audience: {
      profile: asString(audience.profile),
      painMap: painMapRaw.map((item) => {
        const pain = asRecord(item);
        return {
          pain: asString(pain.pain),
          feeling: asString(pain.feeling),
          realScenario: asString(pain.realScenario),
        };
      }),
      commentPatterns: {
        repeatedPain: asString(commentPatterns.repeatedPain),
        languageUsed: asStringArray(commentPatterns.languageUsed),
        misunderstanding: asString(commentPatterns.misunderstanding),
      },
    },
    weakPoints: {
      whereItLosesAttention: asString(weakPoints.whereItLosesAttention),
      why: asString(weakPoints.why),
    },
    priority: {
      primaryDriver: asString(priority.primaryDriver),
      secondaryDriver: asString(priority.secondaryDriver),
      why: asString(priority.why),
    },
  };
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    let data = null;
    let error = null;

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
          result: normalizeAnalysis((item.result || {}) as AnalysisResult),
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
    async (script: string, comments: string[], result: AnalysisResult): Promise<string | null> => {
      const normalized = normalizeAnalysis(result);
      const scriptPreview = script.trim().slice(0, 200);
      const title = normalized.coreTruth.insight.slice(0, 80) || scriptPreview.slice(0, 80);

      const baseSlug = normalized.coreTruth.insight || scriptPreview || "draft-script";
      const slug = textToSlug(baseSlug) || `draft-${Date.now()}`;
      const commentsStr = comments.filter((comment) => comment.trim()).join("\n") || null;

      let data = null;
      let error = null;

      ({ data, error } = await supabase
        .from("analyses")
        .insert({
          script_preview: scriptPreview,
          comments: commentsStr,
          result: normalized,
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
        ({ data, error } = await supabase
          .from("analyses")
          .insert({
            script_preview: scriptPreview,
            comments: commentsStr,
            result: normalized,
            title,
          })
          .select("id")
          .single());
      }

      if (error || !data) {
        if (error) console.error("[saveAnalysis]", error);
        return null;
      }

      setHistory((prev) => [
        {
          id: data.id,
          created_at: new Date().toISOString(),
          script_preview: scriptPreview,
          comments: commentsStr,
          result: normalized,
          title,
          slug,
        },
        ...prev,
      ]);

      return data.id || null;
    },
    []
  );

  const deleteAnalysis = useCallback(async (id: string) => {
    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (!error) {
      setHistory((prev) => prev.filter((entry) => entry.id !== id));
    }
  }, []);

  const getAnalysisBySlug = useCallback(async (slug: string): Promise<HistoryEntry | null> => {
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
      data = null;
      error = null;
    }

    if (data) {
      return {
        ...data,
        result: normalizeAnalysis((data as HistoryEntry).result),
        slug: (data as HistoryEntry).slug || null,
      } as HistoryEntry;
    }

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

    if (!match) return null;

    return {
      ...match,
      result: normalizeAnalysis(match.result),
      slug: match.slug || textToSlug(match.result?.coreTruth?.insight || ""),
    };
  }, []);

  return { history, loading, saveAnalysis, deleteAnalysis, fetchHistory, getAnalysisBySlug };
}
