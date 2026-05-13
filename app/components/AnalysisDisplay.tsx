"use client";

import { useMemo, useState } from "react";
import type { AnalysisResult } from "@/app/lib/types";

interface Props {
  data: AnalysisResult;
}

type Tab = "message" | "mechanics" | "structure" | "audience";

const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;

/* ─────────────────────────────
   SAFE ACCESS LAYER (FIX CRASH)
───────────────────────────── */
const safe = {
  hook: {
    raw: "",
    type: "",
    mechanism: "",
    confidence: "",
  },
  angle: {
    claim: "",
    hiddenAssumption: "",
    confidence: "",
  },
  coreTruth: {
    insight: "",
    triggerMoment: "",
    confidence: "",
  },
  attention: {
    retentionDriver: {
      description: "",
      confidence: "",
    },
  },
  audience: {
    profile: "",
    painMap: [],
    commentInsight: {
      repeatedPain: "",
      emotionalExample: "",
      unspokenNeed: "",
    },
  },
  priority: {
    primaryDriver: "",
    why: "",
  },
  viewerProfile: {
    ageRange: "",
    incomeOrSituation: "",
    coreBelief: "",
    recentPainTrigger: "",
  },
  inputComments: [],
};

function mergeData(data: AnalysisResult) {
  return {
    ...safe,
    ...data,
    hook: { ...safe.hook, ...(data as any)?.hook },
    angle: { ...safe.angle, ...(data as any)?.angle },
    coreTruth: { ...safe.coreTruth, ...(data as any)?.coreTruth },
    attention: {
      retentionDriver: {
        ...safe.attention.retentionDriver,
        ...(data as any)?.attention?.retentionDriver,
      },
    },
    audience: {
      ...safe.audience,
      ...(data as any)?.audience,
      commentInsight: {
        ...safe.audience.commentInsight,
        ...(data as any)?.audience?.commentInsight,
      },
    },
    priority: { ...safe.priority, ...(data as any)?.priority },
    viewerProfile: {
      ...safe.viewerProfile,
      ...(data as any)?.viewerProfile,
    },
    inputComments: (data as any)?.inputComments ?? [],
  };
}

/* ───────────────────────────── */

function FieldRow({
  label,
  value,
  note,
}: {
  label: string;
  value?: string;
  note?: string;
}) {
  if (!value?.trim()) return null;

  return (
    <div className="py-3 border-b border-[#1f1f1f] last:border-b-0">
      <p className="text-[#8a8a8a] text-xs md:text-sm uppercase tracking-[0.12em] mb-1">
        {label}
      </p>
      <p className="text-[#e2e2e2] text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
        {value}
      </p>
      {note && <p className="text-[#555] text-[11px] mt-1 italic">{note}</p>}
    </div>
  );
}

function Card({
  title,
  note,
  open,
  onToggle,
  children,
}: {
  title: string;
  note: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#222] bg-gradient-to-b from-[#101010] to-[#0b0b0b] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 md:px-5 py-3.5 md:py-4 text-left hover:bg-[#141414] transition-colors"
      >
        <h3 className="text-white text-base md:text-lg font-semibold">
          {title}
        </h3>
        <p className="text-[#666] text-xs mt-1 italic">{note}</p>
      </button>
      {open && <div className="px-4 md:px-5 pb-4 md:pb-5">{children}</div>}
    </section>
  );
}

