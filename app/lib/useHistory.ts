/**
 * Hook quản lý lịch sử phân tích (Supabase)
 * - fetchHistory: lấy 50 bản ghi gần nhất
 * - saveAnalysis: lưu kết quả phân tích mới
 * - deleteAnalysis: xóa bản ghi
 * - getAnalysisBySlug: tìm bản ghi theo slug (dùng cho URL thân thiện)
 *
 * ✅ FINAL FIX:
 * - Removed old fields:
 *   hookQuality
 *   supportingLogic
 *   patternBreak
 *   escalation
 *   proofMechanics
 *   structureDNA
 *   weakPoints
 *   commentPatterns
 *
 * - Fully synced with latest types.ts
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabase";
import { textToSlug } from "./utils";

import type {
  AnalysisResult,
  ResearchDirective,
  StrategicSynthesis,
  GeneratedScript,
} from "@/app/lib/types";

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
   SAFE NORMALIZER HELPERS
───────────────────────────── */

type R = Record<string, unknown>;

const r = (v: unknown): R =>
  typeof v === "object" &&
  v !== null &&
  !Array.isArray(v)
    ? (v as R)
    : {};

const s = (v: unknown): string =>
  typeof v === "string"
    ? v.trim()
    : typeof v === "number"
    ? String(v)
    : "";

const sa = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.map(s).filter(Boolean)
    : [];

const c = (
  v: unknown
): "high" | "medium" | "low" => {
  const n = s(v).toLowerCase();

  return n === "high" ||
    n === "medium" ||
    n === "low"
    ? n
    : "low";
};

/* ─────────────────────────────
   ANALYSIS NORMALIZER
───────────────────────────── */

function normalize(
  result: AnalysisResult | null | undefined
): AnalysisResult {
  const raw = r(result);

  const hook = r(raw.hook);
  const angle = r(raw.angle);
  const ct = r(raw.coreTruth);

  const att = r(raw.attention);
  const rd = r(att.retentionDriver);

  const aud = r(raw.audience);
  const ci = r(aud.commentInsight);

  const pri = r(raw.priority);
  const vp = r(raw.viewerProfile);

  return {
    hook: {
      raw: s(hook.raw),

      type: s(hook.type) as
        | "Curiosity"
        | "Pain"
        | "Question"
        | "Story",

      mechanism: s(hook.mechanism),

      confidence: c(hook.confidence),
    },

    angle: {
      claim: s(angle.claim),

      hiddenAssumption: s(
        angle.hiddenAssumption
      ),

      confidence: c(angle.confidence),
    },

    coreTruth: {
      insight: s(ct.insight),

      triggerMoment: s(
        ct.triggerMoment
      ),

      confidence: c(ct.confidence),
    },

    attention: {
      retentionDriver: {
        description: s(rd.description),

        confidence: c(rd.confidence),
      },
    },

    audience: {
      profile: s(aud.profile),

      painMap: (
        Array.isArray(aud.painMap)
          ? aud.painMap
          : []
      ).map((item) => {
        const p = r(item);

        return {
          pain: s(p.pain),

          realScenario: s(
            p.realScenario
          ),
        };
      }),

      commentInsight: {
        repeatedPain: s(
          ci.repeatedPain
        ),

        emotionalExample: s(
          ci.emotionalExample
        ),

        unspokenNeed: s(
          ci.unspokenNeed
        ),
      },
    },

    priority: {
      primaryDriver: s(
        pri.primaryDriver
      ),

      why: s(pri.why),
    },

    viewerProfile: {
      ageRange: s(vp.ageRange),

      incomeOrSituation: s(
        vp.incomeOrSituation
      ),

      coreBelief: s(
        vp.coreBelief
      ),

      recentPainTrigger: s(
        vp.recentPainTrigger
      ),
    },

    inputComments: sa(
      raw.inputComments
    ),
  };
}

/* ─────────────────────────────
   HOOK
───────────────────────────── */

