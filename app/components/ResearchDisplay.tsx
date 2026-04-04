/**
 * Hiển thị kết quả Bước 2 — hướng dẫn nghiên cứu Reddit
 * Danh sách truy vấn + subreddits (link trực tiếp) + pattern cần tìm
 * Kèm hướng dẫn chi tiết cách search cho người chưa quen
 */
"use client";

import { useState } from "react";
import type { ResearchDirective } from "@/app/lib/types";

interface Props { data: ResearchDirective }

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
          {/* Important note */}
          <div className="px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15">
            <p className="text-red-400/80 text-xs"><strong>⚠️ Lưu ý:</strong> Query AI gợi ý chỉ là <strong>điểm bắt đầu</strong>, không phải câu thần chú.
              Reddit search rất tệ với câu dài — nếu không ra kết quả, <strong className="text-[#ccc]">rút gọn còn 2-3 từ khóa chính</strong>.
              Giá trị thật nằm ở <strong className="text-[#ccc]">subreddit</strong> (tìm đúng chỗ) và <strong className="text-[#ccc]">purpose</strong> (biết mình đang tìm gì).</p>
          </div>
          {/* Step 1 */}
          <div className="flex gap-2.5">
            <span className="text-emerald-400 font-bold shrink-0">①</span>
            <div>
              <p className="text-white font-medium">Bấm nút <span className="text-[#2563eb]">r/subreddit ↗</span> — nếu không ra, rút gọn query</p>
              <p className="text-[#666]">Link mở Reddit với query sẵn. Nếu kết quả ít/không liên quan → xóa bớt từ trong search box, chỉ giữ 2-3 từ khóa cốt lõi.</p>
            </div>
          </div>
          {/* Step 2 */}
          <div className="flex gap-2.5">
            <span className="text-emerald-400 font-bold shrink-0">②</span>
            <div>
              <p className="text-white font-medium">Đọc lướt nhanh — chỉ tìm bài có tương tác cao</p>
              <p className="text-[#666]">Ưu tiên bài <strong className="text-[#999]">50+ upvotes, 20+ comments</strong>. Không cần đọc kỹ — chỉ lướt xem bài nào có tranh luận/tâm sự thật.</p>
            </div>
          </div>
          {/* Step 3 */}
          <div className="flex gap-2.5">
            <span className="text-emerald-400 font-bold shrink-0">③</span>
            <div>
              <p className="text-white font-medium">Mỗi bài = 1 block bên dưới: paste bài viết + 3-5 comment của nó</p>
              <p className="text-[#666]">Bấm <strong className="text-[#999]">&ldquo;+ Thêm bài viết&rdquo;</strong> để tạo block mới. Trong mỗi block: paste bài viết vào ô lớn, rồi paste từng comment vào ô nhỏ bên dưới.
                <strong className="text-[#999]"> Copy nguyên văn — AI sẽ phân tích.</strong></p>
            </div>
          </div>
          {/* Step 4 */}
          <div className="flex gap-2.5">
            <span className="text-emerald-400 font-bold shrink-0">④</span>
            <div>
              <p className="text-white font-medium">Tiêu chí chọn comment: kể chuyện, phản bác, hoặc thú nhận</p>
              <p className="text-[#666]">Mỗi bài chọn 3-5 comment có nội dung thật. Ưu tiên comment dài, có cảm xúc, có câu chuyện cá nhân.
                <strong className="text-[#999]"> Bỏ qua &ldquo;this&rdquo;, &ldquo;facts&rdquo;, &ldquo;W post&rdquo;, emoji-only.</strong></p>
            </div>
          </div>
          {/* Step 5 */}
          <div className="flex gap-2.5">
            <span className="text-emerald-400 font-bold shrink-0">⑤</span>
            <div>
              <p className="text-white font-medium">Lý tưởng: 3-5 bài × 3-5 comment = 9-25 khối nguyên liệu</p>
              <p className="text-[#666]">Đủ để AI thấy pattern chung. Dùng phần &ldquo;Tìm gì khi đọc&rdquo; bên dưới làm kim chỉ nam khi lướt thread.</p>
            </div>
          </div>
          {/* Tip */}
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
  return (
    <div className="space-y-4">
      <SearchGuide />
      <h3 className="text-white text-lg font-semibold mt-2">Truy vấn tìm kiếm</h3>
      {data.searchDirectives.map((d, i) => (
        <div key={i} className="rounded-xl border border-[#222] bg-gradient-to-b from-[#101010] to-[#0b0b0b] p-4">
          <p className="text-white text-sm font-semibold mb-1">&ldquo;{d.query}&rdquo;</p>
          <p className="text-[#888] text-xs mb-2">{d.purpose}</p>
          {d.viewerAngle && <p className="text-amber-400/70 text-xs mb-2">👤 {d.viewerAngle}</p>}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {d.subreddits.map((raw, j) => {
              const sub = raw.replace(/^r\//, "");
              return (
                <a key={j} href={`https://www.reddit.com/r/${encodeURIComponent(sub)}/search?q=${encodeURIComponent(d.query)}&sort=relevance&t=year`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded bg-[#1a1a1a] text-[#2563eb] text-xs hover:text-white transition-colors">
                  r/{sub} ↗
                </a>
              );
            })}
          </div>
          {d.targetField && <p className="text-[#555] text-[11px] italic">Nhắm vào: {d.targetField}</p>}
        </div>
      ))}

      {data.lookFor.length > 0 && (
        <>
          <h3 className="text-white text-lg font-semibold mt-6">Tìm gì khi đọc Reddit</h3>
          {data.lookFor.map((l, i) => (
            <div key={i} className="rounded-xl border border-[#222] bg-[#101010] p-4">
              <p className="text-[#e2e2e2] text-sm">{l.pattern}</p>
              <p className="text-[#555] text-xs mt-1 italic">{l.why}</p>
              {l.emotionalLayer && <p className="text-red-400/60 text-xs mt-1">🔍 Lớp ẩn: {l.emotionalLayer}</p>}
            </div>
          ))}
        </>
      )}

      {data.deepDig.length > 0 && (
        <>
          <h3 className="text-white text-lg font-semibold mt-6">Deep Dig — 5 trụ tâm lý</h3>
          <p className="text-[#555] text-xs -mt-2 mb-2">Tìm kiếm chuyên sâu theo từng trụ cảm xúc. Ưu tiên mục có tín hiệu mạnh.</p>
          {data.deepDig.map((d, i) => {
            const strengthColor = d.signalStrength?.toLowerCase().includes("strong") ? "text-emerald-400" : d.signalStrength?.toLowerCase().includes("moderate") ? "text-amber-400" : "text-[#555]";
            const categoryLabels: Record<string, string> = { resentment: "😤 Resentment", false_belief: "💔 False Belief", constraint: "🔒 Constraint", internal_conflict: "⚔️ Internal Conflict", hopeless_loop: "🔁 Hopeless Loop" };
            const label = categoryLabels[d.category] || d.category;
            return (
              <div key={i} className="rounded-xl border border-[#222] bg-gradient-to-b from-[#101010] to-[#0b0b0b] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-semibold">{label}</span>
                  {d.signalStrength && <span className={`text-xs font-medium ${strengthColor}`}>{d.signalStrength}</span>}
                </div>
                <p className="text-[#ccc] text-sm mb-1">&ldquo;{d.query}&rdquo;</p>
                <p className="text-[#888] text-xs mb-2">{d.whatToFind}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {d.subreddits.map((raw, j) => {
                    const sub = raw.replace(/^r\//, "");
                    return (
                      <a key={j} href={`https://www.reddit.com/r/${encodeURIComponent(sub)}/search?q=${encodeURIComponent(d.query)}&sort=relevance&t=year`}
                        target="_blank" rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded bg-[#1a1a1a] text-[#2563eb] text-xs hover:text-white transition-colors">
                        r/{sub} ↗
                      </a>
                    );
                  })}
                </div>
                {d.exampleLanguage.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {d.exampleLanguage.map((ex, j) => (
                      <span key={j} className="px-2 py-0.5 rounded bg-red-900/15 border border-red-900/20 text-red-400/70 text-xs italic">&ldquo;{ex}&rdquo;</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
