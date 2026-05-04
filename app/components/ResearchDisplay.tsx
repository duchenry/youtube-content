/**
 * Hiển thị kết quả Bước 2 — hướng dẫn nghiên cứu Reddit
 * Hiển thị primaryContradiction, searchInstincts, painSignals, confidence
 */
"use client";

import { useState } from "react";
import type { ResearchDirective, AnalysisResult } from "@/app/lib/types";

interface Props { 
  data: ResearchDirective;
  extraction?: AnalysisResult;
}

function SearchGuide() {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between text-left">
        <span className="text-emerald-400 text-sm font-semibold">📖 Cách tìm kiếm Reddit — hướng dẫn từng bước</span>
        <span className="text-emerald-400/50 text-xs">{open ? "Thu gọn ▲" : "Mở rộng ▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 text-[13px] leading-relaxed">
          <div className="px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15">
            <p className="text-red-400/80 text-xs"><strong>⚠️ Lưu ý:</strong> Query AI gợi ý chỉ là <strong>điểm bắt đầu</strong>, không phải câu thần chú.
              Reddit search rất tệ với câu dài — nếu không ra kết quả, <strong className="text-[#ccc]">rút gọn còn 2-3 từ khóa chính</strong>.
              Giá trị thật nằm ở <strong className="text-[#ccc]">subreddit</strong> (tìm đúng chỗ) và <strong className="text-[#ccc]">purpose</strong> (biết mình đang tìm gì).</p>
          </div>
          <div className="flex gap-2.5">
            <span className="text-emerald-400 font-bold shrink-0">①</span>
            <div>
              <p className="text-white font-medium">Bấm nút <span className="text-[#2563eb]">r/subreddit ↗</span> — nếu không ra, rút gọn query</p>
              <p className="text-[#666]">Link mở Reddit với query sẵn. Nếu kết quả ít/không liên quan → xóa bớt từ trong search box, chỉ giữ 2-3 từ khóa cốt lõi.</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <span className="text-emerald-400 font-bold shrink-0">②</span>
            <div>
              <p className="text-white font-medium">Đọc lướt nhanh — chỉ tìm bài có tương tác cao</p>
              <p className="text-[#666]">Ưu tiên bài <strong className="text-[#999]">50+ upvotes, 20+ comments</strong>. Không cần đọc kỹ — chỉ lướt xem bài nào có tranh luận/tâm sự thật.</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <span className="text-emerald-400 font-bold shrink-0">③</span>
            <div>
              <p className="text-white font-medium">Mỗi bài = 1 block bên dưới: paste bài viết + 3-5 comment của nó</p>
              <p className="text-[#666]">Bấm <strong className="text-[#999]">&ldquo;+ Thêm bài viết&rdquo;</strong> để tạo block mới. Trong mỗi block: paste bài viết vào ô lớn, rồi paste từng comment vào ô nhỏ bên dưới.
                <strong className="text-[#999]"> Copy nguyên văn — AI sẽ phân tích.</strong></p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <span className="text-emerald-400 font-bold shrink-0">④</span>
            <div>
              <p className="text-white font-medium">Tiêu chí chọn comment: kể chuyện, phản bác, hoặc thú nhận</p>
              <p className="text-[#666]">Mỗi bài chọn 3-5 comment có nội dung thật. Ưu tiên comment dài, có cảm xúc, có câu chuyện cá nhân.
                <strong className="text-[#999]"> Bỏ qua &ldquo;this&rdquo;, &ldquo;facts&rdquo;, &ldquo;W post&rdquo;, emoji-only.</strong></p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <span className="text-emerald-400 font-bold shrink-0">⑤</span>
            <div>
              <p className="text-white font-medium">Lý tưởng: 3-5 bài × 3-5 comment = 9-25 khối nguyên liệu</p>
              <p className="text-[#666]">Đủ để AI thấy pattern chung. Dùng phần &ldquo;Tìm gì khi đọc&rdquo; bên dưới làm kim chỉ nam khi lướt thread.</p>
            </div>
          </div>
          <div className="mt-1 px-3 py-2 rounded-lg bg-[#111] border border-[#222]">
            <p className="text-amber-400/80 text-xs">💡 <strong>Mẹo:</strong> Thử thay đổi sort thành &ldquo;Top&rdquo; nếu &ldquo;Relevance&rdquo; cho kết quả kém.
              Hoặc vào thẳng subreddit rồi sort &ldquo;Top — Past Year&rdquo; để tìm bài hot nhất liên quan đến chủ đề.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ResearchDisplay({ data }: Props) {
  console.log("data", data)
  const searchInstincts = Array.isArray(data?.searchInstincts) ? data.searchInstincts : [];
  const painSignals = Array.isArray(data?.painSignals) ? data.painSignals : [];

  return (
    <div className="space-y-6">
      <SearchGuide />

      {/* Primary Contradiction */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
        <h3 className="text-white text-lg font-semibold mb-2">⚡ Mâu thuẫn chính</h3>
        <p className="text-[#e2e2e2] text-sm mb-2">{data?.primaryContradiction?.description || "—"}</p>
        <p className="text-[#888] text-xs italic mb-2">Search instinct: {data?.primaryContradiction?.searchInstinct || ""}</p>
        {data?.primaryContradiction?.type && (
          <span className="inline-block mt-2 px-2 py-0.5 rounded bg-red-900/20 border border-red-900/30 text-red-400/70 text-xs">
            {data.primaryContradiction.type}
          </span>
        )}
      </div>

      {/* Search Instincts */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <h3 className="text-white text-lg font-semibold mb-3">🔍 Search Instincts</h3>
        <p className="text-[#888] text-xs mb-3">Keywords ngắn gọn để search Reddit (frustrated human typing at 2AM)</p>
        {searchInstincts.length === 0 && <p className="text-[#555] text-sm">Không có search instincts</p>}
        <div className="space-y-2">
          {searchInstincts.map((phrase, i) => (
            <div key={i} className="rounded-lg border border-[#222] bg-[#0a0a0f] p-3 flex items-center justify-between gap-3">
              <p className="text-white text-sm font-mono flex-1">&ldquo;{phrase}&rdquo;</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(phrase);
                  const btn = document.getElementById(`copy-btn-${i}`);
                  if (btn) {
                    btn.textContent = '✓';
                    setTimeout(() => { btn.textContent = '📋'; }, 1500);
                  }
                }}
                id={`copy-btn-${i}`}
                className="px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs transition-colors shrink-0"
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Pain Signals */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <h3 className="text-white text-lg font-semibold mb-3">💔 Pain Signals</h3>
        <p className="text-[#888] text-xs mb-3">Emotional patterns to look for</p>
        {painSignals.length === 0 && <p className="text-[#555] text-sm">Không có pain signals</p>}
        <div className="space-y-2">
          {painSignals.map((signal, i) => (
            <div key={i} className="rounded-lg border border-[#222] bg-[#0a0a0f] p-3 flex items-center justify-between gap-3">
              <p className="text-amber-200 text-sm">{signal}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(signal);
                  const btn = document.getElementById(`copy-btn-${i}`);
                  if (btn) {
                    btn.textContent = '✓';
                    setTimeout(() => { btn.textContent = '📋'; }, 1500);
                  }
                }}
                id={`copy-btn-${i}`}
                className="px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs transition-colors shrink-0"
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking */}
{data?.ranking && (
  <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
    <h3 className="text-white text-lg font-semibold mb-3">🏆 Ranking Signals</h3>
    
    <div className="space-y-2 text-sm">
      <div className="text-purple-200">
        <span className="text-[#888] text-xs">#1</span> {data.ranking.top1}
      </div>
      <div className="text-purple-300">
        <span className="text-[#888] text-xs">#2</span> {data.ranking.top2}
      </div>
      <div className="text-purple-400">
        <span className="text-[#888] text-xs">#3</span> {data.ranking.top3}
      </div>
    </div>

    <p className="text-[#777] text-xs mt-3 italic">
      {data.ranking.reason}
    </p>
  </div>
)}

      {/* Confidence */}
      <div className="rounded-xl border border-[#222] bg-[#0a0a0f] p-4">
        <h3 className="text-white text-sm font-semibold mb-2">Confidence Level</h3>
        <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
          data?.confidence === 'high' ? 'bg-green-900/20 text-green-400' :
          data?.confidence === 'medium' ? 'bg-amber-900/20 text-amber-400' :
          'bg-red-900/20 text-red-400'
        }`}>
          {data?.confidence || 'unknown'}
        </span>
      </div>
    </div>
  );
}