export function useHistory() {
  const [history, setHistory] =
    useState<HistoryEntry[]>([]);

  const [loading, setLoading] =
    useState(true);

  /* ───────────────────────── */

  const fetchHistory = useCallback(
    async () => {
      setLoading(true);

      try {
        let { data, error } =
          await supabase
            .from("analyses")
            .select(
              `
            id,
            created_at,
            script_preview,
            comments,
            result,
            research,
            synthesis,
            generated_script,
            reddit_raw,
            title,
            slug
          `
            )
            .order("created_at", {
              ascending: false,
            })
            .limit(50);

        // fallback for old schema
        if (
          error &&
          (error.message
            ?.toLowerCase()
            .includes("research") ||
            error.message
              ?.toLowerCase()
              .includes("synthesis") ||
            error.message
              ?.toLowerCase()
              .includes("reddit_raw") ||
            error.message
              ?.toLowerCase()
              .includes("slug") ||
            error.code === "42703")
        ) {
          const fallback =
            await supabase
              .from("analyses")
              .select(
                `
              id,
              created_at,
              script_preview,
              comments,
              result,
              title
            `
              )
              .order(
                "created_at",
                {
                  ascending: false,
                }
              )
              .limit(50);

          data =
            fallback.data as typeof data;

          error = fallback.error;
        }

        if (!error && data) {
          setHistory(
            (
              data as Array<
                Partial<HistoryEntry>
              >
            ).map((item) => ({
              ...item,

              result: item.result
                ? normalize(
                    item.result as AnalysisResult
                  )
                : ({} as AnalysisResult),

              research:
                (item.research as ResearchDirective) ||
                null,

              synthesis:
                (item.synthesis as StrategicSynthesis) ||
                null,

              generated_script:
                (item.generated_script as GeneratedScript) ||
                null,

              reddit_raw:
                (item.reddit_raw as string) ||
                null,

              slug:
                item.slug || null,
            })) as HistoryEntry[]
          );
        }
      } catch (e) {
        console.error(
          "[fetchHistory] Critical error:",
          e
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* ───────────────────────── */

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  /* ───────────────────────── */

  const saveAnalysis =
    useCallback(
      async (
        script: string,
        comments: string[],
        result: AnalysisResult
      ): Promise<string | null> => {
        try {
          const normalized =
            result
              ? normalize(result)
              : ({} as AnalysisResult);

          const scriptPreview = (
            script || ""
          )
            .trim()
            .slice(0, 200);

          const title =
            (
              normalized.hook?.raw || ""
            ).slice(0, 80) ||
            scriptPreview.slice(0, 80);

          const slug =
            textToSlug(
              normalized.hook?.raw ||
                scriptPreview ||
                "draft-script"
            ) ||
            `draft-${Date.now()}`;

          const commentsStr =
            (comments || [])
              .filter(
                (x) =>
                  x && x.trim()
              )
              .join("\n") || null;

          let { data, error } =
            await supabase
              .from("analyses")
              .insert({
                script_preview:
                  scriptPreview,

                comments:
                  commentsStr,

                result: JSON.parse(
                  JSON.stringify(
                    normalized
                  )
                ),

                research: null,
                synthesis: null,
                reddit_raw: null,

                title,
                slug,
              })
              .select("id")
              .single();

          // old schema fallback
          if (
            error &&
            (error.message
              ?.toLowerCase()
              .includes("slug") ||
              error.message
                ?.toLowerCase()
                .includes(
                  "research"
                ) ||
              error.code ===
                "42703")
          ) {
            ({
              data,
              error,
            } = await supabase
              .from("analyses")
              .insert({
                script_preview:
                  scriptPreview,

                comments:
                  commentsStr,

                result: JSON.parse(
                  JSON.stringify(
                    normalized
                  )
                ),

                title,
              })
              .select("id")
              .single());
          }

          if (error || !data) {
            if (error) {
              console.error(
                "[saveAnalysis]",
                error
              );
            }

            return null;
          }

          setHistory((prev) => [
            {
              id: data.id,

              created_at:
                new Date().toISOString(),

              script_preview:
                scriptPreview,

              comments:
                commentsStr,

              result: JSON.parse(
                JSON.stringify(
                  normalized
                )
              ),

              research: null,
              synthesis: null,
              generated_script:
                null,

              reddit_raw: null,

              title,
              slug,
            },

            ...prev,
          ]);

          return data.id || null;
        } catch (e) {
          console.error(
            "[saveAnalysis] Critical error:",
            e
          );

          return null;
        }
      },
      []
    );

  /* ───────────────────────── */

  const deleteAnalysis =
    useCallback(
      async (id: string) => {
        try {
          const { error } =
            await supabase
              .from("analyses")
              .delete()
              .eq("id", id);

          if (!error) {
            setHistory((prev) =>
              prev.filter(
                (e) => e.id !== id
              )
            );
          }
        } catch (e) {
          console.error(
            "[deleteAnalysis] Critical error:",
            e
          );
        }
      },
      []
    );

  /* ───────────────────────── */

  const updateAnalysis =
    useCallback(
      async (
        id: string,
        fields: {
          research?: ResearchDirective;
          synthesis?: StrategicSynthesis;
          reddit_raw?: string;
        }
      ) => {
        try {
          const { error } =
            await supabase
              .from("analyses")
              .update({
                ...(fields.research && {
                  research: JSON.parse(
                    JSON.stringify(
                      fields.research
                    )
                  ),
                }),

                ...(fields.synthesis && {
                  synthesis: JSON.parse(
                    JSON.stringify(
                      fields.synthesis
                    )
                  ),
                }),

                ...(fields.reddit_raw && {
                  reddit_raw:
                    fields.reddit_raw,
                }),
              })
              .eq("id", id);

          if (error) {
            console.error(
              "[updateAnalysis] Error:",
              error
            );

            return false;
          }

          setHistory((prev) =>
            prev.map((e) =>
              e.id === id
                ? {
                    ...e,
                    ...fields,
                  }
                : e
            )
          );

          return true;
        } catch (e) {
          console.error(
            "[updateAnalysis] Critical error:",
            e
          );

          return false;
        }
      },
      []
    );

  /* ───────────────────────── */

  const getAnalysisBySlug =
    useCallback(
      async (
        slug: string
      ): Promise<HistoryEntry | null> => {
        try {
          const { data, error } =
            await supabase
              .from("analyses")
              .select("*")
              .eq("slug", slug)
              .maybeSingle();

          if (!error && data) {
            return {
              ...data,

              result: data.result
                ? normalize(
                    data.result as AnalysisResult
                  )
                : ({} as AnalysisResult),

              research:
                data.research ||
                null,

              synthesis:
                data.synthesis ||
                null,

              generated_script:
                data.generated_script ||
                null,

              reddit_raw:
                data.reddit_raw ||
                null,

              slug:
                data.slug || null,
            } as HistoryEntry;
          }

          const {
            data: all,
            error: allError,
          } = await supabase
            .from("analyses")
            .select("*");

          if (
            allError ||
            !all
          ) {
            return null;
          }

          const match = (
            all as HistoryEntry[]
          ).find((i) => {
            if (!i) return false;

            const generatedSlug =
              i.result?.hook?.raw
                ? textToSlug(
                    i.result.hook.raw
                  )
                : "";

            return (
              (i.slug ||
                generatedSlug) ===
              slug
            );
          });

          return match
            ? ({
                ...match,

                result:
                  match.result
                    ? normalize(
                        match.result
                      )
                    : ({} as AnalysisResult),

                research:
                  match.research ||
                  null,

                synthesis:
                  match.synthesis ||
                  null,

                generated_script:
                  match.generated_script ||
                  null,

                reddit_raw:
                  match.reddit_raw ||
                  null,

                slug:
                  match.slug ||
                  (match.result
                    ?.hook?.raw
                    ? textToSlug(
                        match.result
                          .hook.raw
                      )
                    : null),
              } as HistoryEntry)
            : null;
        } catch (e) {
          console.error(
            "[getAnalysisBySlug] Critical error:",
            e
          );

          return null;
        }
      },
      []
    );

  /* ───────────────────────── */

  return {
    history,
    loading,

    saveAnalysis,
    updateAnalysis,
    deleteAnalysis,

    fetchHistory,
    getAnalysisBySlug,
  };
}