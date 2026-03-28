"use client";

import { AnalysisResult } from "@/app/lib/types";
import { SectionCard } from "./SectionCard";

interface Props {
  data: AnalysisResult;
}

const toneColors: Record<string, string> = {
  curious: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  emotional: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  shocking: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  calm: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
  storytelling: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
};

const formatColors = [
  "border-l-blue-500",
  "border-l-orange-500",
  "border-l-emerald-500",
  "border-l-rose-500",
  "border-l-purple-500",
  "border-l-amber-500",
];

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-[#1a1a1a] last:border-0">
      <span className="text-[#666] text-sm min-w-[140px] shrink-0">{label}</span>
      <span className="text-[#ccc] text-sm leading-relaxed">{value}</span>
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#bbb] text-sm leading-relaxed mt-3">{children}</p>
  );
}

export function AnalysisDisplay({ data }: Props) {
  let idx = 0;

  return (
    <div className="space-y-3">
      {/* ── 1. CORE INSIGHT ── */}
      <SectionCard
        index={idx++}
        title="Core Insight"
        icon="💡"
        badge="Section 1"
        defaultOpen={true}
      >
        <div className="mt-4 relative pl-4 red-line">
          <p className="text-white text-base leading-relaxed font-medium">
            {data.coreInsight?.summary}
          </p>
        </div>
      </SectionCard>

      {/* ── 2. CORE ANGLE ── */}
      <SectionCard index={idx++} title="Core Angle" icon="🎯" badge="Section 2">
        <div className="mt-4 space-y-0">
          <FieldRow label="Unique Angle" value={data.coreAngle?.uniqueAngle} />
          <FieldRow
            label="Belief Challenged"
            value={data.coreAngle?.beliefChallenged}
          />
          <FieldRow label="Why It Works" value={data.coreAngle?.whyItWorks} />
        </div>
      </SectionCard>

      {/* ── 3. ANGLE EXPANSION ── */}
      <SectionCard
        index={idx++}
        title="Angle Expansion"
        icon="🔀"
        badge={`${data.angleExpansion?.length || 0} angles`}
      >
        <div className="mt-4 grid gap-3">
          {data.angleExpansion?.map((a, i) => (
            <div
              key={i}
              className="bg-[#0d0d0d] rounded-lg p-3 border border-[#1e1e1e]"
            >
              <div className="flex items-start gap-2 mb-1">
                <span className="num-badge mt-0.5">{i + 1}</span>
                <span className="text-white font-semibold text-sm">{a.name}</span>
              </div>
              <p className="text-[#999] text-xs leading-relaxed pl-7">
                {a.explanation}
              </p>
              <div className="pl-7 mt-2">
                <span className="tag-pill bg-[#1a0505] text-[#ff6b35] text-[10px]">
                  ⚡ {a.emotionalTrigger}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── 4. KEYWORD ANALYSIS ── */}
      <SectionCard
        index={idx++}
        title="Keyword & Language Patterns"
        icon="🔍"
        badge="Section 4"
      >
        <div className="mt-4 space-y-4">
          {(
            [
              {
                label: "Repeated Keywords",
                items: data.keywordAnalysis?.repeatedKeywords,
                color: "bg-[#1a1a1a] text-[#ccc]",
              },
              {
                label: "Emotional Words",
                items: data.keywordAnalysis?.emotionalWords,
                color: "bg-rose-900/20 text-rose-400",
              },
              {
                label: "Power Words",
                items: data.keywordAnalysis?.powerWords,
                color: "bg-orange-900/20 text-orange-400",
              },
              {
                label: "Simple Repeated Phrasing",
                items: data.keywordAnalysis?.simplePhrasing,
                color: "bg-blue-900/20 text-blue-400",
              },
            ] as const
          ).map(({ label, items, color }) => (
            <div key={label}>
              <p className="text-[#666] text-xs uppercase tracking-widest mb-2">
                {label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {items?.map((kw, i) => (
                  <span
                    key={i}
                    className={`tag-pill ${color} normal-case text-xs font-medium`}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className="text-[#666] text-xs uppercase tracking-widest mb-2">
              Why They Work
            </p>
            <Prose>{data.keywordAnalysis?.psychologicalExplanation}</Prose>
          </div>
        </div>
      </SectionCard>

      {/* ── 5. HOOK BREAKDOWN ── */}
      <SectionCard
        index={idx++}
        title="Hook Structure Breakdown"
        icon="🪝"
        badge="Section 5"
      >
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                label: "Pattern Interrupt",
                value: data.hookBreakdown?.patternInterrupt,
                color: "border-orange-500/30 bg-orange-500/5",
              },
              {
                label: "Curiosity Gap",
                value: data.hookBreakdown?.curiosityGap,
                color: "border-blue-500/30 bg-blue-500/5",
              },
              {
                label: "Emotional Trigger",
                value: data.hookBreakdown?.emotionalTrigger,
                color: "border-rose-500/30 bg-rose-500/5",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className={`rounded-lg p-3 border ${color}`}
              >
                <p className="text-[#888] text-xs uppercase tracking-wider mb-1.5">
                  {label}
                </p>
                <p className="text-[#ccc] text-sm leading-relaxed">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[#666] text-xs uppercase tracking-widest mb-2">
              10 New Hooks
            </p>
            <div className="space-y-2">
              {data.hookBreakdown?.newHooks?.map((hook, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-start bg-[#0d0d0d] rounded-lg px-3 py-2.5 border border-[#1a1a1a]"
                >
                  <span className="num-badge mt-0.5">{i + 1}</span>
                  <p className="text-[#ccc] text-sm leading-relaxed">{hook}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── 6. STRUCTURE DNA ── */}
      <SectionCard
        index={idx++}
        title="Structure DNA"
        icon="🧬"
        badge="Section 6"
      >
        <div className="mt-4 space-y-0">
          {[
            { label: "Hook", value: data.structureDNA?.hook, emoji: "🎣" },
            { label: "Setup", value: data.structureDNA?.setup, emoji: "🏗️" },
            {
              label: "Contrast / Story",
              value: data.structureDNA?.contrastStory,
              emoji: "⚔️",
            },
            {
              label: "Insight Reveal",
              value: data.structureDNA?.insightReveal,
              emoji: "💎",
            },
            {
              label: "Value Delivery",
              value: data.structureDNA?.valueDelivery,
              emoji: "📦",
            },
            {
              label: "Action / Conclusion",
              value: data.structureDNA?.actionConclusion,
              emoji: "🚀",
            },
          ].map(({ label, value, emoji }, i) => (
            <div
              key={i}
              className="flex gap-3 py-3 border-b border-[#1a1a1a] last:border-0"
            >
              <span className="text-base mt-0.5">{emoji}</span>
              <div>
                <p className="text-[#888] text-xs uppercase tracking-wider mb-0.5">
                  {label}
                </p>
                <p className="text-[#ccc] text-sm leading-relaxed">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── 7. AUDIENCE PROFILE ── */}
      <SectionCard
        index={idx++}
        title="Audience Profile"
        icon="👤"
        badge="Section 7"
      >
        <div className="mt-4 space-y-0">
          <FieldRow
            label="Ideal Viewer"
            value={data.audienceProfile?.idealViewer}
          />
          <FieldRow label="Age Range" value={data.audienceProfile?.ageRange} />
          <FieldRow
            label="Income Level"
            value={data.audienceProfile?.incomeLevel}
          />
          <FieldRow
            label="Life Stage"
            value={data.audienceProfile?.lifeStage}
          />
          <FieldRow
            label="Current Situation"
            value={data.audienceProfile?.situation}
          />
        </div>
      </SectionCard>

      {/* ── 8. PAIN MAP ── */}
      <SectionCard
        index={idx++}
        title="Pain Map"
        icon="🩸"
        badge={`${data.painMap?.length || 0} pains`}
      >
        <div className="mt-4 space-y-3">
          {data.painMap?.map((p, i) => (
            <div
              key={i}
              className="relative bg-[#0d0d0d] rounded-lg p-3 border border-[#1e1e1e] pl-4 overflow-hidden"
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l"
                style={{
                  background: `hsl(${(i * 37) % 360}, 70%, 55%)`,
                }}
              />
              <p className="text-white font-semibold text-sm mb-1">{p.pain}</p>
              <p className="text-[#999] text-xs leading-relaxed">
                {p.explanation}
              </p>
              <p className="text-[#666] text-xs mt-1.5 italic">
                📍 {p.realLifeExample}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── 9. COMMENT MINING ── */}
      <SectionCard
        index={idx++}
        title="Comment Mining"
        icon="💬"
        badge="Section 9"
      >
        {!data.commentMining || data.commentMining.length === 0 ? (
          <div className="mt-4 flex items-center gap-2 text-[#555] text-sm py-3">
            <span>—</span>
            <span>No comments were provided for analysis.</span>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {data.commentMining.map((c, i) => (
              <div
                key={i}
                className="bg-[#0d0d0d] rounded-lg p-3 border border-[#1e1e1e]"
              >
                <p className="text-white font-semibold text-sm mb-2">
                  {c.theme}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {c.examplePhrases?.map((ph, j) => (
                    <span
                      key={j}
                      className="tag-pill bg-[#1a1a1a] text-[#aaa] normal-case"
                    >
                      &ldquo;{ph}&rdquo;
                    </span>
                  ))}
                </div>
                <p className="text-[#777] text-xs leading-relaxed italic">
                  {c.psychologicalMeaning}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── 10. DESIRE MAP ── */}
      <SectionCard
        index={idx++}
        title="Desire Map — The Cure"
        icon="✨"
        badge="Section 10"
      >
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-[#0d1a0d] to-[#0d0d0d] rounded-lg p-4 border border-emerald-900/30">
            <p className="text-emerald-500 text-xs uppercase tracking-widest mb-2">
              What They Want
            </p>
            <p className="text-[#ccc] text-sm leading-relaxed">
              {data.desireMap?.whatTheyWant}
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#1a0d1a] to-[#0d0d0d] rounded-lg p-4 border border-purple-900/30">
            <p className="text-purple-400 text-xs uppercase tracking-widest mb-2">
              Emotional State Chasing
            </p>
            <p className="text-[#ccc] text-sm leading-relaxed">
              {data.desireMap?.emotionalStateChasing}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ── 11. CONTENT OPPORTUNITIES ── */}
      <SectionCard
        index={idx++}
        title="Content Opportunities"
        icon="🎬"
        badge="5 video ideas"
      >
        <div className="mt-4 space-y-3">
          {data.contentOpportunities?.map((v, i) => (
            <div
              key={i}
              className="bg-[#0d0d0d] rounded-lg p-4 border border-[#1e1e1e]"
            >
              <div className="flex items-start gap-2 mb-3">
                <span className="num-badge mt-0.5">{i + 1}</span>
                <p className="text-white font-semibold text-sm leading-snug">
                  {v.title}
                </p>
              </div>
              <div className="pl-7 space-y-1.5">
                <FieldRow label="Target Pain" value={v.targetPain} />
                <FieldRow label="Desired Outcome" value={v.desiredOutcome} />
                <FieldRow label="Unique Angle" value={v.uniqueAngle} />
                <div className="mt-2 bg-[#0a0a0a] rounded p-2.5 border border-[#222]">
                  <p className="text-[#555] text-xs uppercase tracking-wider mb-1">
                    Hook
                  </p>
                  <p className="text-[#ccc] text-xs leading-relaxed">{v.hook}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── 12. DIFFERENTIATION STRATEGY ── */}
      <SectionCard
        index={idx++}
        title="Differentiation Strategy"
        icon="⚡"
        badge="Section 12"
      >
        <div className="mt-4 space-y-0">
          <FieldRow
            label="Tone"
            value={data.differentiationStrategy?.tone}
          />
          <FieldRow
            label="Structure"
            value={data.differentiationStrategy?.structure}
          />
          <FieldRow
            label="Storytelling"
            value={data.differentiationStrategy?.storytelling}
          />
          <FieldRow
            label="Perspective"
            value={data.differentiationStrategy?.perspective}
          />
        </div>
      </SectionCard>

      {/* ── 13. VIRAL RISK ANALYSIS ── */}
      <SectionCard
        index={idx++}
        title="Viral Risk Analysis"
        icon="⚠️"
        badge="Section 13"
      >
        <div className="mt-4 space-y-3">
          <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-3">
            <p className="text-red-400 text-xs uppercase tracking-wider mb-1">
              Mass-Produced Risk
            </p>
            <p className="text-[#ccc] text-sm leading-relaxed">
              {data.viralRiskAnalysis?.massProducedRisk}
            </p>
          </div>
          <div className="bg-orange-900/10 border border-orange-900/30 rounded-lg p-3">
            <p className="text-orange-400 text-xs uppercase tracking-wider mb-1">
              Inauthentic Signals
            </p>
            <p className="text-[#ccc] text-sm leading-relaxed">
              {data.viralRiskAnalysis?.inauthenticSignals}
            </p>
          </div>
          <div className="bg-emerald-900/10 border border-emerald-900/30 rounded-lg p-3">
            <p className="text-emerald-400 text-xs uppercase tracking-wider mb-1">
              How to Fix
            </p>
            <p className="text-[#ccc] text-sm leading-relaxed">
              {data.viralRiskAnalysis?.howToFix}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ── 14. CONTENT GAP ANALYSIS ── */}
      <SectionCard
        index={idx++}
        title="Content Gap Analysis"
        icon="🔭"
        badge="Section 14"
      >
        <div className="mt-4 space-y-4">
          <FieldRow
            label="Missing Elements"
            value={data.contentGapAnalysis?.missingElements}
          />
          <FieldRow
            label="Unanswered Questions"
            value={data.contentGapAnalysis?.unansweredQuestions}
          />
          <FieldRow
            label="Underexplored Angles"
            value={data.contentGapAnalysis?.underexploredAngles}
          />

          <div>
            <p className="text-[#666] text-xs uppercase tracking-widest mb-2">
              5 Gap-Based Video Ideas
            </p>
            <div className="space-y-2">
              {data.contentGapAnalysis?.gapBasedVideoIdeas?.map((idea, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-start bg-[#0d0d0d] rounded-lg px-3 py-2.5 border border-[#1a1a1a]"
                >
                  <span className="num-badge mt-0.5">{i + 1}</span>
                  <div>
                    <p className="text-[#ccc] text-sm font-medium">
                      {idea.title}
                    </p>
                    <p className="text-[#666] text-xs mt-0.5">{idea.gap}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── 15. FORMAT VARIATIONS ── */}
      <SectionCard
        index={idx++}
        title="Format Variations"
        icon="🎭"
        badge="6 formats"
      >
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.formatVariations?.map((f, i) => (
            <div
              key={i}
              className={`bg-[#0d0d0d] rounded-lg p-3 border-l-2 border border-[#1e1e1e] ${formatColors[i % formatColors.length]}`}
            >
              <p className="text-white font-semibold text-sm mb-1.5">
                {f.format}
              </p>
              <p className="text-[#999] text-xs leading-relaxed mb-2">
                {f.description}
              </p>
              <p className="text-[#666] text-xs italic">
                👁 {f.viewerExperience}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── 16. SCRIPT STARTERS ── */}
      <SectionCard
        index={idx++}
        title="Script Starters"
        icon="✍️"
        badge="Section 16"
      >
        <div className="mt-4 space-y-5">
          <div>
            <p className="text-[#666] text-xs uppercase tracking-widest mb-3">
              5 Opening Paragraphs
            </p>
            <div className="space-y-3">
              {data.scriptStarters?.openings?.map((o, i) => (
                <div
                  key={i}
                  className="bg-[#0d0d0d] rounded-lg p-4 border border-[#1e1e1e]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`tag-pill text-[10px] ${toneColors[o.tone] || "bg-[#1a1a1a] text-[#888]"}`}
                    >
                      {o.tone}
                    </span>
                  </div>
                  <p className="text-[#ccc] text-sm leading-relaxed">{o.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[#666] text-xs uppercase tracking-widest mb-3">
              5 Strong Closings
            </p>
            <div className="space-y-2">
              {data.scriptStarters?.closings?.map((c, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-start bg-[#0d0d0d] rounded-lg px-3 py-2.5 border border-[#1a1a1a]"
                >
                  <span className="num-badge mt-0.5">{i + 1}</span>
                  <p className="text-[#ccc] text-sm leading-relaxed">{c}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
