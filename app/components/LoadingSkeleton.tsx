// Skeleton loading — hiệu ứng chờ khi đang gọi AI phân tích
// Hiển thị thanh tiến trình giả lập theo 3 nhóm phân tích
"use client";

const BATCH_LABELS = [
  { label: "Message & Mechanics", sections: "Hook · Angle · Attention · Proof" },
  { label: "Structure DNA", sections: "Phases · Retention Moments" },
  { label: "Audience & Assessment", sections: "Pain Map · Comments · Weak Points · Priority" },
];

export function LoadingSkeleton() {
  return (
    <div className="mt-8 space-y-6">
      {/* Status line */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-[#ff2d20]"
              style={{
                animation: `pulse2 1.2s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        <span className="text-[#666] text-sm font-mono">
          Running 3 batches in parallel...
        </span>
      </div>

      {/* Batch cards */}
      <div className="grid gap-3">
        {BATCH_LABELS.map((batch, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#1e1e1e] bg-[#111] px-4 py-3 flex items-center gap-4"
            style={{
              animation: `fadeIn 0.4s ease forwards`,
              animationDelay: `${i * 0.15}s`,
              opacity: 0,
            }}
          >
            {/* Spinning indicator */}
            <div
              className="w-5 h-5 rounded-full border-2 border-[#1e1e1e] border-t-[#ff2d20] shrink-0"
              style={{ animation: "spin 1s linear infinite", animationDelay: `${i * 0.1}s` }}
            />
            <div className="flex-1 min-w-0">
              <span className="text-white text-sm font-semibold">{batch.label}</span>
              <p className="text-[#444] text-xs mt-0.5">{batch.sections}</p>
            </div>
            {/* Shimmer progress bar */}
            <div className="w-24 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden shrink-0">
              <div
                className="h-full rounded-full shimmer-bg"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Section skeleton cards */}
      <div className="space-y-3 mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#1e1e1e] bg-[#111] overflow-hidden"
            style={{
              animation: `fadeIn 0.4s ease forwards`,
              animationDelay: `${0.45 + i * 0.08}s`,
              opacity: 0,
            }}
          >
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="shimmer-bg w-5 h-5 rounded" />
              <div
                className="shimmer-bg h-4 rounded"
                style={{ width: `${100 + i * 40}px` }}
              />
            </div>
            <div className="px-5 pb-4 space-y-2 border-t border-[#1a1a1a] pt-3">
              <div className="shimmer-bg h-3 rounded w-full" />
              <div className="shimmer-bg h-3 rounded w-5/6" />
              <div className="shimmer-bg h-3 rounded w-3/5" />
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
