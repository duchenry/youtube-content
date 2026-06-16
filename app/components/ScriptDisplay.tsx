"use client";

import { useState, useEffect } from "react";
import {
  SECTION_KEYS,
  SectionKey,
  type GeneratedScript,
  type ScriptEvaluateResult,
} from "@/app/lib/types";
import { supabase } from "@/app/lib/supabase";

type SectionMap = GeneratedScript["sections"];

export function ScriptDisplay({
  data,
  analysisId,
}: {
  data: GeneratedScript | null;
  analysisId: string | null;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const SESSION_KEY = "yt-analyzer-session";

  const [evaluations, setEvaluations] = useState<
    Partial<Record<SectionKey, any>>
  >({});

  const [loadingEval, setLoadingEval] = useState<SectionKey | null>(null);

  // FULL SCRIPT EVAL
  const [loadingScriptEval, setLoadingScriptEval] = useState(false);

  const [scriptEvaluation, setScriptEvaluation] =
    useState<ScriptEvaluateResult | null>(null);

  console.log("scriptEvaluation", scriptEvaluation);
  console.log("sections: ", data?.sections);

  const totalWords = Object.values(data?.sections || {}).reduce(
    (acc, obj) => acc + (obj.wordCount || 0), 
    0
  );

  const [selectedRewrite, setSelectedRewrite] = useState<string | null>(null);

  const [editing, setEditing] = useState<{
    section: SectionKey;
    original: string;
    editMeta?: any;
  } | null>(null);
  const [editedText, setEditedText] = useState("");

  const [manualEditing, setManualEditing] = useState<{
    section: SectionKey;
    text: string;
  } | null>(null);

  const [manualText, setManualText] = useState("");

  const [localSections, setLocalSections] = useState<SectionMap>(
    data?.sections ?? {
      hook: { text: "", wordCount: 0 },
      crack: { text: "", wordCount: 0 },
      expose: { text: "", wordCount: 0 },
      validate: { text: "", wordCount: 0 },
      framework: { text: "", wordCount: 0 },
      close: { text: "", wordCount: 0 },
    }
  );

  useEffect(() => {
    if (data?.sections) {
      setLocalSections(data.sections);
    }
  }, [data]);

  useEffect(() => {
    if (!analysisId) return;

    async function loadEvaluations() {
      const { data: row, error } = await supabase
        .from("analyses")
        .select("evaluations, script_evaluation")
        .eq("id", analysisId)
        .single();

      if (error) {
        console.error("❌ Load evaluations error:", error);
        return;
      }

      if (row?.evaluations) {
        setEvaluations(row.evaluations);
      }

      if (row?.script_evaluation) {
        setScriptEvaluation(row.script_evaluation);
      } else {
        setScriptEvaluation(null);
      }
    }

    loadEvaluations();
  }, [analysisId]);

  if (!data) return null;

  const { status, context } = data as any;

  const sections = localSections;

  function cleanPlacement(placement: any) {
    if (!placement || typeof placement !== "object") return undefined;

    const move =
      placement.move === "before" || placement.move === "after"
        ? placement.move
        : undefined;

    const anchorQuote =
      typeof placement.anchorQuote === "string"
        ? placement.anchorQuote
        : "";

    const reason =
      typeof placement.reason === "string" ? placement.reason : "";

    const bridgeSuggestion =
      typeof placement.bridgeSuggestion === "string"
        ? placement.bridgeSuggestion
        : "";

    if (!move || !anchorQuote.trim() || !reason.trim()) {
      return undefined;
    }

    return {
      move,
      anchorQuote,
      reason,
      ...(bridgeSuggestion.trim() ? { bridgeSuggestion } : {}),
    };
  }

  function cleanBaseEdits(edits: any[]) {
    if (!Array.isArray(edits)) return [];

    return edits
      .map((edit: any) => {
        const type =
          edit?.type === "structure_edit" ? "structure_edit" : "line_edit";

        const baseEdit: any = {
          type,
          quote: typeof edit?.quote === "string" ? edit.quote : "",
          issue: typeof edit?.issue === "string" ? edit.issue : "",
          impactLevel:
            edit?.impactLevel === "low" ||
            edit?.impactLevel === "medium" ||
            edit?.impactLevel === "high"
              ? edit.impactLevel
              : "medium",
          suggestion:
            typeof edit?.suggestion === "string" ? edit.suggestion : "",
        };

        if (type === "structure_edit") {
          const action =
            edit?.action === "cut" || edit?.action === "move"
              ? edit.action
              : undefined;

          if (action) {
            baseEdit.action = action;
          }

          if (action === "move") {
            const placement = cleanPlacement(edit?.placement);

            if (placement) {
              baseEdit.placement = placement;
            }
          }
        }

        return baseEdit;
      })
      .filter((edit: any) => {
        if (!edit.quote.trim() || !edit.issue.trim()) return false;

        if (edit.type === "structure_edit") {
          if (edit.action !== "cut" && edit.action !== "move") {
            return false;
          }

          if (edit.action === "move" && !edit.placement) {
            return false;
          }
        }

        return true;
      });
  }

  async function handleEvaluate(text: string, key: SectionKey) {
    if (!analysisId) {
      console.error("❌ Missing analysisId");
      return;
    }

    setLoadingEval(key);

    const idx = SECTION_KEYS.indexOf(key);

    const previous = SECTION_KEYS.slice(0, idx)
      .map((k) => sections[k]?.text || "")
      .join("\n\n");

    const next = SECTION_KEYS.slice(idx + 1)
      .map((k) => sections[k]?.text || "")
      .join("\n\n");

    try {
      const evaluatePayload = {
        section: key,
        text,
        previous,
        next,
        context,
        scriptEvaluation,
      };

      // ─────────────────────────────────────
      // API 1 — Detect issues only
      // Can return:
      // - decision summary
      // - line_edit
      // - structure_edit with placement
      // ─────────────────────────────────────

      const evalRes = await fetch("/api/evaluate-section", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(evaluatePayload),
      });

      const evalJson = await evalRes.json();

      if (!evalRes.ok) {
        console.error("❌ Evaluate API response:", evalJson);
        throw new Error(evalJson?.error || "Evaluate API failed");
      }

      const evalSummary = {
        verdict:
          typeof evalJson.result?.verdict === "string"
            ? evalJson.result.verdict
            : "",
        mainProblem:
          typeof evalJson.result?.mainProblem === "string"
            ? evalJson.result.mainProblem
            : "",
        highestROIEdit:
          typeof evalJson.result?.highestROIEdit === "string"
            ? evalJson.result.highestROIEdit
            : "",
      };

      const baseEdits = cleanBaseEdits(evalJson.result?.edits ?? []);

      const lineEdits = baseEdits.filter(
        (edit: any) => edit.type !== "structure_edit"
      );

      const structureEdits = baseEdits.filter(
        (edit: any) => edit.type === "structure_edit"
      );

      let finalResult = {
        ...evalSummary,
        edits: baseEdits,
      };

      // ─────────────────────────────────────
      // API 2 — Generate rewriteOptions only for line_edit
      // structure_edit does NOT go to rewrite API.
      // ─────────────────────────────────────

      if (lineEdits.length > 0) {
        try {
          const optionsRes = await fetch("/api/generate-rewrite-options", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              section: key,
              text,
              previous,
              edits: lineEdits,
            }),
          });

          const optionsJson = await optionsRes.json();

          if (!optionsRes.ok) {
            console.error("❌ Rewrite options API response:", optionsJson);

            finalResult = {
              ...evalSummary,
              edits: [...lineEdits, ...structureEdits],
            };
          } else {
            const enrichedLineEdits = Array.isArray(optionsJson.result?.edits)
              ? optionsJson.result.edits.map((edit: any) => ({
                  ...edit,
                  type: "line_edit",
                }))
              : lineEdits;

            finalResult = {
              ...evalSummary,
              edits: [...enrichedLineEdits, ...structureEdits],
            };
          }
        } catch (rewriteError) {
          console.error("❌ Rewrite options error:", rewriteError);

          finalResult = {
            ...evalSummary,
            edits: [...lineEdits, ...structureEdits],
          };
        }
      }

      // ─────────────────────────────────────
      // UPDATE LOCAL STATE
      // ─────────────────────────────────────

      const nextEvaluations = {
        ...(evaluations ?? {}),
        [key]: finalResult,
      };

      setEvaluations(nextEvaluations);

      // ─────────────────────────────────────
      // SAVE TO SUPABASE
      // ─────────────────────────────────────

      const { error } = await supabase
        .from("analyses")
        .update({
          evaluations: nextEvaluations,
        })
        .eq("id", analysisId);

      if (error) {
        console.error("❌ Save evaluation error:", error);
      }
    } catch (e) {
      console.error("❌ Evaluate error:", e);
    } finally {
      setLoadingEval(null);
    }
  }

  async function handleEvaluateScript() {
    if (!analysisId) {
      console.error("❌ Missing analysisId");
      return;
    }

    setLoadingScriptEval(true);

    try {
      const res = await fetch("/api/evaluate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sections,
          analysisId,
          context,
        }),
      });

      if (!res.ok) {
        throw new Error("Evaluate script API failed");
      }

      const json = await res.json();

      const result = json.result;

      setScriptEvaluation(result);

      const { error } = await supabase
        .from("analyses")
        .update({
          script_evaluation: result,
        })
        .eq("id", analysisId);

      if (error) {
        console.error("❌ Save script evaluations error:", error);
      }
    } catch (e) {
      console.error("❌ Evaluate script error:", e);
    } finally {
      setLoadingScriptEval(false);
    }
  }

  async function applyRewrite() {
    if (!editing) return;

    const section = editing.section;

    const finalRewrite = editedText;

    const originalText = localSections[section].text;

    const updatedText = originalText.replaceAll(
      editing.original,
      finalRewrite
    );

    const newSections = {
      ...localSections,
      [section]: {
        ...localSections[section],
        text: updatedText,
        wordCount: updatedText
          ? updatedText.split(/\s+/).filter(Boolean).length
          : 0,
      },
    };

    setLocalSections(newSections);

    localStorage.setItem(SESSION_KEY, JSON.stringify(newSections));

    const newEval = structuredClone(evaluations);

    if (newEval?.[section]?.edits) {
      newEval[section].edits = newEval[section].edits.filter(
        (e: any) => e.quote !== editing.original
      );
    }

    setEvaluations(newEval);

    if (analysisId) {
      const { error } = await supabase
        .from("analyses")
        .update({
          evaluations: newEval,
          generated_script: {
            ...data,
            sections: newSections,
          },
        })
        .eq("id", analysisId);

      if (error) {
        console.error("❌ Save rewrite error:", error);
      }
    }

    setEditing(null);
    setSelectedRewrite(null);
    setEditedText("");
  }

  async function applyManualEdit() {
    if (!manualEditing) return;

    const { section } = manualEditing;

    const finalText = manualText.trim();

    const newSections = {
      ...localSections,
      [section]: {
        ...localSections[section],
        text: finalText,
        wordCount: finalText
          ? finalText.split(/\s+/).filter(Boolean).length
          : 0,
      },
    };

    setLocalSections(newSections);

    localStorage.setItem(SESSION_KEY, JSON.stringify(newSections));

    if (analysisId) {
      const { error } = await supabase
        .from("analyses")
        .update({
          generated_script: {
            ...data,
            sections: newSections,
          },
        })
        .eq("id", analysisId);

      if (error) {
        console.error("❌ Save manual edit error:", error);
      }
    }

    setManualEditing(null);
    setManualText("");
  }

  const CopyButton = ({ text, id }: any) => {
    const isCopied = copiedKey === id;

    return (
      <button
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopiedKey(id);

          setTimeout(() => {
            setCopiedKey(null);
          }, 1500);
        }}
        className={`px-3 py-1.5 rounded-lg text-xs border transition-all
          ${
            isCopied
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
              : "bg-[#111] text-[#666] border-[#222] hover:text-white hover:border-[#444]"
          }`}
      >
        {isCopied ? "Copied ✓" : "Copy"}
      </button>
    );
  };

  const EvalButton = ({ text, id }: any) => {
    const loading = loadingEval === id;

    return (
      <button
        onClick={() => handleEvaluate(text, id)}
        disabled={loading}
        className="px-3 py-1.5 rounded-lg text-xs border bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 transition-all disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "✨ Analyze"}
      </button>
    );
  };

  function HighlightText({ text, evalData, section }: any) {
    const edits = Array.isArray(evalData?.edits) ? evalData.edits : [];

    if (!edits.length) {
      return <>{text}</>;
    }

    const matches = edits
      .map((edit: any, idx: number) => {
        if (!edit?.quote) return null;

        const start = text.indexOf(edit.quote);

        if (start === -1) return null;

        return {
          idx,
          edit,
          start,
          end: start + edit.quote.length,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.start - b.start);

    if (!matches.length) {
      return <>{text}</>;
    }

    const parts: React.ReactNode[] = [];
    let cursor = 0;

    matches.forEach((match: any) => {
      if (match.start < cursor) return;

      if (match.start > cursor) {
        parts.push(
          <span key={`text-${cursor}`}>
            {text.slice(cursor, match.start)}
          </span>
        );
      }

      const isStructureEdit = match.edit?.type === "structure_edit";

      parts.push(
        <span
          key={`edit-${match.idx}-${match.start}`}
          onClick={() => {
            setEditing({
              section,
              original: match.edit.quote,
              editMeta: match.edit,
            });

            setEditedText(match.edit.quote);
          }}
          className={`underline cursor-pointer transition
            ${
              isStructureEdit
                ? "bg-purple-500/10 decoration-purple-500/70 hover:bg-purple-500/20"
                : "bg-yellow-500/10 decoration-yellow-500/60 hover:bg-yellow-500/20"
            }`}
        >
          {match.edit.quote}
        </span>
      );

      cursor = match.end;
    });

    if (cursor < text.length) {
      parts.push(
        <span key={`text-${cursor}`}>{text.slice(cursor)}</span>
      );
    }

    return <>{parts}</>;
  }

  const renderSection = (key: SectionKey) => {
    const content = sections[key];
    const evalData = evaluations[key];

    if (!content?.text) return null;

    return (
      <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-4">
        <div className="flex justify-between mb-2">
          <h3 className="text-white text-sm">{key}</h3>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setManualEditing({ section: key, text: content.text });
                setManualText(content.text);
              }}
              className="px-3 py-1.5 rounded-lg text-xs border bg-[#111] text-[#666] border-[#222] hover:text-white hover:border-[#444] transition-all"
            >
              Edit
            </button>

            <CopyButton text={content.text} id={key} />
            <EvalButton text={content.text} id={key} />
          </div>
        </div>

        {evalData?.verdict && (
          <div className="mb-3 rounded-lg border border-[#222] bg-black/30 p-3 text-xs space-y-1">
            <div className="text-[#aaa]">
              <span className="text-blue-400">Verdict:</span>{" "}
              {evalData.verdict}
            </div>

            {evalData.mainProblem && (
              <div className="text-[#aaa]">
                <span className="text-red-400">Main:</span>{" "}
                {evalData.mainProblem}
              </div>
            )}

            {evalData.highestROIEdit && (
              <div className="text-[#aaa]">
                <span className="text-green-400">Fix first:</span>{" "}
                {evalData.highestROIEdit}
              </div>
            )}
          </div>
        )}

        <p className="text-[#ccc] text-sm whitespace-pre-line">
          <HighlightText
            text={content.text}
            evalData={evalData}
            section={key}
          />
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between">
        <h2 className="text-white text-xl">Generated Script</h2>
        <h2 className="text-white text-xl"><span className="text-purple-500">Total Words: </span>{totalWords}</h2>

        <span className="text-xs text-[#555]">{status}</span>
      </div>

      <button
        onClick={handleEvaluateScript}
        disabled={loadingScriptEval}
        className="px-3 py-1.5 rounded-lg text-xs border bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 transition-all disabled:opacity-50"
      >
        {loadingScriptEval ? "Analyzing Script..." : "✨ Analyze Full Script"}
      </button>

      {/* {scriptEvaluation && (
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-4 space-y-6">
          <div className="flex gap-6 text-xs">
            <div className="text-[#888]">
              Pass:
              <span className="text-white ml-2">
                {scriptEvaluation.summary.passCount}
              </span>
            </div>

            <div className="text-[#888]">
              Flags:
              <span className="text-white ml-2">
                {scriptEvaluation.summary.flagCount}
              </span>
            </div>

            <div className="text-[#888]">
              Critical:
              <span
                className={`ml-2 ${
                  scriptEvaluation.summary.critical
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {scriptEvaluation.summary.critical ? "YES" : "NO"}
              </span>
            </div>
          </div>

          {scriptEvaluation.motifFlags?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm text-white">Motif Repetition</h3>

              {scriptEvaluation.motifFlags.map((m, i) => (
                <div
                  key={i}
                  className="border border-[#222] rounded-lg p-3 text-xs"
                >
                  <div className="flex justify-between">
                    <span className="text-[#ccc]">
                      &ldquo;{m.motif}&rdquo;
                    </span>

                    <span
                      className={
                        m.verdict === "overused"
                          ? "text-red-400"
                          : "text-green-400"
                      }
                    >
                      {m.count} uses
                    </span>
                  </div>

                  <div className="mt-2 space-y-1">
                    {m.appearances.map((a, idx) => (
                      <div key={idx} className="text-[#666]">
                        {a.section} → &quot;{a.quote}&quot;
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {scriptEvaluation.tensionCurve?.filter((t) => t.issue).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm text-white">Tension Curve</h3>

              {scriptEvaluation.tensionCurve
                .filter((t) => t.issue)
                .map((t, i) => (
                  <div
                    key={i}
                    className="border border-[#222] rounded-lg p-3 text-xs text-[#ccc]"
                  >
                    <span className="text-red-400 capitalize">
                      {t.section}
                    </span>

                    &ldquo;{t.issue}&rdquo;
                  </div>
                ))}
            </div>
          )}

          {scriptEvaluation.anchorOveruse?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm text-white">Anchor Overuse</h3>

              {scriptEvaluation.anchorOveruse.map((a, i) => (
                <div
                  key={i}
                  className="border border-[#222] rounded-lg p-3 text-xs"
                >
                  <div className="flex justify-between">
                    <span className="text-[#ccc]">{a.detail}</span>

                    <span
                      className={
                        a.verdict === "overused"
                          ? "text-red-400"
                          : "text-green-400"
                      }
                    >
                      {a.verdict}
                    </span>
                  </div>

                  <div className="text-[#666] mt-2">
                    {a.sections.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          )}

          {scriptEvaluation.conclusiveEndings?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm text-white">Conclusive Endings</h3>

              {scriptEvaluation.conclusiveEndings.map((c, i) => (
                <div
                  key={i}
                  className="border border-[#222] rounded-lg p-3 text-xs"
                >
                  <div className="text-red-400 capitalize">{c.section}</div>

                  <div className="text-[#ccc] mt-1">
                    &ldquo;{c.quote}&rdquo;
                  </div>

                  <div className="text-[#666] mt-2">
                    &ldquo;{c.issue}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          )}

          {scriptEvaluation.sectionContractFlags?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm text-white">Section Contract</h3>

              {scriptEvaluation.sectionContractFlags.map((f, i) => (
                <div
                  key={i}
                  className="border border-[#222] rounded-lg p-3 text-xs"
                >
                  <div className="text-red-400 capitalize">{f.section}</div>

                  <div className="text-[#ccc] mt-1">
                    &ldquo;{f.quote}&rdquo;
                  </div>

                  <div className="text-[#666] mt-2">
                    &ldquo;{f.issue}&rdquo;
                  </div>

                  {f.advice && (
                    <div className="text-[#888] mt-2">{f.advice}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )} */}

      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111] p-4 rounded-lg w-[600px] max-h-[85vh] overflow-y-auto space-y-4">
            <h3 className="text-white text-sm">
              {editing.editMeta?.type === "structure_edit"
                ? "Structural Suggestion"
                : "Edit Fragment"}
            </h3>

            <div className="text-xs text-[#888]">
              <p className="text-[#aaa] mb-1">
                {editing.editMeta?.type === "structure_edit"
                  ? "Selected block"
                  : "Original"}
              </p>

              <p className="bg-black p-2 rounded text-[#ccc] whitespace-pre-line">
                {editing.original}
              </p>
            </div>

            {editing.editMeta && (
              <div className="text-xs space-y-2 border border-[#222] rounded p-3 bg-[#0a0a0a]">
                <div>
                  <span className="text-red-400">Issue:</span>

                  <p className="text-[#ccc]">{editing.editMeta.issue}</p>
                </div>

                <div>
                  <span className="text-yellow-400">Impact:</span>

                  <p className="text-[#ccc] capitalize">
                    {editing.editMeta.impactLevel}
                  </p>
                </div>

                <div>
                  <span className="text-blue-400">Suggestion:</span>

                  <p className="text-[#ccc]">{editing.editMeta.suggestion}</p>
                </div>
              </div>
            )}

            {editing.editMeta?.type === "structure_edit" &&
              editing.editMeta?.placement && (
                <div className="text-xs space-y-3 border border-purple-500/30 rounded p-3 bg-purple-500/5">
                  <div className="text-purple-400">Structural placement</div>

                  <div>
                    <span className="text-[#888]">Move:</span>

                    <p className="text-[#ccc] capitalize">
                      {editing.editMeta.placement.move}
                    </p>
                  </div>

                  <div>
                    <span className="text-[#888]">
                      Anchor sentence / block:
                    </span>

                    <p className="bg-black p-2 rounded text-[#ccc] mt-1 whitespace-pre-line">
                      {editing.editMeta.placement.anchorQuote}
                    </p>
                  </div>

                  <div>
                    <span className="text-[#888]">Why this placement:</span>

                    <p className="text-[#ccc]">
                      {editing.editMeta.placement.reason}
                    </p>
                  </div>

                  {editing.editMeta.placement.bridgeSuggestion && (
                    <div>
                      <span className="text-[#888]">Bridge suggestion:</span>

                      <p className="text-[#ccc]">
                        {editing.editMeta.placement.bridgeSuggestion}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setManualEditing({
                        section: editing.section,
                        text: localSections[editing.section].text,
                      });
                      setManualText(localSections[editing.section].text);
                      setEditing(null);
                      setSelectedRewrite(null);
                      setEditedText("");
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs border bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20 transition-all"
                  >
                    Open manual edit
                  </button>
                </div>
              )}

            {editing.editMeta?.type !== "structure_edit" && (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-32 bg-black text-white p-2 text-sm"
              />
            )}

            {editing.editMeta?.type !== "structure_edit" &&
              Array.isArray(editing?.editMeta?.rewriteOptions) &&
              editing.editMeta.rewriteOptions.length > 0 && (
                <div className="space-y-2 border-t border-[#222] pt-3">
                  <p className="text-purple-400 text-xs">Choose version</p>

                  {editing.editMeta.rewriteOptions.map(
                    (v: any, idx: number) => (
                      <div
                        key={`${v.text}-${idx}`}
                        onClick={() => {
                          setSelectedRewrite(v.text);
                          setEditedText(v.text);
                        }}
                        className={`p-2 rounded cursor-pointer border text-xs
                      ${
                        selectedRewrite === v.text
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-[#222]"
                      }`}
                      >
                        <p className="text-[#ccc]">{v.text}</p>

                        <p className="text-[#666] mt-1">
                          score: {v.score} — {v.reason}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditing(null);
                  setEditedText("");
                  setSelectedRewrite(null);
                }}
              >
                Cancel
              </button>

              {editing.editMeta?.type !== "structure_edit" && (
                <button onClick={applyRewrite} className="text-green-400">
                  Apply Selected
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {manualEditing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111] p-4 rounded-lg w-[600px] max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-white text-sm capitalize">
                Edit — {manualEditing.section}
              </h3>

              <span className="text-[#555] text-xs">
                {manualText.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="w-full h-64 bg-black text-white p-2 text-sm border border-[#222] focus:outline-none focus:border-[#444] resize-none"
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setManualEditing(null);
                  setManualText("");
                }}
              >
                Cancel
              </button>

              <button
                disabled={!manualText.trim()}
                onClick={applyManualEdit}
                className="text-green-400 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">{SECTION_KEYS.map(renderSection)}</div>
    </div>
  );
}