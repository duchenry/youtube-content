"use client";

import { AnalysisResult } from "@/app/lib/types";
import { useState } from "react";

interface Props {
  data: AnalysisResult;
}

function normalizeText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value) return "";
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value
        .map((item) => normalizeText(item))
        .filter(Boolean)
        .join("; ");
    }
    if ("text" in value && typeof (value as any).text === "string") {
      return (value as any).text;
    }
    if ("type" in value && "text" in value && typeof (value as any).text === "string") {
      return (value as any).text;
    }
    return JSON.stringify(value);
  }
  return String(value);
}

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  return (
    <div className="mb-4 pb-4 border-b border-[#222] last:border-0">
      <p className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-[#ddd] text-sm leading-relaxed whitespace-pre-wrap">{normalized}</p>
    </div>
  );
}

function SubsectionButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded text-sm font-semibold transition-all ${
        isActive
          ? 'bg-green-600 text-white shadow-md'
          : 'bg-[#141414] text-[#888] hover:bg-[#1a1a1a] hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

export function AnalysisDisplay({ data }: Props) {
  const [activeStep, setActiveStep] = useState(1);
  const [activeStep1Sub, setActiveStep1Sub] = useState('coreTruth');
  const [activeStep2Sub, setActiveStep2Sub] = useState('viewer');
  const [activeStep3Sub, setActiveStep3Sub] = useState('angles');
  const [selectedHookIndex, setSelectedHookIndex] = useState<number | null>(null);
  const [openingLoading, setOpeningLoading] = useState(false);
  const [openingError, setOpeningError] = useState<string | null>(null);
  const [generatedOpening, setGeneratedOpening] = useState<{
    hook: string;
    bridge: string;
    fullOpening: string;
    whyItWorks: string;
    riskLevel: string;
    riskWhy: string;
    softVersion: string;
  } | null>(null);

  const effectiveOpening = generatedOpening?.fullOpening || data.script?.opening || '';

  async function handleGenerateOpening() {
    if (selectedHookIndex === null) {
      setOpeningError('Please select a hook first.');
      return;
    }

    setOpeningError(null);
    setOpeningLoading(true);

    try {
      const res = await fetch('/api/opening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: data,
          selectedHookIndex,
          platform: 'youtube-long',
          creatorVoice: '',
          targetViewer: data.viewer?.profile || '',
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to generate opening.');
      }

      setGeneratedOpening({
        hook: normalizeText(json.opening?.hook),
        bridge: normalizeText(json.opening?.bridge),
        fullOpening: normalizeText(json.opening?.fullOpening),
        whyItWorks: normalizeText(json.opening?.whyItWorks),
        riskLevel: normalizeText(json.riskCheck?.riskLevel),
        riskWhy: normalizeText(json.riskCheck?.why),
        softVersion: normalizeText(json.riskCheck?.softVersion),
      });
      setActiveStep3Sub('script');
    } catch (err) {
      setOpeningError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setOpeningLoading(false);
    }
  }

  const exportToCSV = () => {
    const selectedHook =
      selectedHookIndex !== null && data.hooks?.[selectedHookIndex]
        ? data.hooks[selectedHookIndex]
        : null;
    const effectiveHookText = generatedOpening?.hook || selectedHook?.text || '';
    const effectiveBridge = generatedOpening?.bridge || selectedHook?.bridge || '';

    const rows: string[][] = [];
    rows.push(['Section', 'Field', 'Value']);

    if (data.coreTruth) {
      rows.push(['Core Truth', 'Insight', data.coreTruth.insight || '']);
      rows.push(['Core Truth', 'Trigger', data.coreTruth.trigger || '']);
    }

    if (data.attention) {
      rows.push(['Attention', 'What Feels Different', data.attention.patternBreak?.whatFeelsDifferent || '']);
      rows.push(['Attention', 'Why It Grabs', data.attention.patternBreak?.whyItGrabs || '']);
      rows.push(['Attention', 'Escalation', data.attention.escalation || '']);
      rows.push(['Attention', 'Retention', data.attention.retention || '']);
    }

    if (data.persuasion) {
      rows.push(['Persuasion', 'Belief Destroyed', data.persuasion.beliefDestroyed || '']);
      rows.push(['Persuasion', 'Belief Installed', data.persuasion.beliefInstalled || '']);
    }

    if (data.structure) {
      rows.push(['Structure', 'Hook Mechanism', data.structure.hookMechanism || '']);
      rows.push(['Structure', 'Reveal Moment', data.structure.revealMoment || '']);
      rows.push(['Structure', 'Payoff', data.structure.payoff || '']);
    }

    if (data.financialReality) {
      rows.push(['Financial Reality', 'Numbers Used', data.financialReality.numbersUsed || '']);
      rows.push(['Financial Reality', 'Perception Effect', data.financialReality.perceptionEffect || '']);
      rows.push(['Financial Reality', 'Manipulation', data.financialReality.manipulation || '']);
    }

    if (data.proofMechanics) {
      rows.push(['Proof Mechanics', 'Evidence Used', data.proofMechanics.evidenceUsed || '']);
      rows.push(['Proof Mechanics', 'Perception Effect', data.proofMechanics.perceptionEffect || '']);
      rows.push(['Proof Mechanics', 'Framing', data.proofMechanics.framing || '']);
      rows.push(['Proof Mechanics', 'Transferable Pattern', data.proofMechanics.transferablePattern || '']);
    }

    if (data.structureDNA) {
      data.structureDNA.phases?.forEach((phase, i) => {
        rows.push([`Structure DNA Phase ${i + 1}`, 'Phase', phase.phase || '']);
        rows.push([`Structure DNA Phase ${i + 1}`, 'Time Range', phase.timeRange || '']);
        rows.push([`Structure DNA Phase ${i + 1}`, 'Goal', phase.goal || '']);
        rows.push([`Structure DNA Phase ${i + 1}`, 'Tactic', phase.tactic || '']);
        rows.push([`Structure DNA Phase ${i + 1}`, 'Viewer State', phase.viewerState || '']);
      });
      data.structureDNA.transitions?.forEach((transition, i) => {
        rows.push([`Structure DNA Transition ${i + 1}`, 'From', transition.from || '']);
        rows.push([`Structure DNA Transition ${i + 1}`, 'To', transition.to || '']);
        rows.push([`Structure DNA Transition ${i + 1}`, 'Method', transition.method || '']);
        rows.push([`Structure DNA Transition ${i + 1}`, 'Line Example', transition.lineExample || '']);
      });
      data.structureDNA.retentionMoments?.forEach((moment, i) => {
        rows.push([`Structure DNA Retention ${i + 1}`, 'Moment', moment.moment || '']);
        rows.push([`Structure DNA Retention ${i + 1}`, 'Why It Works', moment.whyItWorks || '']);
        rows.push([`Structure DNA Retention ${i + 1}`, 'Pattern', moment.pattern || '']);
      });
    }

    if (data.viewer) {
      rows.push(['Viewer', 'Profile', data.viewer.profile || '']);
      rows.push(['Viewer', 'External Mask', data.viewer.externalMask || '']);
      rows.push(['Viewer', 'Internal Fear', data.viewer.internalFear || '']);
      rows.push(['Viewer', 'Trigger Moment', data.viewer.triggerMoment || '']);
    }

    if (data.egoThreat) {
      rows.push(['Ego Threat', 'What Hurts', data.egoThreat.whatHurts || '']);
      rows.push(['Ego Threat', 'Comparison', data.egoThreat.comparison || '']);
      rows.push(['Ego Threat', 'Private Truth', data.egoThreat.privateTruth || '']);
    }

    if (data.painMap) {
      data.painMap.forEach((p, i) => {
        rows.push([`Pain Map ${i + 1}`, 'Pain', p.pain || '']);
        rows.push([`Pain Map ${i + 1}`, 'Feeling', p.feeling || '']);
        rows.push([`Pain Map ${i + 1}`, 'Real Scenario', p.realScenario || '']);
      });
    }

    if (data.desire) {
      rows.push(['Desire', 'Surface', data.desire.surface || '']);
      rows.push(['Desire', 'Real', data.desire.real || '']);
      rows.push(['Desire', 'Identity Shift', data.desire.identityShift || '']);
    }

    if (data.differentiation) {
      rows.push(['Differentiation', 'POV Mode', data.differentiation.povMode || '']);
      rows.push(['Differentiation', 'Agreement', data.differentiation.agreement || '']);
      data.differentiation.destruction?.forEach((item, i) => {
        rows.push([`Differentiation Destruction ${i + 1}`, 'Point', item || '']);
      });
      rows.push(['Differentiation', 'New POV Core', data.differentiation.newPOV?.core || '']);
      rows.push(['Differentiation', 'New POV Edge', data.differentiation.newPOV?.edge || '']);
      rows.push(['Differentiation', 'Fake Good', data.differentiation.truthFilter?.fakeGood || '']);
      rows.push(['Differentiation', 'Real Truth', data.differentiation.truthFilter?.realTruth || '']);
    }

    if (data.angles) {
      data.angles.forEach((a, i) => {
        rows.push([`Angle ${i + 1}`, 'Type', a.type || '']);
        rows.push([`Angle ${i + 1}`, 'Idea', a.idea || '']);
        rows.push([`Angle ${i + 1}`, 'Why It Works', a.whyItWorks || '']);
      });
    }

    if (data.contentIdeas) {
      data.contentIdeas.forEach((idea, i) => {
        rows.push([`Content Idea ${i + 1}`, 'Title', idea.title || '']);
        rows.push([`Content Idea ${i + 1}`, 'Angle', idea.angle || '']);
        rows.push([`Content Idea ${i + 1}`, 'Core Conflict', idea.coreConflict || '']);
      });
    }

    if (data.hooks) {
      data.hooks.forEach((hook, i) => {
        rows.push([`Hook ${i + 1}`, 'Type', hook.type || '']);
        rows.push([`Hook ${i + 1}`, 'Text', hook.text || '']);
        rows.push([`Hook ${i + 1}`, 'Risk Level', hook.riskLevel || '']);
        rows.push([`Hook ${i + 1}`, 'Why Risky', hook.whyRisky || '']);
        rows.push([`Hook ${i + 1}`, 'Bridge', hook.bridge || '']);
      });
    }

    if (data.script) {
      rows.push(['Script', 'Key Turn Line', data.script.keyTurnLine || '']);
      rows.push(['Script', 'Opening', effectiveOpening || '']);
      rows.push(['Script', 'Hook (Selected)', effectiveHookText]);
      rows.push(['Script', 'Bridge', effectiveBridge]);
      rows.push(['Script', 'Why It Works', generatedOpening?.whyItWorks || '']);
      rows.push(['Script', 'Opening Risk Level', generatedOpening?.riskLevel || '']);
      rows.push(['Script', 'Risk Note', generatedOpening?.riskWhy || '']);
      rows.push(['Script', 'Safer Version', generatedOpening?.softVersion || '']);
      rows.push(['Script', 'Closing', data.script.closing || '']);
    }

    if (data.antiAI) {
      rows.push(['Anti AI', 'Avoid', (data.antiAI.avoid || []).join('; ')]);
      rows.push(['Anti AI', 'Fix', data.antiAI.fix || '']);
    }

    if (data.risk) {
      rows.push(['Risk', 'Why Feels AI', data.risk.whyFeelsAI || '']);
      rows.push(['Risk', 'Fix', data.risk.fix || '']);
    }

    const csvContent = rows
      .map((row) => row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'youtube-analysis-data.csv';
    link.click();
  };
  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={exportToCSV}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow-lg transition-all"
        >
          📊 Export to CSV
        </button>
      </div>

      {/* STEP NAVIGATION BUTTONS */}
      <div className="flex gap-3 border-b border-[#222] pb-4">
        <button
          onClick={() => setActiveStep(1)}
          className={`px-6 py-2 rounded-t-lg font-semibold text-sm transition-all ${
            activeStep === 1
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-[#141414] text-[#888] hover:bg-[#1a1a1a] hover:text-white'
          }`}
        >
          🔬 STEP 1
        </button>
        <button
          onClick={() => setActiveStep(2)}
          className={`px-6 py-2 rounded-t-lg font-semibold text-sm transition-all ${
            activeStep === 2
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-[#141414] text-[#888] hover:bg-[#1a1a1a] hover:text-white'
          }`}
        >
          👥 STEP 2
        </button>
        <button
          onClick={() => setActiveStep(3)}
          className={`px-6 py-2 rounded-t-lg font-semibold text-sm transition-all ${
            activeStep === 3
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-[#141414] text-[#888] hover:bg-[#1a1a1a] hover:text-white'
          }`}
        >
          🚀 STEP 3
        </button>
      </div>

      {/* STEP CONTENT */}
      <div className="bg-[#0a0a0a] rounded-lg p-6 border border-[#222]">
        {/* ===== STEP 1: CORE EXTRACTION ===== */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-6">🔬 Core Extraction</h2>
            
            {/* Subsection Buttons */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-[#222]">
              <SubsectionButton
                label="Core Truth"
                isActive={activeStep1Sub === 'coreTruth'}
                onClick={() => setActiveStep1Sub('coreTruth')}
              />
              <SubsectionButton
                label="Persuasion"
                isActive={activeStep1Sub === 'persuasion'}
                onClick={() => setActiveStep1Sub('persuasion')}
              />
              <SubsectionButton
                label="Attention"
                isActive={activeStep1Sub === 'attention'}
                onClick={() => setActiveStep1Sub('attention')}
              />
              <SubsectionButton
                label="Structure"
                isActive={activeStep1Sub === 'structure'}
                onClick={() => setActiveStep1Sub('structure')}
              />
              <SubsectionButton
                label="Financial Reality"
                isActive={activeStep1Sub === 'financialReality'}
                onClick={() => setActiveStep1Sub('financialReality')}
              />
              <SubsectionButton
                label="Structure DNA"
                isActive={activeStep1Sub === 'structureDNA'}
                onClick={() => setActiveStep1Sub('structureDNA')}
              />
            </div>

            {/* Content Display */}
            <div className="mt-6">
              {activeStep1Sub === 'coreTruth' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Core Truth</h3>
                  <FieldRow label="Insight" value={data.coreTruth?.insight} />
                  <FieldRow label="Trigger" value={data.coreTruth?.trigger} />
                </div>
              )}

              {activeStep1Sub === 'persuasion' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Persuasion</h3>
                  <FieldRow label="Belief Destroyed" value={data.persuasion?.beliefDestroyed} />
                  <FieldRow label="Belief Installed" value={data.persuasion?.beliefInstalled} />
                </div>
              )}

              {activeStep1Sub === 'attention' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Attention</h3>
                  <FieldRow label="Pattern Break" value={data.attention?.patternBreak?.whatFeelsDifferent} />
                  <FieldRow label="Why It Grabs" value={data.attention?.patternBreak?.whyItGrabs} />
                  <FieldRow label="Escalation" value={data.attention?.escalation} />
                  <FieldRow label="Retention" value={data.attention?.retention} />
                </div>
              )}

              {activeStep1Sub === 'structure' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Structure</h3>
                  <FieldRow label="Hook Mechanism" value={data.structure?.hookMechanism} />
                  <FieldRow label="Reveal Moment" value={data.structure?.revealMoment} />
                  <FieldRow label="Payoff" value={data.structure?.payoff} />
                </div>
              )}

              {activeStep1Sub === 'financialReality' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Financial Reality</h3>
                  <FieldRow label="Numbers Used" value={data.financialReality?.numbersUsed} />
                  <FieldRow label="Perception Effect" value={data.financialReality?.perceptionEffect} />
                  <FieldRow label="Manipulation" value={data.financialReality?.manipulation} />
                  <FieldRow label="Transferable Pattern" value={data.proofMechanics?.transferablePattern} />
                </div>
              )}

              {activeStep1Sub === 'structureDNA' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Structure DNA</h3>

                  <div className="mb-4">
                    <p className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-2">Phases</p>
                    {data.structureDNA?.phases?.map((phase, i) => (
                      <div key={i} className="bg-[#111] p-3 rounded border border-[#222] mb-2">
                        <p className="text-[#ccc] text-sm font-semibold">{phase.phase} ({phase.timeRange})</p>
                        <FieldRow label="Goal" value={phase.goal} />
                        <FieldRow label="Tactic" value={phase.tactic} />
                        <FieldRow label="Viewer State" value={phase.viewerState} />
                      </div>
                    ))}
                  </div>

                  <div className="mb-4">
                    <p className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-2">Transitions</p>
                    {data.structureDNA?.transitions?.map((transition, i) => (
                      <div key={i} className="bg-[#111] p-3 rounded border border-[#222] mb-2">
                        <p className="text-[#ccc] text-sm font-semibold">{transition.from} → {transition.to}</p>
                        <FieldRow label="Method" value={transition.method} />
                        <FieldRow label="Line Example" value={transition.lineExample} />
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-2">Retention Moments</p>
                    {data.structureDNA?.retentionMoments?.map((rm, i) => (
                      <div key={i} className="bg-[#111] p-3 rounded border border-[#222] mb-2">
                        <p className="text-[#ccc] text-sm font-semibold">{rm.moment}</p>
                        <FieldRow label="Why It Works" value={rm.whyItWorks} />
                        <FieldRow label="Pattern" value={rm.pattern} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== STEP 2: AUDIENCE PSYCHOLOGY ===== */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-6">👥 Audience Psychology</h2>
            
            {/* Subsection Buttons */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-[#222]">
              <SubsectionButton
                label="Viewer"
                isActive={activeStep2Sub === 'viewer'}
                onClick={() => setActiveStep2Sub('viewer')}
              />
              <SubsectionButton
                label="Ego Threat"
                isActive={activeStep2Sub === 'egoThreat'}
                onClick={() => setActiveStep2Sub('egoThreat')}
              />
              <SubsectionButton
                label="Pain Map"
                isActive={activeStep2Sub === 'painMap'}
                onClick={() => setActiveStep2Sub('painMap')}
              />
              <SubsectionButton
                label="Desire"
                isActive={activeStep2Sub === 'desire'}
                onClick={() => setActiveStep2Sub('desire')}
              />
              <SubsectionButton
                label="Differentiation"
                isActive={activeStep2Sub === 'differentiation'}
                onClick={() => setActiveStep2Sub('differentiation')}
              />
            </div>

            {/* Content Display */}
            <div className="mt-6">
              {activeStep2Sub === 'viewer' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Viewer</h3>
                  <FieldRow label="Profile" value={data.viewer?.profile} />
                  <FieldRow label="External Mask" value={data.viewer?.externalMask} />
                  <FieldRow label="Internal Fear" value={data.viewer?.internalFear} />
                  <FieldRow label="Trigger Moment" value={data.viewer?.triggerMoment} />
                </div>
              )}

              {activeStep2Sub === 'egoThreat' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Ego Threat</h3>
                  <FieldRow label="What Hurts" value={data.egoThreat?.whatHurts} />
                  <FieldRow label="Comparison" value={data.egoThreat?.comparison} />
                  <FieldRow label="Private Truth" value={data.egoThreat?.privateTruth} />
                </div>
              )}

              {activeStep2Sub === 'painMap' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Pain Map</h3>
                  {data.painMap?.map((item, i) => (
                    <div key={i} className="mb-4 pb-4 border-b border-[#222] last:border-0">
                      <p className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-2">Pain #{i + 1}</p>
                      <FieldRow label="Pain" value={item.pain} />
                      <FieldRow label="Feeling" value={item.feeling} />
                      <FieldRow label="Real Scenario" value={item.realScenario} />
                    </div>
                  ))}
                </div>
              )}

              {activeStep2Sub === 'desire' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Desire</h3>
                  <FieldRow label="Surface" value={data.desire?.surface} />
                  <FieldRow label="Real" value={data.desire?.real} />
                  <FieldRow label="Identity Shift" value={data.desire?.identityShift} />
                </div>
              )}

              {activeStep2Sub === 'differentiation' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Differentiation</h3>
                  <FieldRow label="POV Mode" value={data.differentiation?.povMode} />
                  <FieldRow label="Agreement" value={data.differentiation?.agreement} />
                  <div className="mb-4">
                    <p className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-2">Destruction</p>
                    <div className="space-y-2">
                      {data.differentiation?.destruction?.map((item, i) => (
                        <div key={i} className="bg-red-900/20 p-3 rounded border border-red-800/30">
                          <p className="text-red-300 text-sm">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <FieldRow label="New POV Core" value={data.differentiation?.newPOV?.core} />
                  <FieldRow label="New POV Edge" value={data.differentiation?.newPOV?.edge} />
                  <FieldRow label="Fake Good" value={data.differentiation?.truthFilter?.fakeGood} />
                  <FieldRow label="Real Truth" value={data.differentiation?.truthFilter?.realTruth} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== STEP 3: IDEA + EXECUTION ===== */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-6">🚀 Idea + Execution</h2>
            
            {/* Subsection Buttons */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-[#222]">
              <SubsectionButton
                label="Angles"
                isActive={activeStep3Sub === 'angles'}
                onClick={() => setActiveStep3Sub('angles')}
              />
              <SubsectionButton
                label="Content Ideas"
                isActive={activeStep3Sub === 'contentIdeas'}
                onClick={() => setActiveStep3Sub('contentIdeas')}
              />
              <SubsectionButton
                label="Hooks"
                isActive={activeStep3Sub === 'hooks'}
                onClick={() => setActiveStep3Sub('hooks')}
              />
              <SubsectionButton
                label="Script"
                isActive={activeStep3Sub === 'script'}
                onClick={() => setActiveStep3Sub('script')}
              />
              <SubsectionButton
                label="Anti-AI"
                isActive={activeStep3Sub === 'antiAI'}
                onClick={() => setActiveStep3Sub('antiAI')}
              />
              <SubsectionButton
                label="Risk"
                isActive={activeStep3Sub === 'risk'}
                onClick={() => setActiveStep3Sub('risk')}
              />
            </div>

            {/* Content Display */}
            <div className="mt-6">
              {activeStep3Sub === 'angles' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Angles</h3>
                  {data.angles?.map((angle, i) => (
                    <div key={i} className="bg-[#111] p-4 rounded border border-[#222]">
                      <p className="text-[#888] text-xs font-semibold uppercase mb-2">Angle {i + 1}</p>
                      <FieldRow label="Type" value={angle.type} />
                      <FieldRow label="Idea" value={angle.idea} />
                      <FieldRow label="Why It Works" value={angle.whyItWorks} />
                    </div>
                  ))}
                </div>
              )}

              {activeStep3Sub === 'contentIdeas' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Content Ideas</h3>
                  {data.contentIdeas?.map((idea, i) => (
                    <div key={i} className="bg-[#111] p-4 rounded border border-[#222]">
                      <p className="text-[#888] text-xs font-semibold uppercase mb-2">Idea {i + 1}</p>
                      <FieldRow label="Title" value={idea.title} />
                      <FieldRow label="Angle" value={idea.angle} />
                      <FieldRow label="Core Conflict" value={idea.coreConflict} />
                    </div>
                  ))}
                </div>
              )}

              {activeStep3Sub === 'hooks' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-2">Hooks</h3>
                  <p className="text-[#777] text-sm mb-4">
                    Step 1: choose one hook. Step 2: generate opening from selected hook.
                  </p>
                  {data.hooks?.map((hook, i) => (
                    <div
                      key={i}
                      className={`bg-[#111] p-3 rounded border ${
                        selectedHookIndex === i ? 'border-blue-500' : 'border-[#222]'
                      }`}
                    >
                      <p className="text-[#888] text-xs font-semibold uppercase mb-1">Hook {i + 1}: {hook.type}</p>
                      <p className="text-[#ddd] text-sm mb-2">{hook.text}</p>
                      <button
                        onClick={() => {
                          setSelectedHookIndex(i);
                          setOpeningError(null);
                        }}
                        className={`mb-3 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                          selectedHookIndex === i
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#1b1b1b] text-[#bbb] hover:bg-[#262626]'
                        }`}
                      >
                        {selectedHookIndex === i ? 'Selected Hook' : 'Select This Hook'}
                      </button>
                      <FieldRow label="Risk Level" value={hook.riskLevel} />
                      <FieldRow label="Why Risky" value={hook.whyRisky} />
                      <FieldRow label="Bridge" value={hook.bridge} />
                    </div>
                  ))}

                  <div className="pt-2">
                    <button
                      onClick={handleGenerateOpening}
                      disabled={openingLoading || selectedHookIndex === null}
                      className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-[#2a2a2a] disabled:text-[#666] text-white text-sm font-semibold transition-all"
                    >
                      {openingLoading ? 'Generating Opening...' : 'Generate Opening From Selected Hook'}
                    </button>
                  </div>

                  {openingError && (
                    <div className="bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2 text-red-400 text-sm">
                      {openingError}
                    </div>
                  )}
                </div>
              )}

              {activeStep3Sub === 'script' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Script</h3>
                  <FieldRow label="Key Turn Line" value={data.script?.keyTurnLine} />
                  <FieldRow label="Opening" value={effectiveOpening} />
                  <FieldRow label="Hook (Selected)" value={generatedOpening?.hook} />
                  <FieldRow label="Bridge" value={generatedOpening?.bridge} />
                  <FieldRow label="Why It Works" value={generatedOpening?.whyItWorks} />
                  <FieldRow label="Opening Risk Level" value={generatedOpening?.riskLevel} />
                  <FieldRow label="Risk Note" value={generatedOpening?.riskWhy} />
                  <FieldRow label="Safer Version" value={generatedOpening?.softVersion} />
                  <FieldRow label="Closing" value={data.script?.closing} />

                  <div className="pt-2">
                    <button
                      onClick={handleGenerateOpening}
                      disabled={openingLoading || selectedHookIndex === null}
                      className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-[#2a2a2a] disabled:text-[#666] text-white text-sm font-semibold transition-all"
                    >
                      {openingLoading ? 'Regenerating Opening...' : 'Regenerate Opening With Selected Hook'}
                    </button>
                  </div>

                  {selectedHookIndex === null && (
                    <p className="text-[#777] text-sm">
                      No hook selected yet. Go to Hooks tab, select one, then generate opening.
                    </p>
                  )}
                </div>
              )}

              {activeStep3Sub === 'antiAI' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Anti-AI</h3>
                  <div className="mb-4">
                    <p className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-3">Avoid</p>
                    <div className="flex flex-wrap gap-2">
                      {data.antiAI?.avoid?.map((item, i) => (
                        <span key={i} className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs">{item}</span>
                      ))}
                    </div>
                  </div>
                  <FieldRow label="How to Fix" value={data.antiAI?.fix} />
                </div>
              )}

              {activeStep3Sub === 'risk' && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-4">Risk Assessment</h3>
                  <FieldRow label="Why It Feels AI" value={data.risk?.whyFeelsAI} />
                  <FieldRow label="How to Fix" value={data.risk?.fix} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* INPUT COMMENTS - ALWAYS SHOW */}
      {/* <div className="bg-[#111] border border-[#222] rounded-lg p-4">
        <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-3">💬 Input Comments</h3>
        {data.inputComments && data.inputComments.length > 0 ? (
          <div className="space-y-2">
            {data.inputComments.map((comment, i) => (
              <div key={i} className="bg-[#0a0a0a] p-3 rounded border border-[#1a1a1a]">
                <p className="text-[#888] text-xs mb-1">Comment {i + 1}</p>
                <p className="text-[#ccc] text-sm">{comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#666] text-sm italic">No comments provided</p>
        )}
      </div> */}
    </div>
  );
}
