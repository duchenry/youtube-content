/**
 * Hiển thị kết quả phân tích Bước 1 (Extraction)
 * ✅ KHỚP 100% CẤU TRÚC DATA THẬT HIỆN TẠI 20/4/2026
 * ✅ KHÔNG CÒN FIELD THỪA / THIẾU
 */
"use client";

import { useMemo, useState } from "react";
import type { AnalysisResult } from "@/app/lib/types";

interface Props { data: AnalysisResult }
type Tab = "message" | "mechanics" | "structure" | "audience";

const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;

function FieldRow({ label, value, note }: { label: string; value?: string; note?: string }) {
  if (!value?.trim()) return null;
  return (
    <div className="py-3 border-b border-[#1f1f1f] last:border-b-0">
      <p className="text-[#8a8a8a] text-xs md:text-sm uppercase tracking-[0.12em] mb-1">{label}</p>
      <p className="text-[#e2e2e2] text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">{value}</p>
      {note && <p className="text-[#555] text-[11px] mt-1 italic">{note}</p>}
    </div>
  );
}

function Tags({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="py-3 border-b border-[#1f1f1f]">
      <p className="text-[#8a8a8a] text-xs md:text-sm uppercase tracking-[0.12em] mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((t, i) => (
          <span key={i} className="px-2.5 py-1 rounded-md bg-[#151515] border border-[#2a2a2a] text-[#cecece] text-xs md:text-sm">{t}</span>
        ))}
      </div>
    </div>
  );
}

