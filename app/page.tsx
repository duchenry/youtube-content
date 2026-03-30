"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnalysisResult } from "@/app/lib/types";
import { AnalysisDisplay } from "@/app/components/AnalysisDisplay";
import { LoadingSkeleton } from "@/app/components/LoadingSkeleton";
import { HistorySidebar } from "@/app/components/HistorySidebar";
import { useHistory, HistoryEntry } from "@/app/lib/useHistory";
import { textToSlug } from "./lib/utils";

const SCRIPT_PLACEHOLDER = `Paste your YouTube script here...

Example:
"Most people think success is about working harder. They're wrong. I spent 3 years grinding 16-hour days and got nowhere. Then I discovered the one thing nobody talks about..."`;

const COMMENTS_PLACEHOLDER = `Paste viewer comments here (optional)...

Example:
"This changed my perspective completely"
"I've been doing this wrong my whole life"
"Finally someone said it"`;

export default function Home() {
  const [script, setScript] = useState("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function handleDraftContent() {
    if (!slug) return;
    
    setDraftLoading(true);
    try {
      // Call the API to generate/prep the draft
      console.log("encodeURIComponent(slug)", encodeURIComponent(slug))
      const res = await fetch(`/api/draft?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error('Failed to prepare draft');
      
      // Navigate to the content page
      router.push(`/content/${slug}`);
    } catch (err) {
      console.error('Draft preparation failed:', err);
      // Still navigate even if API fails, the page will handle it
      router.push(`/content/${slug}`);
    } finally {
      setDraftLoading(false);
    }
  }

  const slug = useMemo(() => {
    if (!result) return "";
    const base = result.coreInsight?.summary || script.slice(0, 80) || "draft-script";
    const normalized = textToSlug(base);
    return normalized || `draft-${Date.now()}`;
  }, [result, script]);

  const { history, loading: historyLoading, saveAnalysis, deleteAnalysis } =
    useHistory();

  const charCount = script.length;
  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;

  async function handleAnalyze() {
    if (!script.trim() || script.trim().length < 50) {
      setError("Please paste a script with at least 50 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    setSaveError(null);
    setResult(null);
    setActiveId(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, comments }),
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Something went wrong.");

      const analysisResult: AnalysisResult = json.result;
      setResult(analysisResult);

      // Auto-save to Supabase
      setSaving(true);
      const savedId = await saveAnalysis(script, comments, analysisResult);
      if (savedId) {
        setActiveId(savedId);
      } else {
        setSaveError("Analysis complete, but failed to save to history.");
      }
      setSaving(false);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectHistory(entry: HistoryEntry) {
    setResult(entry.result);
    setActiveId(entry.id);
    setScript(entry.script_preview);
    setComments(entry.comments || "");
    setError(null);
    setSaveError(null);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handleNew() {
    setScript("");
    setComments("");
    setResult(null);
    setActiveId(null);
    setError(null);
    setSaveError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    await deleteAnalysis(id);
    if (activeId === id) handleNew();
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* ── Sidebar ── */}
      <HistorySidebar
        history={history}
        loading={historyLoading}
        activeId={activeId}
        onSelect={handleSelectHistory}
        onDelete={handleDelete}
        onNew={handleNew}
      />

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-x-hidden">
        {/* Top bar */}
        <header className="border-b border-[#1a1a1a] sticky top-0 z-40 backdrop-blur-md bg-[#0a0a0a]/90">
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {saving && (
                  <span className="flex items-center gap-1.5 text-[#555] text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Saving to Supabase...
                  </span>
                )}
                {activeId && !saving && (
                  <span className="flex items-center gap-1.5 text-[#555] text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Saved
                  </span>
                )}
              </div>
              <Link
                href="/reddit-idea"
                className="text-[#555] hover:text-[#ff2d20] text-sm transition-colors font-semibold"
              >
                🔗 Reddit Ideas
              </Link>
            </div>
            {result && (
              <button
                onClick={handleNew}
                className="text-[#555] hover:text-[#aaa] text-sm transition-colors"
              >
                ← New analysis
              </button>
            )}
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* ── Hero ── */}
          {!result && (
            <div className="text-center mb-10">
              <h1 className="font-display text-5xl md:text-6xl tracking-wider text-white mb-3">
                REVERSE-ENGINEER
                <br />
                <span className="gradient-text">VIRAL SCRIPTS</span>
              </h1>
              <p className="text-[#555] text-sm max-w-md mx-auto leading-relaxed">
                Paste any YouTube script. Get a deep strategic breakdown across
                16 sections. Every analysis is automatically saved to your history.
              </p>
            </div>
          )}

          {/* ── Input Form ── */}
          {!result && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white text-sm font-semibold flex items-center gap-1.5">
                    <span className="text-[#ff2d20]">*</span>
                    YouTube Script
                    <span className="tag-pill bg-[#1a1a1a] text-[#555] normal-case font-normal ml-1">
                      required
                    </span>
                  </label>
                  <span className="text-[#444] text-xs font-mono">
                    {wordCount.toLocaleString()}w · {charCount.toLocaleString()}c
                  </span>
                </div>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder={SCRIPT_PLACEHOLDER}
                  rows={12}
                  className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl px-4 py-3
                             text-[#ccc] text-sm placeholder:text-[#2a2a2a] resize-y
                             transition-all focus:border-[#ff2d20]/40 font-body leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white text-sm font-semibold flex items-center gap-1.5">
                    Viewer Comments
                    <span className="tag-pill bg-[#1a1a1a] text-[#444] normal-case font-normal ml-1">
                      optional
                    </span>
                  </label>
                </div>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={COMMENTS_PLACEHOLDER}
                  rows={5}
                  className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl px-4 py-3
                             text-[#ccc] text-sm placeholder:text-[#2a2a2a] resize-y
                             transition-all focus:border-[#ff2d20]/40 font-body leading-relaxed"
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-900/40 rounded-xl px-4 py-3 text-red-400 text-sm flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loading || !script.trim()}
                className="w-full py-4 rounded-xl font-display text-xl tracking-widest text-white
                           bg-gradient-to-r from-[#ff2d20] to-[#ff6b35]
                           hover:opacity-90 active:scale-[0.99]
                           disabled:opacity-40 disabled:cursor-not-allowed
                           transition-all duration-200 shadow-lg shadow-[#ff2d20]/20"
              >
                {loading ? "ANALYZING..." : "ANALYZE SCRIPT →"}
              </button>

              <p className="text-center text-[#333] text-xs">
                GPT-4o-mini · 16 sections · Auto-saved to Supabase
              </p>
            </div>
          )}

          {loading && <LoadingSkeleton />}

          {result && !loading && (
            <div ref={resultsRef}>
              {saveError && (
                <div className="mb-4 bg-yellow-900/20 border border-yellow-900/40 rounded-xl px-4 py-2.5 text-yellow-400 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{saveError}</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <div className="flex-1"></div>
                <div>
                  <h2 className="font-display text-3xl tracking-wider gradient-text">
                    ANALYSIS COMPLETE
                  </h2>
                  <p className="text-[#444] text-sm mt-0.5">
                    16 sections · {wordCount.toLocaleString()} words
                    {activeId && (
                      <span className="text-emerald-600 ml-2">· ✓ Saved</span>
                    )}
                  </p>
                </div>
                {/* <div className="flex-1 flex justify-end">
                  <button
                    onClick={handleDraftContent}
                    disabled={draftLoading}
                    className="px-6 py-3 bg-orange-500/10 border border-orange-500/30 rounded-xl
                               text-orange-400 hover:text-orange-300 hover:bg-orange-500/20
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all duration-200 font-semibold text-sm"
                  >
                    {draftLoading ? '📝 Preparing...' : '📝 Draft Content'}
                  </button>
                </div> */}
              </div>

              <AnalysisDisplay data={result} />
            </div>
          )}

          {error && !loading && !result && (
            <div className="mt-6 bg-red-900/20 border border-red-900/40 rounded-xl px-5 py-4">
              <p className="text-red-400 font-semibold mb-1">Analysis failed</p>
              <p className="text-[#666] text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-3 text-[#555] hover:text-white text-sm transition-colors"
              >
                ← Try again
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
