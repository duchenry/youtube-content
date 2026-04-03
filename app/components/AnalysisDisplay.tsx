"use client";

import { useMemo, useState } from "react";
import { AnalysisResult } from "@/app/lib/types";

interface Props {
  data: AnalysisResult;
}

type GroupKey = "message" | "mechanics" | "structure" | "audience" | "strategy";

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function FieldRow({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <div className="py-3 border-b border-[#1f1f1f] last:border-b-0">
      <p className="text-[#8a8a8a] text-xs md:text-sm uppercase tracking-[0.12em] mb-1">{label}</p>
      <p className="text-[#e2e2e2] text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words min-w-0">{value}</p>
    </div>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center px-2.5 md:px-3 py-1 md:py-1.5 rounded-md bg-[#151515] border border-[#2a2a2a] text-[#cecece] text-xs md:text-sm">
      {text}
    </span>
  );
}

function Card({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#222] bg-gradient-to-b from-[#101010] to-[#0b0b0b] shadow-[0_0_0_1px_rgba(255,255,255,0.02)] overflow-hidden">
      <button onClick={onToggle} className="w-full px-4 md:px-5 py-3.5 md:py-4 text-left hover:bg-[#141414] transition-colors">
        <h3 className="text-white text-base md:text-lg font-semibold tracking-wide">{title}</h3>
        {subtitle ? <p className="text-[#8a8a8a] text-xs md:text-sm mt-1">{subtitle}</p> : null}
      </button>
      {isOpen ? <div className="px-4 md:px-5 pb-4 md:pb-5">{children}</div> : null}
    </section>
  );
}

export function AnalysisDisplay({ data }: Props) {
  const [activeGroup, setActiveGroup] = useState<GroupKey>("message");
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});

  function toggleCard(key: string) {
    setOpenCards((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const csvRows = useMemo(() => {
    const rows: string[][] = [["Section", "Field", "Value"]];

    rows.push(["Hook", "Raw", data.hook.raw || ""]);
    rows.push(["Hook", "Type", data.hook.type || ""]);
    rows.push(["Hook", "Mechanism", data.hook.mechanism || ""]);
    rows.push(["Hook", "Confidence", data.hook.confidence || ""]);

    rows.push(["Hook Quality", "Strength", data.hookQuality.strength || ""]);
    rows.push(["Hook Quality", "Why", data.hookQuality.why || ""]);
    rows.push(["Hook Quality", "Risk", data.hookQuality.risk || ""]);

    rows.push(["Angle", "Claim", data.angle.claim || ""]);
    rows.push(["Angle", "Supporting Logic", data.angle.supportingLogic || ""]);
    rows.push(["Angle", "Hidden Assumption", data.angle.hiddenAssumption || ""]);
    rows.push(["Angle", "Confidence", data.angle.confidence || ""]);

    rows.push(["Core Truth", "Insight", data.coreTruth.insight || ""]);
    rows.push(["Core Truth", "Trigger Moment", data.coreTruth.triggerMoment || ""]);
    rows.push(["Core Truth", "Confidence", data.coreTruth.confidence || ""]);

    rows.push(["Attention", "Pattern Break", data.attention.patternBreak || ""]);
    rows.push(["Attention", "Escalation", data.attention.escalation.join(" | ")]);
    rows.push(["Attention", "Retention Driver", data.attention.retentionDriver.description || ""]);
    rows.push(["Attention", "Retention Confidence", data.attention.retentionDriver.confidence || ""]);

    rows.push(["Proof Mechanics", "Evidence Used", data.proofMechanics.evidenceUsed.join(" | ")]);
    rows.push(["Proof Mechanics", "Transferable Pattern", data.proofMechanics.transferablePattern.pattern || ""]);
    rows.push(["Proof Mechanics", "Pattern Confidence", data.proofMechanics.transferablePattern.confidence || ""]);

    data.structureDNA.phases.forEach((phase, index) => {
      rows.push([`Structure Phase ${index + 1}`, "Phase", phase.phase || ""]);
      rows.push([`Structure Phase ${index + 1}`, "Goal", phase.goal || ""]);
      rows.push([`Structure Phase ${index + 1}`, "Tactic", phase.tactic || ""]);
      rows.push([`Structure Phase ${index + 1}`, "Source", phase.source || ""]);
    });

    data.structureDNA.retentionMoments.forEach((moment, index) => {
      rows.push([`Retention Moment ${index + 1}`, "Moment", moment.moment || ""]);
      rows.push([`Retention Moment ${index + 1}`, "Why It Works", moment.whyItWorks || ""]);
      rows.push([`Retention Moment ${index + 1}`, "Pattern", moment.pattern || ""]);
      rows.push([`Retention Moment ${index + 1}`, "Primary", moment.isPrimary ? "true" : "false"]);
    });

    rows.push(["Audience", "Profile", data.audience.profile || ""]);

    data.audience.painMap.forEach((pain, index) => {
      rows.push([`Pain Map ${index + 1}`, "Pain", pain.pain || ""]);
      rows.push([`Pain Map ${index + 1}`, "Feeling", pain.feeling || ""]);
      rows.push([`Pain Map ${index + 1}`, "Real Scenario", pain.realScenario || ""]);
    });

    rows.push(["Comment Patterns", "Repeated Pain", data.audience.commentPatterns.repeatedPain || ""]);
    rows.push(["Comment Patterns", "Language Used", data.audience.commentPatterns.languageUsed.join(" | ")]);
    rows.push(["Comment Patterns", "Misunderstanding", data.audience.commentPatterns.misunderstanding || ""]);

    rows.push(["Weak Points", "Where It Loses Attention", data.weakPoints.whereItLosesAttention || ""]);
    rows.push(["Weak Points", "Why", data.weakPoints.why || ""]);

    rows.push(["Priority", "Primary Driver", data.priority.primaryDriver || ""]);
    rows.push(["Priority", "Secondary Driver", data.priority.secondaryDriver || ""]);
    rows.push(["Priority", "Why", data.priority.why || ""]);

    return rows;
  }, [data]);

  function exportToCSV() {
    const csvContent = csvRows
      .map((row) => row.map((cell) => csvEscape(cell || "")).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "youtube-extraction-analysis.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="rounded-xl border border-[#1f1f1f] bg-[#0b0b0b] p-3 md:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-white text-xl md:text-2xl font-semibold tracking-wide">Analysis Breakdown</h2>
          <p className="text-[#8a8a8a] text-xs md:text-sm mt-1">Bam vao nhom de xem, bam tung card de mo chi tiet</p>
        </div>
        <button
          onClick={exportToCSV}
          className="w-full sm:w-auto bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold py-2.5 px-4 rounded-lg text-sm md:text-base transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="rounded-xl border border-[#1f1f1f] bg-[#0b0b0b] p-2 md:p-3 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' as const }}>
          {[
            { key: "message", label: "Message" },
            { key: "mechanics", label: "Mechanics" },
            { key: "structure", label: "Structure" },
            { key: "audience", label: "Audience" },
            { key: "strategy", label: "Strategy" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveGroup(item.key as GroupKey)}
              className={`shrink-0 px-3 py-2 rounded-md text-sm md:text-base font-semibold transition-colors ${
                activeGroup === item.key
                  ? "bg-[#2563eb] text-white"
                  : "bg-[#141414] text-[#9a9a9a] hover:text-white hover:bg-[#1b1b1b]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {activeGroup === "message" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          <Card title="Hook" subtitle="Entry signal and mechanism" isOpen={Boolean(openCards.hook)} onToggle={() => toggleCard("hook")}>
            <FieldRow label="Raw" value={data.hook.raw} />
            <FieldRow label="Type" value={data.hook.type} />
            <FieldRow label="Mechanism" value={data.hook.mechanism} />
            <FieldRow label="Confidence" value={data.hook.confidence} />
          </Card>

          <Card title="Hook Quality" subtitle="Strength and reuse risk" isOpen={Boolean(openCards.hookQuality)} onToggle={() => toggleCard("hookQuality")}>
            <FieldRow label="Strength" value={data.hookQuality.strength} />
            <FieldRow label="Why" value={data.hookQuality.why} />
            <FieldRow label="Risk" value={data.hookQuality.risk} />
          </Card>

          <Card title="Angle" subtitle="Core thesis and assumptions" isOpen={Boolean(openCards.angle)} onToggle={() => toggleCard("angle")}>
            <FieldRow label="Claim" value={data.angle.claim} />
            <FieldRow label="Supporting Logic" value={data.angle.supportingLogic} />
            <FieldRow label="Hidden Assumption" value={data.angle.hiddenAssumption} />
            <FieldRow label="Confidence" value={data.angle.confidence} />
          </Card>

          <Card title="Core Truth" subtitle="The hard insight behind performance" isOpen={Boolean(openCards.coreTruth)} onToggle={() => toggleCard("coreTruth")}>
            <FieldRow label="Insight" value={data.coreTruth.insight} />
            <FieldRow label="Trigger Moment" value={data.coreTruth.triggerMoment} />
            <FieldRow label="Confidence" value={data.coreTruth.confidence} />
          </Card>
        </div>
      ) : null}

      {activeGroup === "mechanics" ? (
        <div className="space-y-3 md:space-y-4">
          <Card title="Attention" subtitle="Pattern break, escalation, retention" isOpen={Boolean(openCards.attention)} onToggle={() => toggleCard("attention")}>
            <FieldRow label="Pattern Break" value={data.attention.patternBreak} />
            <div className="py-3 border-b border-[#1f1f1f]">
              <p className="text-[#8a8a8a] text-xs md:text-sm uppercase tracking-[0.12em] mb-2">Escalation Beats</p>
              <div className="flex flex-wrap gap-2">
                {data.attention.escalation.map((item, index) => (
                  <Tag key={`${item}-${index}`} text={item} />
                ))}
              </div>
            </div>
            <FieldRow label="Retention Driver" value={data.attention.retentionDriver.description} />
            <FieldRow label="Retention Confidence" value={data.attention.retentionDriver.confidence} />
          </Card>

          <Card title="Proof Mechanics" subtitle="What creates credibility" isOpen={Boolean(openCards.proof)} onToggle={() => toggleCard("proof")}>
            <div className="py-3 border-b border-[#1f1f1f]">
              <p className="text-[#8a8a8a] text-xs md:text-sm uppercase tracking-[0.12em] mb-2">Evidence Used</p>
              <div className="flex flex-wrap gap-2">
                {data.proofMechanics.evidenceUsed.map((item, index) => (
                  <Tag key={`${item}-${index}`} text={item} />
                ))}
              </div>
            </div>
            <FieldRow label="Transferable Pattern" value={data.proofMechanics.transferablePattern.pattern} />
            <FieldRow label="Pattern Confidence" value={data.proofMechanics.transferablePattern.confidence} />
          </Card>
        </div>
      ) : null}

      {activeGroup === "structure" ? (
        <Card title="Structure DNA" subtitle="Flow phases and retention moments" isOpen={Boolean(openCards.structure)} onToggle={() => toggleCard("structure")}>
          <div className="space-y-3">
            <p className="text-white text-sm md:text-base font-semibold">Phases</p>
            {data.structureDNA.phases.map((phase, index) => (
              <div key={`phase-${index}`} className="rounded-lg border border-[#262626] bg-[#0f0f0f] p-2.5 md:p-3">
                <FieldRow label="Phase" value={phase.phase} />
                <FieldRow label="Goal" value={phase.goal} />
                <FieldRow label="Tactic" value={phase.tactic} />
                <FieldRow label="Source" value={phase.source} />
              </div>
            ))}
          </div>

          <div className="space-y-3 mt-4">
            <p className="text-white text-sm md:text-base font-semibold">Retention Moments</p>
            {data.structureDNA.retentionMoments.map((moment, index) => (
              <div key={`moment-${index}`} className="rounded-lg border border-[#262626] bg-[#0f0f0f] p-2.5 md:p-3">
                <FieldRow label="Moment" value={moment.moment} />
                <FieldRow label="Why It Works" value={moment.whyItWorks} />
                <FieldRow label="Pattern" value={moment.pattern} />
                <FieldRow label="Primary" value={moment.isPrimary ? "Yes" : "No"} />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {activeGroup === "audience" ? (
        <Card title="Audience" subtitle="Who reacts and why" isOpen={Boolean(openCards.audience)} onToggle={() => toggleCard("audience")}>
          <FieldRow label="Profile" value={data.audience.profile} />

          <div className="space-y-3 mt-3">
            <p className="text-white text-sm md:text-base font-semibold">Pain Map</p>
            {data.audience.painMap.map((pain, index) => (
              <div key={`pain-${index}`} className="rounded-lg border border-[#262626] bg-[#0f0f0f] p-2.5 md:p-3">
                <FieldRow label="Pain" value={pain.pain} />
                <FieldRow label="Feeling" value={pain.feeling} />
                <FieldRow label="Real Scenario" value={pain.realScenario} />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <p className="text-white text-sm md:text-base font-semibold mb-2">Comment Patterns</p>
            <FieldRow label="Repeated Pain" value={data.audience.commentPatterns.repeatedPain} />
            <div className="py-3 border-b border-[#1f1f1f]">
              <p className="text-[#8a8a8a] text-xs md:text-sm uppercase tracking-[0.12em] mb-2">Language Used</p>
              <div className="flex flex-wrap gap-2">
                {data.audience.commentPatterns.languageUsed.map((item, index) => (
                  <Tag key={`${item}-${index}`} text={item} />
                ))}
              </div>
            </div>
            <FieldRow label="Misunderstanding" value={data.audience.commentPatterns.misunderstanding} />
          </div>
        </Card>
      ) : null}

      {activeGroup === "strategy" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          <Card title="Weak Points" subtitle="Where retention drops" isOpen={Boolean(openCards.weakPoints)} onToggle={() => toggleCard("weakPoints")}>
            <FieldRow label="Where It Loses Attention" value={data.weakPoints.whereItLosesAttention} />
            <FieldRow label="Why" value={data.weakPoints.why} />
          </Card>

          <Card title="Priority" subtitle="Most important performance drivers" isOpen={Boolean(openCards.priority)} onToggle={() => toggleCard("priority")}>
            <FieldRow label="Primary Driver" value={data.priority.primaryDriver} />
            <FieldRow label="Secondary Driver" value={data.priority.secondaryDriver} />
            <FieldRow label="Why" value={data.priority.why} />
          </Card>
        </div>
      ) : null}
    </div>
  );
}
