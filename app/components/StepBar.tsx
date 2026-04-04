/**
 * Thanh bước — hiển thị tiến trình pipeline 3 bước (chỉ hiển thị + back)
 * Chỉ được quay lại step đã hoàn thành, KHÔNG được nhảy tới step chưa làm
 * Trigger chuyển bước nằm ở cuối nội dung mỗi step, không nằm trong StepBar
 */
"use client";

const STEPS = [
  { n: 1, label: "Phân tích", desc: "Trích xuất cấu trúc video" },
  { n: 2, label: "Nghiên cứu", desc: "Hướng dẫn tìm Reddit" },
  { n: 3, label: "Chiến lược", desc: "Tổng hợp hành động" },
];

interface Props {
  current: number;   // step đang xem
  maxDone: number;   // step cao nhất đã hoàn thành
  onBack: (step: number) => void; // quay lại step trước
}

export function StepBar({ current, maxDone, onBack }: Props) {
  return (
    <div className="mb-6">
      <div className="flex items-stretch gap-2">
        {STEPS.map((s, i) => {
          const done = s.n <= maxDone;
          const active = s.n === current;
          const canClick = done && !active; // chỉ back về step đã xong

          return (
            <div key={s.n} className="flex-1 flex flex-col">
              {/* Progress bar */}
              <div className={`h-1 rounded-full mb-3 transition-colors ${done ? "bg-emerald-500" : "bg-[#1a1a1a]"}`} />

              {/* Step block */}
              {canClick ? (
                <button onClick={() => onBack(s.n)}
                  className="rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] px-3 py-3 md:px-4 md:py-4 text-left hover:border-[#333] hover:bg-[#111] transition-all">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-emerald-500/20 text-emerald-400">✓</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#aaa] truncate">{s.label}</p>
                      <p className="text-[11px] text-[#555] truncate">{s.desc}</p>
                    </div>
                  </div>
                </button>
              ) : active ? (
                <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-3 py-3 md:px-4 md:py-4 shadow-[0_0_12px_rgba(16,185,129,0.08)]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-emerald-500 text-white">{s.n}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{s.label}</p>
                      <p className="text-[11px] text-emerald-400/70 truncate">{s.desc}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-[#191919] bg-[#0c0c0c] px-3 py-3 md:px-4 md:py-4 opacity-40">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-[#151515] text-[#444] border border-[#222]">{s.n}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#555] truncate">{s.label}</p>
                      <p className="text-[11px] text-[#333] truncate">{s.desc}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
