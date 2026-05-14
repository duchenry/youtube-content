  "use client";

  import { useState, useEffect } from "react";
  import {
    EvaluationEdit,
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

    const [rewriteOptions, setRewriteOptions] = useState<any[]>([]);

    const [selectedRewrite, setSelectedRewrite] = useState<string | null>(null);

    const [editing, setEditing] = useState<{
      section: SectionKey;
      original: string;
      editMeta?: any;
      rewriteOptions?: any[];
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
        setup: { text: "", wordCount: 0 },
        contradiction: { text: "", wordCount: 0 },
        reframe: { text: "", wordCount: 0 },
        solution: { text: "", wordCount: 0 },
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
          setScriptEvaluation(null)
        }
      }

      loadEvaluations();
    }, [analysisId]);

    if (!data) return null;

    const { status, context } = data as any;

    const sections = localSections;

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
        const res = await fetch("/api/evaluate-section", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
          section: key,
          text,
          previous,
          next,
          context,
          scriptEvaluation,
        }),
        });

        if (!res.ok) {
          throw new Error("Evaluate API failed");
        }

        const json = await res.json();

        const result = json.result;

        const nextEvaluations = {
          ...(evaluations ?? {}),
          [key]: result,
        };

        setEvaluations(nextEvaluations);

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
      }

      setLoadingEval(null);
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
      }

      setLoadingScriptEval(false);
    }

    // async function handleRewrite(editMeta: EvaluationEdit) {
    //   if (!editing) return;

    //   const sectionText = localSections[editing.section]?.text;

    //   if (!sectionText) return;

    //   const res = await fetch("/api/rewrite-fragment", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       fullSection: sectionText,
    //       targetQuote: editMeta.quote,
    //       issue: editMeta.issue,
    //       impactLevel: editMeta.impactLevel,
    //       suggestion: editMeta.suggestion,
    //       rewriteHint: editMeta.rewriteHint,
    //       context,
    //     }),
    //   });

    //   const json = await res.json();

    //   setRewriteOptions(json.versions ?? []);
    //   setSelectedRewrite(null);
    // }
