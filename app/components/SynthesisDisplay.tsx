"use client";

import { useMemo } from "react";
import type { StrategicSynthesis } from "@/app/lib/types";

interface Props {
  data: Partial<StrategicSynthesis>;
}

const esc = (v: unknown) =>
  `"${String(v ?? "").replace(/"/g, '""')}"`;

function Row({
  label,
  value,
  note,
}: {
  label: string;
  value?: string;
  note?: string;
}) {
  if (!value) return null;

  return (
    <div className="py-2">
      <p className="text-[#8a8a8a] text-xs uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-[#e2e2e2] text-sm leading-relaxed">{value}</p>
      {note && (
        <p className="text-[#555] text-[11px] mt-1 italic">{note}</p>
      )}
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#222] bg-gradient-to-b from-[#101010] to-[#0b0b0b] p-4">
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      {note && (
        <p className="text-[#555] text-[11px] italic mb-3">{note}</p>
      )}
      {children}
    </div>
  );
}

export function SynthesisDisplay({ data }: Props) {
  console.log("data", data)
  const rank = data.ranking;

  const csvContent = useMemo(() => {
    const r = (s: string, f: string, v: unknown): string[] | null =>
      v ? [s, f, String(v)] : null;

    const rows: (string[] | null)[] = [
      r("Focus", "Primary", data.focusPriority?.primary),
      r("Focus", "Reason", data.focusPriority?.reason),

      r("Core", "Contradiction", data.coreEngine?.contradiction),
      r("Core", "Behavior Loop", data.coreEngine?.behaviorLoop),
      r("Core", "Identity Pressure", data.coreEngine?.identityPressure),
      r("Core", "No Win Loop", data.coreEngine?.noWinLoop),

      r("Pain", "Surface", data.pain?.surface),
      r("Pain", "Real", data.pain?.real),
      r("Pain", "Scenario", data.pain?.scenario),

      r("Belief", "From", data.beliefShift?.from),
      r("Belief", "Break", data.beliefShift?.breakMoment),
      r("Belief", "To", data.beliefShift?.to),

      r("Ranking", "Top1", rank?.top1),
      r("Ranking", "Top2", rank?.top2),
      r("Ranking", "Top3", rank?.top3),
      r("Ranking", "Reason", rank?.reason),

      r("Author", "Mode", data.authorControl?.mode),
      r("Author", "Override", data.authorControl?.overridePoint),
    ];

    const valid = rows.filter(Boolean) as string[][];

    return [
      ["Section", "Field", "Value"],
      ...valid,
    ]
      .map((row) => row.map(esc).join(","))
      .join("\n");
  }, [data, rank]);

  return (
    <div className="space-y-4">

      {/* Focus */}
      <Section title="Focus Priority">
        <Row
          label="Primary"
          value={data.focusPriority?.primary}
        />
        <Row
          label="Reason"
          value={data.focusPriority?.reason}
        />
      </Section>

      {/* Core */}
      <Section title="Core Engine">
        <Row label="Contradiction" value={data.coreEngine?.contradiction} />
        <Row label="Behavior Loop" value={data.coreEngine?.behaviorLoop} />
        <Row label="Identity Pressure" value={data.coreEngine?.identityPressure} />
        <Row label="No Win Loop" value={data.coreEngine?.noWinLoop} />
      </Section>

      {/* Pain */}
      <Section title="Pain Layer">
        <Row label="Surface" value={data.pain?.surface} />
        <Row label="Real" value={data.pain?.real} />
        <Row label="Scenario" value={data.pain?.scenario} />
      </Section>

      {/* Belief */}
      <Section title="Belief Shift">
        <Row label="From" value={data.beliefShift?.from} />
        <Row label="Break Moment" value={data.beliefShift?.breakMoment} />
        <Row label="To" value={data.beliefShift?.to} />
      </Section>

      {/* Ranking */}
      {rank && (
        <Section title="Ranking Signals">
          <Row label="#1" value={rank.top1} />
          <Row label="#2" value={rank.top2} />
          <Row label="#3" value={rank.top3} />
          <Row label="Reason" value={rank.reason} />
        </Section>
      )}

      {/* Author */}
      <Section title="Author Control">
        <Row label="Mode" value={data.authorControl?.mode} />
        <Row
          label="Override Point"
          value={data.authorControl?.overridePoint}
        />
      </Section>

      {/* CSV */}
      <Section title="Export Preview">
        <pre className="text-xs text-[#888] overflow-auto whitespace-pre">
          {csvContent}
        </pre>
      </Section>
    </div>
  );
}