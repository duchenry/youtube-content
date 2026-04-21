/**
 * Hiển thị kết quả Bước 2 — hướng dẫn nghiên cứu Reddit
 * Hiển thị primaryContradiction, contradictionSearch, behaviorPatterns, identityPressure, failureStories, noWinLoops
 * Kèm hướng dẫn chi tiết cách search cho người chưa quen
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

function Tags({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t, i) => (
        <span key={i} className="px-2 py-0.5 rounded bg-[#1a1a1a] text-[#2563eb] text-xs hover:text-white transition-colors">{t}</span>
      ))}
    </div>
  );
}

export function ResearchDisplay({ data, extraction }: Props) {
  // Safe access to arrays - handle undefined/null
  // creatorInterrogation đã được di chuyển thành internal step của research prompt
  // hiện tại chỉ có input creator answers trực tiếp trên trang
  const contradictionSearch = Array.isArray(data?.contradictionSearch) ? data.contradictionSearch : [];
  const behaviorPatterns = Array.isArray(data?.behaviorPatterns) ? data.behaviorPatterns : [];
  const identityPressure = Array.isArray(data?.identityPressure) ? data.identityPressure : [];
  const failureStories = Array.isArray(data?.failureStories) ? data.failureStories : [];
  const noWinLoops = Array.isArray(data?.noWinLoops) ? data.noWinLoops : [];

  const creatorInterrogation = Array.isArray(data?.creatorInterrogation) ? data.creatorInterrogation : [];

  console.log("[ResearchDisplay] data:", data);
  console.log("[ResearchDisplay] creatorInterrogation:", creatorInterrogation);
  console.log("[ResearchDisplay] contradictionSearch:", contradictionSearch);

  return (
    <div className="space-y-6">
      <SearchGuide />

      {/* ✅ TIER 1 - CREATOR INTERROGATION (OUTPUT TỪ RESEARCH) */}
      {creatorInterrogation.length > 0 && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <h3 className="text-white text-lg font-semibold mb-3">❓ Câu hỏi dành cho bạn</h3>
          <p className="text-[#888] text-xs mb-4">Đây là các điểm mở được AI tìm thấy từ video và comment. Trả lời những câu hỏi này → AI sẽ tự động rebuild toàn bộ research theo hướng góc nhìn của bạn.</p>
          
          {creatorInterrogation.map((item, i) => (
            <div key={i} className="rounded-lg border border-purple-500/10 bg-[#0a0a0f] p-4 mb-3">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  item.gapType === 'unaddressed_villain' ? 'bg-red-900/20 text-red-400' :
                  item.gapType === 'contested_fact' ? 'bg-amber-900/20 text-amber-400' :
                  item.gapType === 'deeper_pain' ? 'bg-blue-900/20 text-blue-400' :
                  'bg-purple-900/20 text-purple-400'
                }`}>
                  {item.gapType}
                </span>
                <span className="text-[#666] text-xs">từ {item.source}</span>
              </div>
              
              <p className="text-[#999] text-xs mb-2 italic">{'\u0022'}{item.triggerEvidence}{'\u0022'}</p>
              <p className="text-white text-sm font-medium mb-3">{item.questionForCreator}</p>
              
              <textarea 
                placeholder="Câu trả lời của bạn ở đây. Nói đúng góc nhìn thực tế của bạn, không cần lịch sự..."
                className="w-full bg-[#111] border border-[#222] rounded-lg p-3 text-white text-sm resize-none focus:border-purple-500/50 focus:outline-none transition-colors"
                rows={2}
              />
              
              <p className="text-[#666] text-xs mt-2">{item.whyThisOpens}</p>
            </div>
          ))}
          
        </div>
      )}



      {/* Primary Contradiction */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
        <h3 className="text-white text-lg font-semibold mb-2">⚡ Mâu thuẫn chính</h3>
        <p className="text-[#e2e2e2] text-sm mb-2">{data?.primaryContradiction?.description || "—"}</p>
        <p className="text-[#555] text-xs italic">{data?.primaryContradiction?.whyThisMatters || ""}</p>
        {data?.primaryContradiction?.type && (
          <span className="inline-block mt-2 px-2 py-0.5 rounded bg-red-900/20 border border-red-900/30 text-red-400/70 text-xs">
            {data.primaryContradiction.type}
          </span>
        )}
      </div>

      {/* Contradiction Search */}
      <div>
        <h3 className="text-white text-lg font-semibold mb-3">🔍 Truy vấn tìm kiếm mâu thuẫn</h3>
        {contradictionSearch.length === 0 && <p className="text-[#555] text-sm">Không có dữ liệu truy vấn</p>}
        {contradictionSearch.map((d, i) => (
          <div key={i} className="rounded-xl border border-[#222] bg-gradient-to-b from-[#101010] to-[#0b0b0b] p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white text-sm font-semibold">&ldquo;{d.query}&rdquo;</p>
              {d.severity && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${d.severity === 'high' ? 'bg-red-900/20 text-red-400' : d.severity === 'medium' ? 'bg-amber-900/20 text-amber-400' : 'bg-[#1a1a1a] text-[#555]'}`}>
                  {d.severity}
                </span>
              )}
            </div>
            <p className="text-[#888] text-xs mb-2">{d.direction}</p>
            <p className="text-[#555] text-xs mb-2 italic">Nhắm vào: {d.targetAssumption}</p>
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
            <p className="text-[#555] text-xs italic">Tìm: {d.whatToFind}</p>
            {d.successSignal && <p className="text-[#555] text-xs mt-1">Signal: {d.successSignal}</p>}
            {d.whyItBreaksTheVideo && <p className="text-red-400/60 text-xs mt-1">💥 Phá vỡ video ở điểm: {d.whyItBreaksTheVideo}</p>}
          </div>
        ))}
      </div>

      {/* ✅ TIER 2 - NO WIN LOOPS (EMOTIONAL CORE) */}
      {noWinLoops.length > 0 && (
        <div>
          <h3 className="text-white text-lg font-semibold mb-3">🔁 Vòng lặp không lối thoát</h3>
          {noWinLoops.map((d, i) => (
            <div key={i} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-3">
              <p className="text-[#e2e2e2] text-sm mb-2">{d.situation}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                 <div className="rounded-lg bg-[#101010] p-3 border border-[#222]">
                   <p className="text-amber-400/70 text-xs font-semibold mb-2">Lựa chọn A</p>
                   <p className="text-[#ccc] text-sm mb-1">{d.optionA.action}</p>
                   <p className="text-[#666] text-xs">{d.optionA.immediateFeel} → {d.optionA.longTermCost}</p>
                   <p className="text-[#555] text-xs mt-1">Loại chi phí: {d.optionA.costType}</p>
                 </div>
                 <div className="rounded-lg bg-[#101010] p-3 border border-[#222]">
                   <p className="text-amber-400/70 text-xs font-semibold mb-2">Lựa chọn B</p>
                   <p className="text-[#ccc] text-sm mb-1">{d.optionB.action}</p>
                   <p className="text-[#666] text-xs">{d.optionB.immediateFeel} → {d.optionB.longTermCost}</p>
                   <p className="text-[#555] text-xs mt-1">Loại chi phí: {d.optionB.costType}</p>
                 </div>
              </div>
              <p className="text-red-400/60 text-xs italic">💡 Tại sao mạnh: {d.whyPowerful}</p>
              {d.exampleLanguage.length > 0 && (
                <div className="mt-2">
                  <p className="text-[#555] text-[11px] mb-1">Ngôn ngữ thực:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {d.exampleLanguage.map((ex, j) => (
                      <span key={j} className="px-2 py-0.5 rounded bg-amber-900/15 border border-amber-900/20 text-amber-400/70 text-xs italic">&ldquo;{ex}&rdquo;</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ✅ TIER 2 - BEHAVIOR PATTERNS */}
      {behaviorPatterns.length > 0 && (
        <div>
          <h3 className="text-white text-lg font-semibold mb-3">🔄 Pattern hành vi lặp lại</h3>
          {behaviorPatterns.map((d, i) => (
            <div key={i} className="rounded-xl border border-[#222] bg-[#101010] p-4 mb-3">
              <p className="text-[#e2e2e2] text-sm mb-2">{d.pattern}</p>
              <p className="text-[#555] text-xs mb-1 italic">Vòng lặp: {d.actionLoop}</p>
              <p className="text-red-400/70 text-xs mb-1">💰 Giá phải trả: {d.cost}</p>
              <p className="text-[#555] text-xs mb-1">🎭 Động lực: {d.emotionalDriver}</p>
              <p className="text-amber-400/70 text-xs">💡 Sự thật ẩn: {d.hiddenTruth}</p>
              {d.exampleLanguage.length > 0 && (
                <div className="mt-2">
                  <p className="text-[#555] text-[11px] mb-1">Ngôn ngữ thực:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {d.exampleLanguage.map((ex, j) => (
                      <span key={j} className="px-2 py-0.5 rounded bg-red-900/15 border border-red-900/20 text-red-400/70 text-xs italic">&ldquo;{ex}&rdquo;</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Identity Pressure */}
      {identityPressure.length > 0 && (
        <div>
          <h3 className="text-white text-lg font-semibold mb-3">🎭 Áp lực bản sắc</h3>
          {identityPressure.map((d, i) => (
            <div key={i} className="rounded-xl border border-[#222] bg-gradient-to-b from-[#101010] to-[#0b0b0b] p-4 mb-3">
              <p className="text-white text-sm font-semibold mb-1">Bản sắc: {d.identity}</p>
              <p className="text-[#888] text-xs mb-1">Áp lực: {d.pressure}</p>
              <p className="text-red-400/70 text-xs mb-1">😰 Sợ nếu không làm: {d.fearIfNotAct}</p>
              <p className="text-[#555] text-xs mb-1 italic">Tại sao phi lý: {d.whyIrrational}</p>
              {d.exampleLanguage.length > 0 && (
                <div className="mt-2">
                  <p className="text-[#555] text-[11px] mb-1">Ngôn ngữ thực:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {d.exampleLanguage.map((ex, j) => (
                      <span key={j} className="px-2 py-0.5 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] text-xs italic">&ldquo;{ex}&rdquo;</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Failure Stories */}
      {failureStories.length > 0 && (
        <div>
          <h3 className="text-white text-lg font-semibold mb-3">💔 Câu chuyện thất bại</h3>
          {failureStories.map((d, i) => (
            <div key={i} className="rounded-xl border border-[#222] bg-[#101010] p-4 mb-3">
              <p className="text-white text-sm font-semibold mb-2">&ldquo;{d.query}&rdquo;</p>
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
              <p className="text-[#555] text-xs italic">Signal: {d.signal}</p>
            </div>
          ))}
        </div>
      )}


    </div>
  );
}