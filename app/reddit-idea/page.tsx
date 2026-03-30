"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRedditAnalyzer } from "@/app/lib/useRedditAnalyzer";
import { useRedditHistory } from "@/app/lib/useRedditHistory";
import { RedditHistorySidebar } from "@/app/components/RedditHistorySidebar";
import RedditIdeaDisplay from "@/app/components/RedditIdeaDisplay";

export default function RedditIdeaPage() {
  const { analyze, reset, loading, error, analysis, cached } =
    useRedditAnalyzer();
  const {
    history,
    loading: historyLoading,
    fetchHistory,
    getIdeaByUrl,
    deleteIdea,
  } = useRedditHistory();

  const [urlInput, setUrlInput] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setHasSubmitted(true);
    const success = await analyze(urlInput.trim());

    if (success) {
      // Refresh history to show the new analysis
      await fetchHistory();
      
      // Find and select the just-analyzed item
      setTimeout(() => {
        const entry = getIdeaByUrl(urlInput.trim());
        if (entry) {
          setActiveId(entry.id);
        }
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleSelectHistory = (id: string) => {
    setActiveId(id);
    const entry = history.find((h) => h.id === id);
    if (entry) {
      setUrlInput(entry.url);
      // Manually set analysis to display the selected entry
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this analysis?")) {
      await deleteIdea(id);
      if (activeId === id) {
        setActiveId(null);
        setUrlInput("");
      }
    }
  };

  const handleAnalyzeAnew = () => {
    reset();
    setUrlInput("");
    setHasSubmitted(false);
    setActiveId(null);
  };

  // Get current entry from history
  const currentEntry = activeId
    ? history.find((h) => h.id === activeId)
    : analysis
    ? getIdeaByUrl(urlInput)
    : null;
  const displayAnalysis = currentEntry?.analysis;
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <RedditHistorySidebar
        history={history}
        loading={historyLoading}
        activeId={activeId}
        onSelect={handleSelectHistory}
        onDelete={handleDelete}
        onNewAnalysis={handleAnalyzeAnew}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {/* Header */}
        <header className="border-b border-[#1a1a1a] sticky top-0 z-40 backdrop-blur-md bg-[#0a0a0a]/90">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="text-[#555] hover:text-[#aaa] text-sm transition-colors"
            >
              ← Back to analyzer
            </Link>
            <h1 className="font-display text-xl tracking-wider gradient-text">
              REDDIT VIRAL DNA
            </h1>
            <div className="w-24"></div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-12">
          {!displayAnalysis ? (
            <>
              {/* Hero Section */}
              <div className="text-center mb-12">
                <h2 className="font-display text-4xl tracking-wider gradient-text mb-4">
                  Extract Viral DNA
                </h2>
                <p className="text-[#8b8b8b] text-lg mb-2">
                  Analyze Reddit posts for YouTube content insights
                </p>
                <p className="text-[#555] text-sm">
                  Psychological hooks • Audience pain points • Content angles
                </p>
              </div>

              {/* Input Form */}
              <div className="max-w-2xl mx-auto mb-12">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-display tracking-wide text-[#aaa] mb-2">
                      Reddit Post URL
                    </label>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://reddit.com/r/subreddit/comments/abc123/title/"
                      disabled={loading}
                      className="w-full px-4 py-3 bg-[#111] border border-[#1e1e1e] rounded-lg
                               text-[#ccc] placeholder-[#444]
                               focus:outline-none focus:border-[#ff2d20]/40
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all"
                    />
                    <p className="text-[#555] text-xs mt-2">
                      Format: reddit.com/r/subreddit/comments/postId/title/
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !urlInput.trim()}
                    className="w-full py-3 bg-[#ff2d20] text-white font-semibold rounded-lg
                             hover:bg-[#ff6b35] disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Analyzing...
                      </span>
                    ) : (
                      "Analyze Reddit Post"
                    )}
                  </button>
                </form>

                {error && (
                  <div className="mt-4 p-4 bg-red-900/20 border border-red-900/40 rounded-lg text-red-400 text-sm">
                    <p className="font-semibold mb-1">Error</p>
                    <p>{error}</p>
                  </div>
                )}
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <div className="p-4 bg-[#111] border border-[#1e1e1e] rounded-lg">
                  <h3 className="font-display text-sm tracking-wide text-[#ff2d20] mb-2">
                    INSTANT ANALYSIS
                  </h3>
                  <p className="text-[#888] text-xs leading-relaxed">
                    Get psychological hooks and audience insights in seconds
                  </p>
                </div>
                <div className="p-4 bg-[#111] border border-[#1e1e1e] rounded-lg">
                  <h3 className="font-display text-sm tracking-wide text-[#ff2d20] mb-2">
                    VIRAL DNA EXTRACTION
                  </h3>
                  <p className="text-[#888] text-xs leading-relaxed">
                    10 content angles + 5 pain maps with real-life scenarios
                  </p>
                </div>
                <div className="p-4 bg-[#111] border border-[#1e1e1e] rounded-lg">
                  <h3 className="font-display text-sm tracking-wide text-[#ff2d20] mb-2">
                    SMART LABELS & NOTES
                  </h3>
                  <p className="text-[#888] text-xs leading-relaxed">
                    Tag and organize analyses for easy tracking and classification
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Results */}
              <div ref={resultsRef}>
                {/* Header with back button */}
                <div className="flex items-center justify-between mb-8">
                  <button
                    onClick={handleAnalyzeAnew}
                    className="text-[#555] hover:text-[#aaa] text-sm transition-colors"
                  >
                    ← Analyze another post
                  </button>
                  {cached && (
                    <span className="text-[#555] text-xs bg-[#111] px-3 py-1 rounded border border-[#1e1e1e]">
                      Cached result
                    </span>
                  )}
                </div>

                {/* Analysis Display with Label/Notes */}
                <RedditIdeaDisplay
                  idea={displayAnalysis}
                />

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center mt-12">
                  <button
                    onClick={handleAnalyzeAnew}
                    className="px-6 py-3 bg-[#ff2d20] text-white font-semibold rounded-lg
                             hover:bg-[#ff6b35] transition-colors"
                  >
                    Analyze Another Post
                  </button>
                  <Link
                    href="/"
                    className="px-6 py-3 bg-[#111] border border-[#1e1e1e] text-[#999] font-semibold rounded-lg
                             hover:border-[#333] hover:text-white transition-colors"
                  >
                    Back to Analyzer
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
