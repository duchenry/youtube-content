"use client";

import { HistoryEntry } from "@/app/lib/useHistory";

interface Props {
  history: HistoryEntry[];
  loading: boolean;
  activeId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

export function HistorySidebar({
  history,
  loading,
  activeId,
  onSelect,
  onDelete,
  onNew,
}: Props) {
  return (
    <aside className="w-64 shrink-0 flex flex-col border-r border-[#1a1a1a] bg-[#0d0d0d] min-h-screen sticky top-0 h-screen overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[#ff2d20] to-[#ff6b35] flex items-center justify-center text-[10px]">
            ▶
          </div>
          <span className="font-display text-sm tracking-widest gradient-text">
            SCRIPT ANALYZER
          </span>
        </div>
        <button
          onClick={onNew}
          className="w-full py-2 rounded-lg bg-[#ff2d20]/10 border border-[#ff2d20]/20
                     text-[#ff2d20] text-xs font-semibold hover:bg-[#ff2d20]/20
                     transition-colors flex items-center justify-center gap-1.5"
        >
          <span>+</span> New Analysis
        </button>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <p className="text-[#444] text-[10px] uppercase tracking-widest px-2 mb-2">
          History {history.length > 0 && `(${history.length})`}
        </p>

        {loading && (
          <div className="space-y-2 px-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer-bg h-12 rounded-lg" />
            ))}
          </div>
        )}

        {!loading && history.length === 0 && (
          <div className="px-2 py-8 text-center">
            <p className="text-[#444] text-xs leading-relaxed">
              No analyses yet.
              <br />
              Paste a script to get started.
            </p>
          </div>
        )}

        {!loading &&
          history.map((entry) => (
            <div
              key={entry.id}
              className={`group relative rounded-lg cursor-pointer transition-all
                ${
                  activeId === entry.id
                    ? "bg-[#1a1a1a] border border-[#ff2d20]/20"
                    : "hover:bg-[#141414] border border-transparent"
                }`}
            >
              <button
                onClick={() => onSelect(entry)}
                className="w-full text-left px-3 py-2.5 pr-8"
              >
                <p
                  className={`text-xs font-medium leading-snug line-clamp-2 mb-1 ${
                    activeId === entry.id ? "text-white" : "text-[#aaa]"
                  }`}
                >
                  {entry.title || entry.script_preview}
                </p>
                <p className="text-[10px] text-[#444]">{timeAgo(entry.created_at)}</p>
              </button>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry.id);
                }}
                className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity
                           text-[#444] hover:text-[#ff2d20] text-xs p-0.5"
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1a1a1a]">
        <p className="text-[#333] text-[10px] text-center">
          Saved to Supabase
        </p>
      </div>
    </aside>
  );
}
