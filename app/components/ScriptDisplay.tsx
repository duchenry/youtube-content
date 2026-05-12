"use client";

import { useState, useEffect } from "react";
import {
  EvaluationEdit,
  SECTION_KEYS,
  SectionKey,
  type GeneratedScript,
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

  const [evaluations, setEvaluations] = useState<
    Partial<Record<SectionKey, any>>
  >({});

  const [loadingEval, setLoadingEval] = useState<SectionKey | null>(null);

  const [rewriteOptions, setRewriteOptions] = useState<any[]>([]);

  const [selectedRewrite, setSelectedRewrite] = useState<string | null>(null);

  const [editing, setEditing] = useState<{
    section: SectionKey;
    original: string;
    editMeta?: any;
  } | null>(null);

  const [editedText, setEditedText] = useState("");

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
        .select("evaluations")
        .eq("id", analysisId)
        .single();

      if (error) {
        console.error("❌ Load evaluations error:", error);
        return;
      }

      if (row?.evaluations) {
        setEvaluations(row.evaluations);
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

  async function handleRewrite(editMeta: EvaluationEdit) {
    if (!editing) return;

    const sectionText = localSections[editing.section]?.text;

    if (!sectionText) return;

    const res = await fetch("/api/rewrite-fragment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullSection: sectionText,
        targetQuote: editMeta.quote,
        issue: editMeta.issue,
        impactLevel: editMeta.impactLevel,
        suggestion: editMeta.suggestion,
        rewriteHint: editMeta.rewriteHint,
        context,
      }),
    });

    const json = await res.json();

    setRewriteOptions(json.versions ?? []);
    setSelectedRewrite(null);
  }

  async function applyRewrite() {
    if (!editing || !selectedRewrite) return;

    const section = editing.section;

    const updatedText = localSections[section].text.replace(
      editing.original,
      selectedRewrite
    );

    const newSections = {
      ...localSections,
      [section]: {
        ...localSections[section],
        text: updatedText,
      },
    };

    setLocalSections(newSections);

    const newEval = { ...evaluations };

    delete newEval[section];

    setEvaluations(newEval);

    await supabase
      .from("analyses")
      .update({
        evaluations: newEval,
      })
      .eq("id", analysisId);

    setEditing(null);
    setRewriteOptions([]);
    setSelectedRewrite(null);
    setEditedText("");
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

            {rewriteOptions.length > 0 && (
              <div className="space-y-2 border-t border-[#222] pt-3">
                <p className="text-purple-400 text-xs">
                  Choose version
                </p>

                {rewriteOptions.map((v: any) => (
                  <div
                    key={v.id}
                    onClick={() => setSelectedRewrite(v.text)}
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

              <button
                onClick={() => handleRewrite(editing?.editMeta)}
                className="text-blue-400"
              >
                Rewrite with AI
              </button>

              <button
                disabled={!selectedRewrite}
                onClick={applyRewrite}
                className="text-green-400"
              >
                Apply Selected
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