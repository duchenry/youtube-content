"use client";

import { useState, useRef, useEffect } from "react";
import type { AnalysisResult, ResearchDirective, StrategicSynthesis, GeneratedScript } from "@/app/lib/types";
import { AnalysisDisplay } from "./components/AnalysisDisplay";
import { ResearchDisplay } from "./components/ResearchDisplay";
import { SynthesisDisplay } from "./components/SynthesisDisplay";
import { ScriptDisplay } from "./components/ScriptDisplay";
import { StepBar } from "./components/StepBar";
import { LoadingSkeleton } from "@/app/components/LoadingSkeleton";
import { HistorySidebar } from "@/app/components/HistorySidebar";
import { useHistory, HistoryEntry } from "./lib/useHistory";
import { normalizeResearch, normalizeSynthesis } from "./lib/normalizers";
import { supabase } from "./lib/supabase";

const SCRIPT_PLACEHOLDER = `Paste your YouTube script here...

Example:
"Most people think success is about working harder. They're wrong. I spent 3 years grinding 16-hour days and got nowhere. Then I discovered the one thing nobody talks about..."`;

const SESSION_KEY = "yt-analyzer-session";

export default function Home() {
  const [script, setScript] = useState("");
  const [comments, setComments] = useState<string[]>(Array(30).fill(""));
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [partialSkeletonResult, setPartialSkeletonResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [research, setResearch] = useState<ResearchDirective | null>(null);
  const [synthesis, setSynthesis] = useState<StrategicSynthesis | null>(null);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [redditEntries, setRedditEntries] = useState<{ post: string; comments: string[] }[]>(
    [{ post: "", comments: [""] }]
  );
  const [authorInput, setAuthorInput] = useState({
    experiences: "",
    insight: "",
    loop: ""
  });
  const [stepLoading, setStepLoading] = useState(false);
  const [commentMode, setCommentMode] = useState<"individual" | "bulk">("individual");
  const [bulkComments, setBulkComments] = useState("");

  const { history, loading: historyLoading, saveAnalysis, updateAnalysis, deleteAnalysis, fetchHistory } =
    useHistory();

  // ── Restore session from localStorage on mount ──
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        if (s.script) setScript(s.script);
        if (s.comments) setComments(s.comments);
        if (s.step) setStep(s.step);
        if (s.result) setResult(s.result);
        if (s.research) setResearch(s.research);
        if (s.synthesis) setSynthesis(s.synthesis);
        if (s.generatedScript) setGeneratedScript(s.generatedScript);
        if (s.redditEntries) setRedditEntries(s.redditEntries);
        if (s.activeId) setActiveId(s.activeId);
      }
    } catch { /* corrupt data — ignore */ }
    setHydrated(true);
  }, []);

  // ── Persist session to localStorage on change ──
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        script, comments, step, result, research, synthesis, generatedScript, redditEntries, activeId,
      }));
    } catch { /* quota exceeded — ignore */ }
  }, [hydrated, script, comments, step, result, research, synthesis, generatedScript, redditEntries, activeId]);

  const charCount = script.length;
  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;

