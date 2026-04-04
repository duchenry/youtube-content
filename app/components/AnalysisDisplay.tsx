/**
 * Hien thi ket qua phan tich Buoc 1 (Extraction) -- 4 tab:
 * Message (hook, angle, coreTruth), Mechanics (attention, proof, weakPoints, priority),
 * Structure (phases, retention), Audience (painMap, commentPatterns)
 * Moi Card co ghi chu cach su dung -- CSV gon: 1 mang flat, auto-bo dong rong
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

  /* -- CSV: 1 mang flat, tu loc dong rong -- */
  const csvContent = useMemo(() => {
    const r = (s: string, f: string, v: string): string[] | null => (v ? [s, f, v] : null);
    const d = data;
    const rows: (string[] | null)[] = [
      r("Hook", "Raw", d.hook.raw), r("Hook", "Type", d.hook.type),
      r("Hook", "Mechanism", d.hook.mechanism), r("Hook", "Confidence", d.hook.confidence),
      r("Hook Quality", "Strength", d.hookQuality.strength), r("Hook Quality", "Risk", d.hookQuality.risk),
      r("Angle", "Claim", d.angle.claim), r("Angle", "Supporting Logic", d.angle.supportingLogic),
      r("Angle", "Hidden Assumption", d.angle.hiddenAssumption), r("Angle", "Confidence", d.angle.confidence),
      r("Core Truth", "Insight", d.coreTruth.insight), r("Core Truth", "Trigger Moment", d.coreTruth.triggerMoment),
      r("Core Truth", "Confidence", d.coreTruth.confidence),
      r("Attention", "Pattern Break", d.attention.patternBreak),
      r("Attention", "Escalation", d.attention.escalation.join(" | ")),
      r("Attention", "Retention Driver", d.attention.retentionDriver.description),
      r("Proof", "Evidence", d.proofMechanics.evidenceUsed.join(" | ")),
      r("Proof", "Transferable Pattern", d.proofMechanics.transferablePattern.pattern),
      r("Audience", "Profile", d.audience.profile),
      r("Comments", "Dominant Sentiment", d.audience.commentPatterns.dominantSentiment),
      r("Comments", "Repeated Pain", d.audience.commentPatterns.repeatedPain),
      r("Comments", "Language", d.audience.commentPatterns.languageFingerprint.join(" | ")),
      r("Comments", "Unspoken Need", d.audience.commentPatterns.unspokenNeed),
      r("Comments", "Misunderstanding", d.audience.commentPatterns.misunderstanding),
      r("Weak Points", "Where", d.weakPoints.whereItLosesAttention), r("Weak Points", "Why", d.weakPoints.why),
      r("Priority", "Driver", d.priority.primaryDriver), r("Priority", "Why", d.priority.why),
    ];
    d.structureDNA.phases.forEach((p, i) => {
      rows.push(r(`Phase ${i + 1}`, "Phase", p.phase), r(`Phase ${i + 1}`, "Goal + Tactic", `${p.goal} -- ${p.tactic}`));
    });
    d.structureDNA.retentionMoments.forEach((m, i) => {
      rows.push(r(`Retention ${i + 1}`, "Moment", m.moment), r(`Retention ${i + 1}`, "Why", m.whyItWorks));
    });
    d.audience.painMap.forEach((p, i) => {
      rows.push(r(`Pain ${i + 1}`, "Pain", p.pain), r(`Pain ${i + 1}`, "Scenario", p.realScenario));
    });
    d.audience.commentPatterns.emotionalTriggers.forEach((t, i) => {
      rows.push(r(`Trigger ${i + 1}`, "Quote", t.quote), r(`Trigger ${i + 1}`, "Emotion + Insight", `${t.emotion} -- ${t.insight}`));
    });
    const valid = rows.filter(Boolean) as string[][];
    return [["Section", "Field", "Value"], ...valid].map((row) => row.map(esc).join(",")).join("\n");
  }, [data]);

  function exportCSV() {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "youtube-extraction.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "message", label: "Message" }, { key: "mechanics", label: "Mechanics" },
    { key: "structure", label: "Structure" }, { key: "audience", label: "Audience" },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#0b0b0b] p-3 md:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-white text-xl md:text-2xl font-semibold">Analysis Breakdown</h2>
          <p className="text-[#8a8a8a] text-xs mt-1">Bam vao nhom de xem, bam tung card de mo chi tiet</p>
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
          <Card title="Hook" note="Cach doi thu keo viewer ngay tu giay dau" open={!!open.hook} onToggle={() => toggle("hook")}>
            <FieldRow label="Raw" value={data.hook.raw} />
            <FieldRow label="Type" value={data.hook.type} />
            <FieldRow label="Mechanism" value={data.hook.mechanism} note="Co che tam ly khien hook hieu qua" />
            <FieldRow label="Confidence" value={data.hook.confidence} />
          </Card>

          <Card title="Hook Quality" note="Danh gia hook -- tham khao khi viet hook cho video ban" open={!!open.hq} onToggle={() => toggle("hq")}>
            <FieldRow label="Strength" value={data.hookQuality.strength} />
            <FieldRow label="Risk" value={data.hookQuality.risk} note="Rui ro neu tai su dung kieu hook nay" />
          </Card>

          <Card title="Angle" note="Luan diem chinh -- xuong song noi dung, phan tich de tim lo hong" open={!!open.angle} onToggle={() => toggle("angle")}>
            <FieldRow label="Claim" value={data.angle.claim} />
            <FieldRow label="Supporting Logic" value={data.angle.supportingLogic} />
            <FieldRow label="Hidden Assumption" value={data.angle.hiddenAssumption} note="Gia dinh an -- diem yeu ban co the khai thac" />
            <FieldRow label="Confidence" value={data.angle.confidence} />
          </Card>

          <Card title="Core Truth" note="Ly do thuc su video hoat dong -- insight quan trong nhat" open={!!open.ct} onToggle={() => toggle("ct")}>
            <FieldRow label="Insight" value={data.coreTruth.insight} />
            <FieldRow label="Trigger Moment" value={data.coreTruth.triggerMoment} note="Diem bat cam xuc manh nhat trong video" />
            <FieldRow label="Confidence" value={data.coreTruth.confidence} />
          </Card>
        </div>
      )}

      {/* == Tab: Mechanics == */}
      {tab === "mechanics" && (
        <div className="space-y-3 md:space-y-4">
          <Card title="Attention" note="Cach doi thu giu chan viewer -- hoc thu thuat pattern break & leo thang tension" open={!!open.att} onToggle={() => toggle("att")}>
            <FieldRow label="Pattern Break" value={data.attention.patternBreak} />
            <Tags label="Escalation Beats" items={data.attention.escalation} />
            <FieldRow label="Retention Driver" value={data.attention.retentionDriver.description} note="Dong luc chinh giu viewer khong tat video" />
            <FieldRow label="Retention Confidence" value={data.attention.retentionDriver.confidence} />
          </Card>

          <Card title="Proof Mechanics" note="Cach tao uy tin -- pattern nao co the ap dung cho video ban" open={!!open.proof} onToggle={() => toggle("proof")}>
            <Tags label="Evidence Used" items={data.proofMechanics.evidenceUsed} />
            <FieldRow label="Transferable Pattern" value={data.proofMechanics.transferablePattern.pattern} note="Pattern ban co the tai su dung" />
            <FieldRow label="Pattern Confidence" value={data.proofMechanics.transferablePattern.confidence} />
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            <Card title="Weak Points" note="Cho video mat viewer -- co hoi de ban lam tot hon" open={!!open.wp} onToggle={() => toggle("wp")}>
              <FieldRow label="Where It Loses Attention" value={data.weakPoints.whereItLosesAttention} />
              <FieldRow label="Why" value={data.weakPoints.why} />
            </Card>

            <Card title="Priority" note="Yeu to quan trong nhat tao nen hieu qua video nay" open={!!open.pri} onToggle={() => toggle("pri")}>
              <FieldRow label="Primary Driver" value={data.priority.primaryDriver} />
              <FieldRow label="Why" value={data.priority.why} />
            </Card>
          </div>
        </div>
      )}

      {/* == Tab: Structure == */}
      {tab === "structure" && (
        <Card title="Structure DNA" note="Ban do cau truc video -- hoc cach sap xep flow & retention" open={!!open.sd} onToggle={() => toggle("sd")}>
          <div className="space-y-3">
            <p className="text-white text-sm font-semibold">Phases</p>
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
            <p className="text-white text-sm font-semibold">Retention Moments</p>
            {data.structureDNA.retentionMoments.map((m, i) => (
              <div key={i} className="rounded-lg border border-[#262626] bg-[#0f0f0f] p-2.5 md:p-3">
                <FieldRow label="Moment" value={m.moment} />
                <FieldRow label="Why It Works" value={m.whyItWorks} />
                <FieldRow label="Pattern" value={m.pattern} />
                <FieldRow label="Primary" value={m.isPrimary ? "Yes" : "No"} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* == Tab: Audience == */}
      {tab === "audience" && (
        <div className="space-y-3 md:space-y-4">
          <Card title="Audience Profile" note="Biet doi thu dang nham ai -- de ban chon goc tiep can khac" open={!!open.aud} onToggle={() => toggle("aud")}>
            <FieldRow label="Profile" value={data.audience.profile} />
            <div className="space-y-3 mt-3">
              <p className="text-white text-sm font-semibold">Pain Map</p>
              {data.audience.painMap.map((p, i) => (
                <div key={i} className="rounded-lg border border-[#262626] bg-[#0f0f0f] p-2.5 md:p-3">
                  <FieldRow label="Pain" value={p.pain} />
                  <FieldRow label="Real Scenario" value={p.realScenario} note="Tinh huong thuc te -- dung trong script de tao dong cam" />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Comment Patterns" note="Tin hieu thuc tu viewer -- dung ngon ngu cua ho trong video ban" open={!!open.cp} onToggle={() => toggle("cp")}>
            <FieldRow label="Dominant Sentiment" value={data.audience.commentPatterns.dominantSentiment} />
            <FieldRow label="Repeated Pain" value={data.audience.commentPatterns.repeatedPain} />
            {data.audience.commentPatterns.emotionalTriggers.length > 0 && (
              <div className="space-y-3 mt-3">
                <p className="text-white text-sm font-semibold">Emotional Triggers</p>
                {data.audience.commentPatterns.emotionalTriggers.map((t, i) => (
                  <div key={i} className="rounded-lg border border-[#262626] bg-[#0f0f0f] p-2.5 md:p-3">
                    <FieldRow label="Quote" value={t.quote} />
                    <FieldRow label="Emotion" value={t.emotion} />
                    <FieldRow label="Insight" value={t.insight} />
                  </div>
                ))}
              </div>
            )}
            <Tags label="Language Fingerprint" items={data.audience.commentPatterns.languageFingerprint} />
            <FieldRow label="Unspoken Need" value={data.audience.commentPatterns.unspokenNeed} note="Nhu cau an -- viewer muon nhung khong noi ra" />
            <FieldRow label="Misunderstanding" value={data.audience.commentPatterns.misunderstanding} note="Hieu lam pho bien -- co hoi content giai thich/phan bien" />
          </Card>
        </div>
      )}
    </div>
  );
}