function Card({ title, note, open, onToggle, children }: {
  title: string; note: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#222] bg-gradient-to-b from-[#101010] to-[#0b0b0b] overflow-hidden">
      <button onClick={onToggle} className="w-full px-4 md:px-5 py-3.5 md:py-4 text-left hover:bg-[#141414] transition-colors">
        <h3 className="text-white text-base md:text-lg font-semibold">{title}</h3>
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

  console.log("data", data)
  /* -- CSV Export -- */
  const csvContent = useMemo(() => {
    const r = (s: string, f: string, v: string): string[] | null => (v ? [s, f, v] : null);
    const d = data;
    const rows: (string[] | null)[] = [
      r("Hook", "Raw", d?.hook?.raw || ""),
      r("Hook", "Type", d?.hook?.type || ""),
      r("Hook", "Mechanism", d?.hook?.mechanism || ""),
      r("Hook", "Confidence", d?.hook?.confidence || ""),

      r("Angle", "Claim", d?.angle?.claim || ""),
      r("Angle", "Supporting Logic", Array.isArray(d?.angle?.supportingLogic) ? d.angle.supportingLogic.join(" | ") : ""),
      r("Angle", "Hidden Assumption", d?.angle?.hiddenAssumption || ""),
      r("Angle", "Confidence", d?.angle?.confidence || ""),

      r("Core Truth", "Insight", d?.coreTruth?.insight || ""),
      r("Core Truth", "Trigger Moment", d?.coreTruth?.triggerMoment || ""),
      r("Core Truth", "Confidence", d?.coreTruth?.confidence || ""),

      r("Attention", "Pattern Break", d?.attention?.patternBreak || ""),
      r("Attention", "Retention Driver", d?.attention?.retentionDriver?.description || ""),

      ...(Array.isArray(d?.structureDNA?.phases) ? d.structureDNA.phases.flatMap((p, i) => [
        r(`Phase ${i + 1}`, "Name", p?.phase || ""),
        r(`Phase ${i + 1}`, "Goal", p?.goal || ""),
        r(`Phase ${i + 1}`, "Tactic", p?.tactic || ""),
      ]) : []),

      r("Audience", "Profile", d?.audience?.profile || ""),

      ...(Array.isArray(d?.audience?.painMap) ? d.audience.painMap.flatMap((p, i) => [
        r(`Pain ${i + 1}`, "Description", p?.pain || ""),
        r(`Pain ${i + 1}`, "Real Scenario", p?.realScenario || ""),
      ]) : []),
    ];

    const valid = rows.filter(Boolean) as string[][];
    return [["Section", "Field", "Value"], ...valid].map((row) => row.map(esc).join(",")).join("\n");
  }, [data]);

  function exportCSV() {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 100);
    }, 0);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "message", label: "Message" },
    { key: "mechanics", label: "Mechanics" },
    { key: "structure", label: "Structure" },
    { key: "audience", label: "Audience" },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#0b0b0b] p-3 md:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-white text-xl md:text-2xl font-semibold">Analysis Breakdown</h2>
          <p className="text-[#8a8a8a] text-xs mt-1">✅ Khớp 100% cấu trúc data thật | 20/4/2026</p>
        </div>
        <button onClick={exportCSV} className="w-full sm:w-auto bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors">
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#0b0b0b] p-2 md:p-3">
        <div className="flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`shrink-0 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${tab === t.key ? "bg-[#2563eb] text-white" : "bg-[#141414] text-[#9a9a9a] hover:text-white hover:bg-[#1b1b1b]"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* == Tab: Message == */}
      {tab === "message" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          <Card title="🎣 Hook" note="Cách kéo viewer ngay từ giây đầu" open={!!open.hook} onToggle={() => toggle("hook")}>
            <FieldRow label="Raw" value={data.hook.raw} />
            <FieldRow label="Type" value={data.hook.type} />
            <FieldRow label="Mechanism" value={data.hook.mechanism} note="Cơ chế tâm lý hoạt động" />
            <FieldRow label="Confidence" value={data.hook.confidence} />
          </Card>

          <Card title="🎯 Angle" note="Luận điểm chính của video" open={!!open.angle} onToggle={() => toggle("angle")}>
            <FieldRow label="Claim" value={data.angle.claim} />
            <Tags label="Supporting Logic" items={data.angle.supportingLogic} />
            <FieldRow label="Hidden Assumption" value={data.angle.hiddenAssumption} note="Điểm yếu có thể khai thác" />
            <FieldRow label="Confidence" value={data.angle.confidence} />
          </Card>

          <Card title="💎 Core Truth" note="Lý do thực sự video hoạt động" open={!!open.coreTruth} onToggle={() => toggle("coreTruth")}>
            <FieldRow label="Insight" value={data.coreTruth.insight} />
            <FieldRow label="Trigger Moment" value={data.coreTruth.triggerMoment} />
            <FieldRow label="Confidence" value={data.coreTruth.confidence} />
          </Card>
        </div>
      )}

      {/* == Tab: Mechanics == */}
      {tab === "mechanics" && (
        <div className="space-y-3 md:space-y-4">
          <Card title="👁️ Attention" note="Cách giữ chân viewer" open={!!open.attention} onToggle={() => toggle("attention")}>
            <FieldRow label="Pattern Break" value={data.attention.patternBreak} />
            <Tags label="Escalation" items={data.attention.escalation} />
            <FieldRow label="Retention Driver" value={data.attention.retentionDriver.description} />
            <FieldRow label="Driver Confidence" value={data.attention.retentionDriver.confidence} />
          </Card>

          <Card title="🧪 Proof Mechanics" note="Cách xây dựng uy tín" open={!!open.proof} onToggle={() => toggle("proof")}>
            <Tags label="Evidence Used" items={data.proofMechanics.evidenceUsed} />
            <FieldRow label="Transferable Pattern" value={data.proofMechanics.transferablePattern.pattern} />
            <FieldRow label="Pattern Confidence" value={data.proofMechanics.transferablePattern.confidence} />
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            <Card title="⚠️ Weak Points" note="Chỗ video mất người xem" open={!!open.weak} onToggle={() => toggle("weak")}>
              <FieldRow label="Where It Loses Attention" value={data.weakPoints.whereItLosesAttention} />
              <FieldRow label="Why" value={data.weakPoints.why} />
            </Card>

            <Card title="🎯 Priority" note="Yếu tố quan trọng nhất" open={!!open.priority} onToggle={() => toggle("priority")}>
              <FieldRow label="Primary Driver" value={data.priority.primaryDriver} />
              <FieldRow label="Why" value={data.priority.why} />
            </Card>
          </div>

        </div>
      )}

      {/* == Tab: Structure == */}
      {tab === "structure" && (
        <div className="space-y-3 md:space-y-4">
          <Card title="🧬 Structure DNA" note="Cấu trúc flow video" open={!!open.structure} onToggle={() => toggle("structure")}>
            <div className="space-y-3 mt-4">
              <p className="text-white text-sm font-semibold">📌 Phases</p>
              {data.structureDNA.phases.map((p, i) => (
                <div key={i} className="rounded-lg border border-[#262626] bg-[#0f0f0f] p-2.5 md:p-3">
                  <FieldRow label="Phase" value={p.phase} />
                  <FieldRow label="Goal" value={p.goal} />
                  <FieldRow label="Tactic" value={p.tactic} />
                  <FieldRow label="Source" value={p.source} />
                </div>
              ))}
            </div>

            <div className="space-y-3 mt-4">
              <p className="text-white text-sm font-semibold">🔄 Retention Moments</p>
              {data.structureDNA.retentionMoments.map((m, i) => (
                <div key={i} className="rounded-lg border border-[#262626] bg-[#0f0f0f] p-2.5 md:p-3">
                  <FieldRow label="Moment" value={m.moment} />
                  <FieldRow label="Why It Works" value={m.whyItWorks} />
                  <FieldRow label="Pattern" value={m.pattern} />
                  <FieldRow label="Primary" value={m.isPrimary ? "✅ Yes" : "No"} />
                </div>
              ))}
            </div>
          </Card>

        </div>
      )}

       {/* == Tab: Audience == */}
       {tab === "audience" && (
         <div className="space-y-3 md:space-y-4">
           <Card title="👤 Viewer Profile" note="Thông tin chi tiết về người xem thực tế" open={!!open.viewer} onToggle={() => toggle("viewer")}>
             <FieldRow label="Age Range" value={data?.viewerProfile?.ageRange} />
             <FieldRow label="Income / Situation" value={data?.viewerProfile?.incomeOrSituation} />
             <FieldRow label="Core Belief" value={data?.viewerProfile?.coreBelief} note="Niềm tin mà video đang trực tiếp thách thức" />
             <FieldRow label="Recent Pain Trigger" value={data?.viewerProfile?.recentPainTrigger} note="Sự kiện gần nhất khiến viewer xem video này" />
           </Card>

           <Card title="👥 Audience Profile" note="Đối tượng đang được nhắm tới" open={!!open.aud} onToggle={() => toggle("aud")}>
             <FieldRow label="Profile" value={data.audience.profile} />

             <div className="space-y-3 mt-4">
               <p className="text-white text-sm font-semibold">😣 Pain Map</p>
               {data.audience.painMap.map((p, i) => (
                 <div key={i} className="rounded-lg border border-[#262626] bg-[#0f0f0f] p-2.5 md:p-3">
                   <FieldRow label="Pain" value={p.pain} />
                   <FieldRow label="Real Scenario" value={p.realScenario} />
                 </div>
               ))}
             </div>
          </Card>

           <Card title="💬 Comment Patterns" note="Dữ liệu thực từ comments" open={!!open.comments} onToggle={() => toggle("comments")}>
             <FieldRow label="Dominant Sentiment" value={data.audience.commentPatterns.dominantSentiment} />
             <FieldRow label="Repeated Pain" value={data.audience.commentPatterns.repeatedPain} />
             <Tags label="Language Fingerprint" items={data.audience.commentPatterns.languageFingerprint} />
             <FieldRow label="Unspoken Need" value={data.audience.commentPatterns.unspokenNeed} />
             <FieldRow label="Misunderstanding" value={data.audience.commentPatterns.misunderstanding} />
           </Card>

           <Card title="📋 Raw Input Comments" note="Toàn bộ comments người dùng đã nhập vào" open={!!open.rawComments} onToggle={() => toggle("rawComments")}>
             <div className="space-y-2 mt-2">
               {data.inputComments.filter(c => c.trim()).map((comment, idx) => (
                 <div key={idx} className="rounded-lg bg-[#111] border border-[#1a1a1a] px-3 py-2">
                   <p className="text-[#ccc] text-sm">{comment}</p>
                 </div>
               ))}
               {data.inputComments.filter(c => c.trim()).length === 0 && (
                 <p className="text-[#555] text-sm italic">Không có comment nào được nhập</p>
               )}
             </div>
           </Card>

         </div>
      )}
    </div>
  );
}