async function handleAnalyze() {
  if (!script.trim() || script.trim().length < 50) {
    setError("Please paste a script with at least 50 characters.");
    return;
  }

  setLoading(true);
  setLoadingMessage("Đang phân tích toàn bộ pipeline...");
  setError(null);
  setSaveError(null);
  setResult(null);
  setActiveId(null);

  try {
    // ✅ SINGLE API CALL ONLY
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        script,
        comments: comments.filter((c) => c.trim()),
      }),
    });

    const json = await res.json();

    if (!res.ok || json.error) {
      throw new Error(json.error || "Analysis failed.");
    }

    const finalResult: AnalysisResult = json.result;

    setResult(finalResult);

    // 💾 SAVE
    setSaving(true);

    const savedId = await saveAnalysis(script, comments, finalResult);

    if (savedId) {
      setActiveId(savedId);
    } else {
      setSaveError("Analysis complete, but failed to save to history.");
    }

    setSaving(false);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
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
    const commentsArray = entry.comments
      ? entry.comments.split("\n").filter((c: string) => c.trim()).slice(0, 30)
      : [];
    setComments([...commentsArray, ...Array(30 - commentsArray.length).fill("")]);
    setError(null); setSaveError(null);

    // Restore saved pipeline state
    const hasResearch = !!entry.research;
    const hasSynthesis = !!entry.synthesis;
    const hasGeneratedScript = !!entry.generated_script;
    setResearch(entry.research || null);
    setSynthesis(entry.synthesis || null);
    setGeneratedScript(entry.generated_script || null);

    // Parse reddit_raw back into structured entries if available
    if (entry.reddit_raw) {
      const entries: { post: string; comments: string[] }[] = [];
      const blocks = entry.reddit_raw.split(/===\s*POST\s+\d+\s*===/).filter(Boolean);
      for (const block of blocks) {
        const parts = block.split(/---\s*Comment\s+[\d.]+\s*---/);
        entries.push({ post: parts[0]?.trim() || "", comments: parts.slice(1).map(c => c.trim()).filter(Boolean) });
      }
      setRedditEntries(entries.length > 0 ? entries.map(e => ({ ...e, comments: e.comments.length > 0 ? e.comments : [""] })) : [{ post: "", comments: [""] }]);
    } else {
      setRedditEntries([{ post: "", comments: [""] }]);
    }

    setStep(hasGeneratedScript ? 4 : hasSynthesis ? 3 : hasResearch ? 2 : 1);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handleNew() {
    setScript(""); setComments(Array(30).fill(""));
    setResult(null); setActiveId(null);
    setError(null); setSaveError(null);
    setStep(1); setResearch(null); setSynthesis(null); setRedditEntries([{ post: "", comments: [""] }]);
    localStorage.removeItem(SESSION_KEY);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    await deleteAnalysis(id);
    if (activeId === id) handleNew();
  }
  
  async function handleStep2() {
    if (!result) return;
    setStepLoading(true); setError(null);
    try {
      console.log("[Step 2] activeId:", activeId);
      const res = await fetch("/api/research-guide", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction: result }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Step 2 failed");

      // ✅ ✅ ✅ LƯU VÀO DB NGAY BÂY GIỜ. KHÔNG CÒN THỨ GÌ GIỮA.
      if (activeId) {
        console.log("[Step 2] Saving research to DB...");
        const normalized = normalizeResearch(json.result);
        const { error: supabaseError } = await supabase
          .from("analyses")
          .update({ research: normalized })
          .eq("id", activeId);

        if (supabaseError) {
          console.error("[Step 2] Supabase Error:", supabaseError);
          setError(`Database error: ${supabaseError.message}`);
        } else {
          console.log("[Step 2] ✅ RESEARCH SAVED TO DATABASE SUCCESSFULLY");
        }
        
        // Refresh history
        fetchHistory();
      }

      // ✅ SAU ĐÓ MỚI THAY ĐỔI STATE
      setResearch(json.result); 
      setStep(2);

    } catch (err) { setError(err instanceof Error ? err.message : "Step 2 failed"); }
    finally { setStepLoading(false); }
  }

  function serializeRedditData() {
    return redditEntries
      .filter(e => e.post.trim())
      .map((e, i) => {
        const parts = [`=== POST ${i + 1} ===\n${e.post.trim()}`];
        e.comments.filter(c => c.trim()).forEach((c, j) => {
          parts.push(`--- Comment ${i + 1}.${j + 1} ---\n${c.trim()}`);
        });
        return parts.join("\n\n");
      })
      .join("\n\n");
  }

  const redditTotal = serializeRedditData().length;
  const filledPosts = redditEntries.filter(e => e.post.trim()).length;
  const filledComments = redditEntries.reduce((sum, e) => sum + e.comments.filter(c => c.trim()).length, 0);

  async function handleStep3() {
    const data = serializeRedditData();
    if (!result || data.length < 50) return;
    setStepLoading(true); setError(null);
    try {
      const res = await fetch("/api/enrich", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          extraction: result, 
          redditData: data,
          authorInput: Object.values(authorInput).some(v => v.trim()) ? authorInput : undefined
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Step 3 failed");
      
      console.log("[Step 3] Synthesis received from API:", Object.keys(json.result || {}));
      
      if (activeId) {
        console.log("[Step 3] Saving synthesis to DB...");
        const normalized = normalizeSynthesis(json.result);
        const { error: supabaseError } = await supabase
          .from("analyses")
          .update({ synthesis: normalized, reddit_raw: data })
          .eq("id", activeId);

        if (supabaseError) {
          console.error("[Step 3] Supabase Error:", supabaseError);
          setError(`Database error: ${supabaseError.message}`);
        } else {
          console.log("[Step 3] ✅ SYNTHESIS SAVED TO DATABASE SUCCESSFULLY");
          fetchHistory();
        }
      } else {
        console.warn("[Step 3] No activeId - cannot save to Supabase");
      }
      
      // ✅ LƯU VÀO DB TRƯỚC, SAU ĐÓ MỚI THAY ĐỔI STATE
      setSynthesis(json.result); 
      setStep(3);
    } catch (err) { setError(err instanceof Error ? err.message : "Step 3 failed"); }
    finally { setStepLoading(false); }
  }

  async function handleStep4() {
    if (!result || !synthesis) return;
    setStepLoading(true); setError(null);
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction: result, synthesis: synthesis }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Step 4 failed");

      if (activeId) {
        console.log("[Step 4] Saving script to DB...");
        const { error: supabaseError } = await supabase
          .from("analyses")
          .update({ generated_script: json.result })
          .eq("id", activeId);

        if (supabaseError) {
          console.error("[Step 4] Supabase Error:", supabaseError);
          setError(`Database error: ${supabaseError.message}`);
        } else {
          console.log("[Step 4] ✅ SCRIPT SAVED TO DATABASE SUCCESSFULLY");
          fetchHistory();
        }
      }

      setGeneratedScript(json.result);
      setStep(4);
    } catch (err) { setError(err instanceof Error ? err.message : "Step 4 failed"); }
    finally { setStepLoading(false); }
  }

  const maxDone = generatedScript ? 4 : synthesis ? 3 : research ? 2 : result ? 1 : 0;

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
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-x-hidden">
        {/* Top bar */}
        <header className="border-b border-[#1a1a1a] sticky top-0 z-40 backdrop-blur-md bg-[#0a0a0a]/90">
          <div className="max-w-3xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile history toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden flex flex-col gap-1 p-1"
                aria-label="Open history"
              >
                <span className="w-5 h-0.5 bg-[#666] rounded" />
                <span className="w-5 h-0.5 bg-[#666] rounded" />
                <span className="w-5 h-0.5 bg-[#666] rounded" />
              </button>
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

        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-8">
          {/* ── Step Bar — luôn hiển thị ── */}
          <StepBar current={step} maxDone={maxDone} onBack={setStep} />

          {/* ── Hero ── */}
          {!result && (
            <div className="text-center mb-10">
              <h1 className="font-display text-5xl md:text-6xl tracking-wider text-white mb-3">
                REVERSE-ENGINEER
                <br />
                <span className="gradient-text">VIRAL SCRIPTS</span>
              </h1>
              <p className="text-[#555] text-sm max-w-md mx-auto leading-relaxed">
                Paste script YouTube bất kỳ. Pipeline 3 bước: Phân tích →
                Nghiên cứu Reddit → Chiến lược hành động.
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
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white text-sm font-semibold flex items-center gap-1.5">
                    Viewer Comments
                     <span className="tag-pill bg-[#1a1a1a] text-[#444] normal-case font-normal ml-1">
                       optional · max 30
                     </span>
                  </label>
                  
                  <div className="flex bg-[#111] rounded-lg p-1">
                    <button 
                      onClick={() => {
                        setCommentMode("individual");
                        setBulkComments("");
                      }}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${commentMode === 'individual' ? 'bg-[#ff2d20] text-white' : 'text-[#666] hover:text-white'}`}
                    >
                      Individual
                    </button>
                    <button 
                      onClick={() => setCommentMode("bulk")}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${commentMode === 'bulk' ? 'bg-[#ff2d20] text-white' : 'text-[#666] hover:text-white'}`}
                    >
                      Bulk Paste
                    </button>
                  </div>
                </div>

                {commentMode === "bulk" && (
                  <div className="mb-4">
                    <textarea
                      value={bulkComments}
                      onChange={(e) => {
                        setBulkComments(e.target.value);
                        try {
                          // Thử parse JSON array
                          const parsed = JSON.parse(e.target.value);
                          if (Array.isArray(parsed)) {
                            const normalized = parsed.map(c => String(c || "")).slice(0, 30);
                            setComments([...normalized, ...Array(30 - normalized.length).fill("")]);
                          }
                        } catch {
                          // Nếu không phải JSON thì split theo dòng
                          const lines = e.target.value.split("\n").filter(l => l.trim()).slice(0, 30);
                          setComments([...lines, ...Array(30 - lines.length).fill("")]);
                        }
                      }}
                      placeholder={`Paste danh sách comments ở đây, 1 dòng 1 comment hoặc paste toàn bộ array JSON:
[
  "Comment 1",
  "Comment 2",
  "Comment 3"
]`}
                      rows={10}
                      className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2
                                 text-[#ccc] text-sm placeholder:text-[#2a2a2a] resize-y
                                 transition-all focus:border-[#ff2d20]/40 font-body leading-relaxed font-mono"
                    />
                    <p className="text-[#444] text-xs mt-2">✅ Tự động parse JSON array hoặc danh sách nhiều dòng. Đã nhận {comments.filter(c => c.trim()).length} comment</p>
                  </div>
                )}
                
                {commentMode === "individual" && (
                  <div className="space-y-2">
                    {comments.map((comment, idx) => (
                      <textarea
                        key={idx}
                        value={comment}
                        onChange={(e) => {
                          const newComments = [...comments];
                          newComments[idx] = e.target.value;
                          setComments(newComments);
                        }}
                        placeholder={`Comment ${idx + 1} (optional) - e.g., "This changed my perspective completely"`}
                        rows={2}
                        className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2
                                   text-[#ccc] text-sm placeholder:text-[#2a2a2a] resize-y
                                   transition-all focus:border-[#ff2d20]/40 font-body leading-relaxed"
                      />
                    ))}
                  </div>
                )}
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
                3-step pipeline · Auto-saved to Supabase
              </p>
            </div>
          )}

          {loading && <LoadingSkeleton message={loadingMessage} />}

          {result && !loading && (
            <div ref={resultsRef}>
              {saveError && (
                <div className="mb-4 bg-yellow-900/20 border border-yellow-900/40 rounded-xl px-4 py-2.5 text-yellow-400 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{saveError}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 bg-red-900/20 border border-red-900/40 rounded-xl px-4 py-3 text-red-400 text-sm flex items-start gap-2">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}

              {step === 1 && (
                <>
                  <AnalysisDisplay data={result} />
                  <div className="mt-6 flex justify-end">
                    <button onClick={handleStep2} disabled={stepLoading}
                      className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-wait transition-all font-semibold text-sm">
                      {stepLoading ? "Đang tạo hướng dẫn..." : "Tiếp tục → Bước 2: Nghiên cứu Reddit"}
                    </button>
                  </div>
                </>
              )}

              {step === 2 && research && (
                <>
                  <ResearchDisplay data={research} />
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-white text-sm font-semibold">
                        Nguyên liệu Reddit
                        <span className="text-[#555] font-normal ml-2">— mỗi bài kèm comment của nó</span>
                      </label>
                      <p className="text-[#444] text-xs">3-5 bài · 3-5 comment/bài</p>
                    </div>

                    {redditEntries.map((entry, i) => (
                      <div key={i} className="rounded-xl border border-[#1e1e1e] bg-[#0d0d0d] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-400 text-xs font-semibold">Bài {i + 1}</span>
                          {redditEntries.length > 1 && (
                            <button onClick={() => setRedditEntries(prev => prev.filter((_, j) => j !== i))}
                              className="text-[#444] hover:text-red-400 text-xs transition-colors">Xóa bài</button>
                          )}
                        </div>
                        <textarea value={entry.post} onChange={(e) => {
                          const next = [...redditEntries];
                          next[i] = { ...next[i], post: e.target.value };
                          setRedditEntries(next);
                        }}
                          placeholder="Paste nguyên văn bài viết Reddit..."
                          rows={4}
                          className="w-full bg-[#111] border border-[#1a1a1a] rounded-lg px-3 py-2 text-[#ccc] text-sm placeholder:text-[#2a2a2a] resize-y focus:border-emerald-500/40 transition-all" />

                        <div className="pl-3 border-l-2 border-[#1a1a1a] space-y-2">
                          <span className="text-[#555] text-xs">Comments bài này:</span>
                          {entry.comments.map((c, j) => (
                            <div key={j} className="flex gap-2">
                              <textarea value={c} onChange={(e) => {
                                const next = [...redditEntries];
                                const cmts = [...next[i].comments];
                                cmts[j] = e.target.value;
                                next[i] = { ...next[i], comments: cmts };
                                setRedditEntries(next);
                              }}
                                placeholder={`Comment ${j + 1}...`}
                                rows={2}
                                className="flex-1 bg-[#111] border border-[#1a1a1a] rounded-lg px-3 py-2 text-[#ccc] text-sm placeholder:text-[#2a2a2a] resize-y focus:border-emerald-500/30 transition-all" />
                              {entry.comments.length > 1 && (
                                <button onClick={() => {
                                  const next = [...redditEntries];
                                  next[i] = { ...next[i], comments: next[i].comments.filter((_, k) => k !== j) };
                                  setRedditEntries(next);
                                }}
                                  className="text-[#333] hover:text-red-400 text-xs self-start mt-2 transition-colors">✕</button>
                              )}
                            </div>
                          ))}
                          {entry.comments.length < 7 && (
                            <button onClick={() => {
                              const next = [...redditEntries];
                              next[i] = { ...next[i], comments: [...next[i].comments, ""] };
                              setRedditEntries(next);
                            }}
                              className="text-[#444] hover:text-emerald-400 text-xs transition-colors">+ Thêm comment</button>
                          )}
                        </div>
                      </div>
                    ))}

                    {redditEntries.length < 8 && (
                      <button onClick={() => setRedditEntries(prev => [...prev, { post: "", comments: [""] }])}
                        className="w-full py-2.5 rounded-xl border border-dashed border-[#222] text-[#555] hover:text-emerald-400 hover:border-emerald-500/30 text-sm transition-all">
                        + Thêm bài viết Reddit
                      </button>
                    )}


                    {/* Quantity guide */}
                    <div className="rounded-lg bg-[#111] border border-[#1a1a1a] px-4 py-3">
                      <p className="text-[#666] text-xs leading-relaxed">
                        <strong className="text-[#888]">Hiện tại:</strong>{" "}
                        <span className={filledPosts >= 3 ? "text-emerald-400" : "text-[#555]"}>{filledPosts} bài</span>
                        {" · "}
                        <span className={filledComments >= 9 ? "text-emerald-400" : "text-[#555]"}>{filledComments} comment</span>
                        {" · "}
                        <span className={redditTotal >= 50 ? "text-emerald-400" : "text-[#555]"}>{redditTotal.toLocaleString()} ký tự</span>
                        {redditTotal < 50 && <span className="text-[#444]"> — cần thêm {50 - redditTotal}</span>}
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <button onClick={handleStep3} disabled={stepLoading || redditTotal < 50}
                        className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-wait transition-all font-semibold text-sm">
                        {stepLoading ? "Đang tổng hợp..." : "Tiếp tục → Bước 3: Tổng hợp chiến lược"}
                      </button>
                    </div>
                  </div>
                </>
              )}

               {step === 3 && synthesis && (
                 <>
                   <SynthesisDisplay data={synthesis} />
                   <div className="mt-6 flex justify-end">
                     <button 
                       onClick={handleStep4} 
                       disabled={stepLoading}
                       className="px-6 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-wait transition-all font-semibold text-sm">
                       {stepLoading ? "Đang viết script..." : "Tiếp tục → Bước 4: Tạo Script YouTube"}
                     </button>
                   </div>
                 </>
               )}
               
               {step === 4 && <ScriptDisplay data={generatedScript} />}
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