export function AnalysisDisplay({ data }: Props) {
  const [tab, setTab] = useState<Tab>("message");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const d = useMemo(() => mergeData(data), [data]);
  /* -- CSV Export -- */
  const csvContent = useMemo(() => {
    const r = (s: string, f: string, v: string) =>
      v ? [s, f, v] : null;
    const rows: (string[] | null)[] = [
      r("Hook", "Raw", d.hook.raw),
      r("Hook", "Type", d.hook.type),
      r("Hook", "Mechanism", d.hook.mechanism),
      r("Hook", "Confidence", d.hook.confidence),

      r("Angle", "Claim", d.angle.claim),
      r("Angle", "Hidden Assumption", d.angle.hiddenAssumption),
      r("Angle", "Confidence", d.angle.confidence),

      r("Core Truth", "Insight", d.coreTruth.insight),
      r("Core Truth", "Trigger Moment", d.coreTruth.triggerMoment),
      r("Core Truth", "Confidence", d.coreTruth.confidence),

      r(
        "Attention",
        "Retention Driver",
        d.attention.retentionDriver.description
      ),

      r("Audience", "Profile", d.audience.profile),

      ...(Array.isArray(d.audience.painMap)
        ? d.audience.painMap.flatMap((p: any, i: number) => [
            r(`Pain ${i + 1}`, "Description", p?.pain || ""),
            r(`Pain ${i + 1}`, "Real Scenario", p?.realScenario || ""),
          ])
        : []),
    ];
    const valid = rows.filter(Boolean) as string[][];

    return [
      ["Section", "Field", "Value"],
      ...valid,
    ]
      .map((row) => row.map(esc).join(","))
      .join("\n");
  }, [d]);

  function exportCSV() {
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "youtube-extraction.csv";
    a.style.display = "none";

    document.body.appendChild(a);

    setTimeout(() => {
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    }, 0);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "message", label: "Message" },
    { key: "mechanics", label: "Mechanics" },
    { key: "audience", label: "Audience" },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* UI GIỮ NGUYÊN 100% */}
      {/* ── Header ── */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#0b0b0b] p-3 md:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-white text-xl md:text-2xl font-semibold">
            Analysis Breakdown
          </h2>
          <p className="text-[#8a8a8a] text-xs mt-1">
            ✅ Khớp 100% cấu trúc data thật | 20/4/2026
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="w-full sm:w-auto bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#0b0b0b] p-2 md:p-3">
        <div className="flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                tab === t.key
                  ? "bg-[#2563eb] text-white"
                  : "bg-[#141414] text-[#9a9a9a] hover:text-white hover:bg-[#1b1b1b]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      {tab === "message" && (
        <div className="columns-1 lg:columns-2 gap-3 md:gap-4">
          <div className="break-inside-avoid mb-3">
          <Card
            title="🎣 Hook"
            note="Cách kéo viewer ngay từ giây đầu"
            open={!!open.hook}
            onToggle={() => toggle("hook")}
          >
            <FieldRow label="Raw" value={d.hook.raw} />
            <FieldRow label="Type" value={d.hook.type} />
            <FieldRow label="Mechanism" value={d.hook.mechanism} />
            <FieldRow label="Confidence" value={d.hook.confidence} />
          </Card>
          </div>
          <div className="break-inside-avoid mb-3">
          <Card
            title="🎯 Angle"
            note="Luận điểm chính của video"
            open={!!open.angle}
            onToggle={() => toggle("angle")}
          >
            <FieldRow label="Claim" value={d.angle.claim} />
            <FieldRow
              label="Hidden Assumption"
              value={d.angle.hiddenAssumption}
            />
            <FieldRow label="Confidence" value={d.angle.confidence} />
          </Card>
            </div>
          <div className="break-inside-avoid mb-3">
          <Card
            title="💎 Core Truth"
            note="Lý do thực sự video hoạt động"
            open={!!open.coreTruth}
            onToggle={() => toggle("coreTruth")}
          >
            <FieldRow label="Insight" value={d.coreTruth.insight} />
            <FieldRow label="Trigger Moment" value={d.coreTruth.triggerMoment} />
            <FieldRow label="Confidence" value={d.coreTruth.confidence} />
          </Card>
            </div>

        </div>
      )}

      {/* Mechanics */}
      {tab === "mechanics" && (
        <div className="space-y-3 md:space-y-4">
          <Card
            title="👁️ Attention"
            note="Cách giữ chân viewer"
            open={!!open.attention}
            onToggle={() => toggle("attention")}
          >
            <FieldRow
              label="Retention Driver"
              value={d.attention.retentionDriver.description}
            />
            <FieldRow
              label="Driver Confidence"
              value={d.attention.retentionDriver.confidence}
            />
          </Card>

          <Card
            title="🎯 Priority"
            note="Yếu tố quan trọng nhất"
            open={!!open.priority}
            onToggle={() => toggle("priority")}
          >
            <FieldRow
              label="Primary Driver"
              value={d.priority.primaryDriver}
            />
            <FieldRow label="Why" value={d.priority.why} />
          </Card>
        </div>
      )}

      {/* Audience */}
      {tab === "audience" && (
        <div className="space-y-3 md:space-y-4">
          <Card
            title="👤 Viewer Profile"
            note="Thông tin chi tiết"
            open={!!open.viewer}
            onToggle={() => toggle("viewer")}
          >
            <FieldRow label="Age Range" value={d.viewerProfile.ageRange} />
            <FieldRow
              label="Income / Situation"
              value={d.viewerProfile.incomeOrSituation}
            />
            <FieldRow
              label="Core Belief"
              value={d.viewerProfile.coreBelief}
            />
            <FieldRow
              label="Recent Pain Trigger"
              value={d.viewerProfile.recentPainTrigger}
            />
          </Card>

          <Card
            title="👥 Audience Profile"
            note="Đối tượng"
            open={!!open.aud}
            onToggle={() => toggle("aud")}
          >
            <FieldRow label="Profile" value={d.audience.profile} />

            <div className="space-y-3 mt-4">
              <p className="text-white text-sm font-semibold">😣 Pain Map</p>
              {d.audience.painMap.map((p: any, i: number) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#262626] bg-[#0f0f0f] p-2.5 md:p-3"
                >
                  <FieldRow label="Pain" value={p.pain} />
                  <FieldRow label="Real Scenario" value={p.realScenario} />
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="💬 Comment Insight"
            note="Dữ liệu comments"
            open={!!open.comments}
            onToggle={() => toggle("comments")}
          >
            <FieldRow
              label="Repeated Pain"
              value={d.audience.commentInsight.repeatedPain}
            />
            <FieldRow
              label="Emotional Example"
              value={d.audience.commentInsight.emotionalExample}
            />
            <FieldRow
              label="Unspoken Need"
              value={d.audience.commentInsight.unspokenNeed}
            />
          </Card>
          <Card
            title="📋 Raw Input Comments"
            note="Comments input"
            open={!!open.rawComments}
            onToggle={() => toggle("rawComments")}
          >
            <div className="space-y-2 mt-2">
              {d.inputComments
                .filter((c: string) => c?.trim())
                .map((comment: string, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-lg bg-[#111] border border-[#1a1a1a] px-3 py-2"
                  >
                    <p className="text-[#ccc] text-sm">{comment}</p>
                  </div>
                ))}

              {!d.inputComments.filter((c: string) => c?.trim()).length && (
                <p className="text-[#555] text-sm italic">
                  Không có comment nào
                </p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}