async function applyRewrite() {
  if (!editing) return;

  const section = editing.section;

  const finalRewrite = editedText; // KHÔNG trim

  const originalText = localSections[section].text;

  // replace an toàn hơn (chỉ replace 1 lần, tránh mutate string nhiều match)
  const updatedText = originalText.replaceAll(
    editing.original,
    finalRewrite
  );

  const newSections = {
    ...localSections,
    [section]: {
      ...localSections[section],
      text: updatedText,
    },
  };

  setLocalSections(newSections);

  localStorage.setItem(SESSION_KEY, JSON.stringify(newSections));

  // clone sâu để tránh mutation bug
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
  setRewriteOptions([]);
  setSelectedRewrite(null);
  setEditedText("");
}

    async function applyManualEdit() {
  if (!manualEditing) return;

  const { section } = manualEditing;

  // cho phép rỗng, nhưng vẫn normalize
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
      if (!evalData?.edits) {
        return <>{text}</>;
      }

      let processed = text;

      evalData.edits.forEach((e: any, idx: number) => {
        if (!e.quote) return;

        processed = processed.replace(e.quote, `[[${idx}::${e.quote}]]`);
      });

      return (
        <>
          {processed.split(/\[\[(.*?)\]\]/g).map((chunk: any, i: number) => {
            if (i % 2 === 1) {
              const [idx, content] = chunk.split("::");

              const meta = evalData.edits[Number(idx)];

              return (
                <span
                  key={i}
                  onClick={() => {
                    setEditing({
                      section,
                      original: content,
                      editMeta: meta,
                    });

                    setEditedText(content);
                  }}
                  className="bg-yellow-500/10 underline decoration-yellow-500/60 cursor-pointer hover:bg-yellow-500/20 transition"
                >
                  {content}
                </span>
              );
            }

            return <span key={i}>{chunk}</span>;
          })}
        </>
      );
    }

    const renderSection = (key: SectionKey) => {
      const content = sections[key];

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

          <p className="text-[#ccc] text-sm whitespace-pre-line">
            <HighlightText
              text={content.text}
              evalData={evaluations[key]}
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

          <span className="text-xs text-[#555]">{status}</span>
        </div>

        {/* KEEP UI — ONLY ADD BUTTON */}
        <button
          onClick={handleEvaluateScript}
          disabled={loadingScriptEval}
          className="px-3 py-1.5 rounded-lg text-xs border bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 transition-all disabled:opacity-50"
        >
          {loadingScriptEval
            ? "Analyzing Script..."
            : "✨ Analyze Full Script"}
        </button>

        {/* NEW PANEL */}
        {scriptEvaluation && (
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
                <h3 className="text-sm text-white">
                  Motif Repetition
                </h3>

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

            {scriptEvaluation.tensionCurve?.filter((t) => t.issue)
              .length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm text-white">
                  Tension Curve
                </h3>

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
                <h3 className="text-sm text-white">
                  Anchor Overuse
                </h3>

                {scriptEvaluation.anchorOveruse.map((a, i) => (
                  <div
                    key={i}
                    className="border border-[#222] rounded-lg p-3 text-xs"
                  >
                    <div className="flex justify-between">
                      <span className="text-[#ccc]">
                        {a.detail}
                      </span>

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
                <h3 className="text-sm text-white">
                  Conclusive Endings
                </h3>

                {scriptEvaluation.conclusiveEndings.map((c, i) => (
                  <div
                    key={i}
                    className="border border-[#222] rounded-lg p-3 text-xs"
                  >
                    <div className="text-red-400 capitalize">
                      {c.section}
                    </div>

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
          </div>
        )}

        {/* EXISTING UI UNCHANGED */}
        {editing && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#111] p-4 rounded-lg w-[600px] max-h-[85vh] overflow-y-auto space-y-4">
              <h3 className="text-white text-sm">Edit Fragment</h3>

              <div className="text-xs text-[#888]">
                <p className="text-[#aaa] mb-1">Original</p>

                <p className="bg-black p-2 rounded text-[#ccc]">
                  {editing.original}
                </p>
              </div>

              {editing.editMeta && (
                <div className="text-xs space-y-2 border border-[#222] rounded p-3 bg-[#0a0a0a]">
                  <div>
                    <span className="text-red-400">Issue:</span>

                    <p className="text-[#ccc]">
                      {editing.editMeta.issue}
                    </p>
                  </div>

                  <div>
                    <span className="text-yellow-400">Impact:</span>

                    <p className="text-[#ccc] capitalize">
                      {editing.editMeta.impactLevel}
                    </p>
                  </div>

                  <div>
                    <span className="text-blue-400">Suggestion:</span>

                    <p className="text-[#ccc]">
                      {editing.editMeta.suggestion}
                    </p>
                  </div>
                </div>
              )}

              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-32 bg-black text-white p-2 text-sm"
              />

              {editing?.editMeta?.rewriteOptions?.length > 0 && (
                <div className="space-y-2 border-t border-[#222] pt-3">
                  <p className="text-purple-400 text-xs">
                    Choose version
                  </p>

                  {editing?.editMeta?.rewriteOptions?.map((v: any) => (
                    <div
                      key={v.id}
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
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditing(null);
                    setEditedText("");
                    setRewriteOptions([]);
                    setSelectedRewrite(null);
                  }}
                >
                  Cancel
                </button>

                {/* <button
                  onClick={() => handleRewrite(editing?.editMeta)}
                  className="text-blue-400"
                >
                  Rewrite with AI
                </button> */}

                <button
                  // disabled={!editedText.trim()}
                  onClick={applyRewrite}
                  className="text-green-400"
                >
                  Apply Selected
                </button>
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

        <div className="grid gap-4">
          {SECTION_KEYS.map(renderSection)}
        </div>
      </div>
    );
  }