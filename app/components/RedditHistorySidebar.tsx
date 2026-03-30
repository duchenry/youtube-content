"use client";

import { RedditIdeaEntry } from "@/app/lib/useRedditHistory";

interface RedditHistorySidebarProps {
  history: RedditIdeaEntry[];
  loading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewAnalysis: () => void;
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    // Extract subreddit from /r/subreddit/
    const match = path.match(/\/r\/([a-zA-Z0-9_]+)\//);
    return match ? `r/${match[1]}` : "reddit";
  } catch {
    return "reddit";
  }
}

export function RedditHistorySidebar({
  history,
  loading,
  activeId,
  onSelect,
  onDelete,
  onNewAnalysis,
}: RedditHistorySidebarProps) {
  return (
    <aside className="w-80 shrink-0 flex flex-col border-r border-[#1a1a1a] bg-[#0d0d0d] min-h-screen sticky top-0 h-screen overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[#ff2d20] to-[#ff6b35] flex items-center justify-center text-[10px]">
            🚀
          </div>
          <span className="font-display text-sm tracking-widest text-white">
            REDDIT IDEAS
          </span>
        </div>

        <button
          onClick={onNewAnalysis}
          className="w-full py-2 rounded-lg bg-[#ff2d20]/10 border border-[#ff2d20]/20
                     text-[#ff2d20] text-xs font-semibold hover:bg-[#ff2d20]/20
                     transition-colors flex items-center justify-center gap-1.5"
        >
          <span>+</span> New Analysis
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <p className="text-[#444] text-[10px] uppercase tracking-widest px-2 mb-2">
          History {history.length > 0 && `(${history.length})`}
        </p>

        {loading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-[#1a1a1a]" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <p className="text-[#444] text-xs leading-relaxed">
              No Reddit analyses yet.
              <br />
              Start by analyzing a Reddit post.
            </p>
          </div>
        ) : (
          history.map((entry) => (
            <div
              key={entry.id}
              className={`relative rounded-lg cursor-pointer transition-all hover:bg-[#141414] ${
                activeId === entry.id
                  ? "bg-[#1a1a1a] border border-[#ff2d20]/20"
                  : "border border-transparent"
              }`}
            >
              <button
                onClick={() => onSelect(entry.id)}
                className="w-full text-left px-3 py-2.5 pr-8"
              >
                {/* Subreddit */}
                <div className="text-[#999] text-[10px] mb-0.5">
                  {extractDomain(entry.url)}
                </div>

                {/* Title */}
                <p className={`text-xs font-medium leading-snug mb-1 ${
                  activeId === entry.id ? "text-white" : "text-[#aaa]"
                }`}>
                  {entry.analysis.hardTruth.theParadox}
                </p>

                {/* Date */}
                <div className="text-[#555] text-[9px]">
                  {new Date(entry.created_at).toLocaleDateString()}
                </div>
              </button>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry.id);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#555] hover:text-red-400 opacity-0 hover:opacity-100 transition-all"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
