"use client";

import React, { useEffect, useState } from "react";
import { SectionCard } from "./SectionCard";
import {
  Step1DataIntake,
  Step3POVGate,
  Step4StrategicGaps,
  CoreAngleSelection,
  Step5HumanInput,
  Step5InputGuidance,
  Step9ScriptGeneration,
  Step10DistortionReminder,
  PilotSession,
} from "@/app/lib/types";
import { supabase } from "@/app/lib/supabase";
import { textToSlug } from "@/app/lib/utils";

interface PilotWizardProps {
  onComplete?: (session: PilotSession) => void;
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <div className="mb-4 pb-4 border-b border-[#222] last:border-0">
      <p className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-2">
        {label}
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-[#1a1a1a] border border-[#222] rounded text-[#ddd] text-sm p-3 focus:border-green-600 focus:outline-none resize-none"
      />
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled = false,
  variant = "primary",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "success" | "danger";
}) {
  const variants = {
    primary:
      "bg-green-600 hover:bg-green-700 text-white disabled:bg-[#333]",
    secondary: "bg-[#222] hover:bg-[#333] text-[#ddd] disabled:bg-[#1a1a1a]",
    success:
      "bg-green-600 hover:bg-green-700 text-white disabled:bg-[#333]",
    danger: "bg-red-600 hover:bg-red-700 text-white disabled:bg-[#333]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded font-semibold text-sm transition-all ${variants[variant]}`}
    >
      {label}
    </button>
  );
}

export default function PilotWizard({ onComplete }: PilotWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionId, setSessionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<PilotSession | null>(null);

  // Step-specific states
  const [step1Data, setStep1Data] = useState<Step1DataIntake>({
    competitorTranscript: "",
    topComments: Array(10).fill(""),
  });

  const [step3Data, setStep3Data] = useState<Step3POVGate>({
    whatYouBelieve: "",
    whatYouAttack: "",
    whoYouDefend: "",
  });

  const [povInterviewLayer, setPovInterviewLayer] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [povInterviewHistory, setPovInterviewHistory] = useState<
    Array<{ layer: number; question: string; answer: string }>
  >([]);
  const [povCurrentAnswer, setPovCurrentAnswer] = useState("");
  const [povSharpness, setPovSharpness] = useState<0 | 1 | 2 | 3>(0);
  const [povCurrentQuestion, setPovCurrentQuestion] = useState("");
  const [povCurrentObjective, setPovCurrentObjective] = useState("");
  const [povFeedback, setPovFeedback] = useState("");

  const [step5Data, setStep5Data] = useState<Step5HumanInput>({
    requestedInputs: [],
    angleDeepDiveAnswers: [],
  });
  const [step5Guidance, setStep5Guidance] = useState<Step5InputGuidance | null>(null);
  const [step4Data, setStep4Data] = useState<Step4StrategicGaps | null>(null);
  const [selectedAngleIndex, setSelectedAngleIndex] = useState<number | null>(null);
  const [coreAngleSelection, setCoreAngleSelection] = useState<CoreAngleSelection | null>(null);
  const [angleReasoning, setAngleReasoning] = useState("");
  const [angleExample, setAngleExample] = useState("");
  const [angleEmotion, setAngleEmotion] = useState("");
  const [angleChallenge, setAngleChallenge] = useState("");
  const [step9Data, setStep9Data] = useState<Step9ScriptGeneration | null>(null);
  const [step10Data, setStep10Data] = useState<Step10DistortionReminder | null>(null);
  const [slotEdits, setSlotEdits] = useState<Array<{ slotId: string; userText: string }>>([]);
  const [step10Notes, setStep10Notes] = useState("");

  const [step9Approved, setStep9Approved] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const callPilotAPI = async (action: string, data?: any) => {
    setLoading(true);
    try {
      const response = await fetch("/api/pilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          sessionId: sessionId || undefined,
          data,
          inputContract: {
            platform: "youtube-long",
            niche: "",
            creatorVoice: "",
            targetViewer: "",
          },
        }),
      });

      const result = await response.json();
      if (result.sessionId) setSessionId(result.sessionId);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const mergeStep5WithGuidance = (
    guidance: Step5InputGuidance,
    prev: Step5HumanInput
  ): Step5HumanInput => {
    const mergedRequestedInputs = (guidance.requestedInputs || []).map((item, idx) => {
      const existing = prev.requestedInputs.find((input) => input.id === item.id);
      return {
        id: item.id || `input_${idx + 1}`,
        label: item.label || `Requested Input ${idx + 1}`,
        prompt: item.prompt || "Provide concrete human material for this gap.",
        whyNeeded: item.whyNeeded,
        required: item.required !== false,
        response: existing?.response || "",
      };
    });

    const mergedDeepDive = (guidance.deepDiveQuestions || []).map((question, idx) => {
      const existing = prev.angleDeepDiveAnswers.find((item) => item.question === question);
      return (
        existing || {
          question,
          answer: prev.angleDeepDiveAnswers[idx]?.answer || "",
        }
      );
    });

    return {
      ...prev,
      requestedInputs: mergedRequestedInputs,
      angleDeepDiveAnswers: mergedDeepDive,
    };
  };

  const requestNextPOVQuestion = async (layer: 1 | 2 | 3 | 4 | 5) => {
    const result = await callPilotAPI("step3Interview", {
      layer,
      history: povInterviewHistory,
    });
    const interview = result?.step3Interview;
    if (!interview) return;
    setPovCurrentQuestion(interview.question || "");
    setPovCurrentObjective(interview.objective || "");
    setPovFeedback(interview.feedback || "");
    setPovInterviewLayer((interview.nextLayer || layer) as 1 | 2 | 3 | 4 | 5);
    setPovSharpness((interview.sharpness || 0) as 0 | 1 | 2 | 3);
  };

  useEffect(() => {
    if (currentStep !== 3) return;
    if (povCurrentQuestion) return;
    requestNextPOVQuestion(povInterviewLayer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const layerNames = {
    1: "CHALLENGE (Break surface opinions)",
    2: "CLARIFY (Add nuance)",
    3: "PERSONAL (Connect to experience)",
    4: "EXTREME (Extract brutal truth)",
    5: "COMPRESSION (Lock sharp POV)",
  };

  const handlePOVAnswer = async () => {
    if (!povCurrentAnswer.trim()) {
      alert("Please answer the question");
      return;
    }

    const askedQuestion = povCurrentQuestion || "POV question";

    // Add to history
    const newHistory = [
      ...povInterviewHistory,
      {
        layer: povInterviewLayer,
        question: askedQuestion,
        answer: povCurrentAnswer,
      },
    ];
    setPovInterviewHistory(newHistory);

    const result = await callPilotAPI("step3Interview", {
      layer: povInterviewLayer,
      history: newHistory,
      latestAnswer: povCurrentAnswer,
    });
    const interview = result?.step3Interview;
    if (!interview) return;

    setPovSharpness((interview.sharpness || 0) as 0 | 1 | 2 | 3);
    setPovFeedback(interview.feedback || "");

    if (interview.lockPOV && interview.step3) {
      setStep3Data(interview.step3 as Step3POVGate);
      const step3Result = await callPilotAPI("step3", interview.step3);
      if (step3Result?.step3) {
        const step4Result = await callPilotAPI("step4");
        if (step4Result?.step4) {
          setStep4Data(step4Result.step4 as Step4StrategicGaps);
          setSelectedAngleIndex(null);
          setCoreAngleSelection(null);
        }
        setCurrentStep(4);
      }
      alert("POV locked. Proceeding to strategic angles.");
      return;
    }

    setPovInterviewLayer((interview.nextLayer || povInterviewLayer) as 1 | 2 | 3 | 4 | 5);
    setPovCurrentQuestion(interview.question || "");
    setPovCurrentObjective(interview.objective || "");
    setPovCurrentAnswer("");
  };

  const handleNextStep = async () => {
    let action = `step${currentStep + 1}`;
    let data = null;

    switch (currentStep) {
      case 1:
        data = step1Data;
        break;
      case 3:
        // POV is already set in handlePOVAnswer, just confirm
        if (!step3Data.whatYouBelieve) {
          alert("Complete the POV interview first");
          return;
        }
        data = step3Data;
        break;
      case 5:
        data = step5Data;
        break;
      case 4:
        if (selectedAngleIndex === null || !step4Data?.angles?.[selectedAngleIndex]) {
          alert("Choose one core angle. Multiple angles will weaken the video.");
          return;
        }
        if (!angleReasoning.trim() || !angleExample.trim() || !angleEmotion.trim()) {
          alert("Explain why this angle matters with reasoning, a real-world example, and emotional relevance.");
          return;
        }
        {
          const selected = step4Data.angles[selectedAngleIndex];
          const selectionPayload: CoreAngleSelection = {
            angleIndex: selectedAngleIndex,
            angleName: selected.name,
            angleDescription: selected.description,
            reasoning: angleReasoning.trim(),
            realWorldExample: angleExample.trim(),
            emotionalRelevance: angleEmotion.trim(),
            challengeResponse: angleChallenge.trim(),
            confirmation: `This video will focus on ONE core angle: ${selected.name}. All content will reinforce it.`,
          };
          const selectionResult = await callPilotAPI("step4Select", selectionPayload);
          if (selectionResult?.coreAngle) {
            setCoreAngleSelection(selectionResult.coreAngle as CoreAngleSelection);
          }
        }
        break;
      case 8:
        if (!step9Approved) {
          alert("Please confirm you're ready to write the script");
          return;
        }
        action = "step9";
        break;
      case 9:
        data = {
          slotEdits,
          finalNotes: step10Notes,
        };
        action = "step10";
        break;
    }

    if (currentStep < 10) {
      const result = await callPilotAPI(action, data);
      if (result?.step5Guidance) {
        const guidance = result.step5Guidance as Step5InputGuidance;
        setStep5Guidance(guidance);
        setStep5Data((prev) => mergeStep5WithGuidance(guidance, prev));
      }
      if (result?.step9) {
        const nextStep9 = result.step9 as Step9ScriptGeneration;
        setStep9Data(nextStep9);
        setSlotEdits(
          (nextStep9.humanInsertions || []).map((slot) => ({
            slotId: slot.slotId,
            userText: "",
          }))
        );
      }
      if (result?.step10) {
        const finalStep = result.step10 as Step10DistortionReminder;
        setStep10Data(finalStep);

        // Save finalized PILOT output into data store (drafts table)
        setSaveStatus("saving");
        setSaveError(null);
        try {
          const slugSeed =
            coreAngleSelection?.angleName ||
            step4Data?.angles?.[selectedAngleIndex ?? -1]?.name ||
            "pilot-final-script";
          const analysisSlug =
            textToSlug(`${slugSeed}-${Date.now()}`) || `pilot-${Date.now()}`;

          const content = {
            kind: "pilot-final-script",
            sessionId,
            savedAt: new Date().toISOString(),
            coreAngle: coreAngleSelection,
            step1: step1Data,
            step3: step3Data,
            step4: step4Data,
            step5Guidance,
            step5: step5Data,
            step9: step9Data,
            step10: finalStep,
          };

          const { data: inserted, error } = await supabase
            .from("drafts")
            .insert({
              analysis_slug: analysisSlug,
              content,
              status: "pilot-finalized",
            })
            .select("id")
            .single();

          if (error || !inserted?.id) {
            throw error || new Error("Failed to save final script to data store");
          }

          setSavedDraftId(inserted.id);
          setSaveStatus("saved");
        } catch (error) {
          console.error("[pilot-save-final]", error);
          setSaveStatus("error");
          setSaveError(
            error instanceof Error
              ? error.message
              : "Could not save final script to data store."
          );
        }
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handleRetrySaveFinal = async () => {
    if (!step10Data) return;

    setSaveStatus("saving");
    setSaveError(null);
    try {
      const slugSeed =
        coreAngleSelection?.angleName ||
        step4Data?.angles?.[selectedAngleIndex ?? -1]?.name ||
        "pilot-final-script";
      const analysisSlug = textToSlug(`${slugSeed}-${Date.now()}`) || `pilot-${Date.now()}`;

      const content = {
        kind: "pilot-final-script",
        sessionId,
        savedAt: new Date().toISOString(),
        coreAngle: coreAngleSelection,
        step1: step1Data,
        step3: step3Data,
        step4: step4Data,
        step5Guidance,
        step5: step5Data,
        step9: step9Data,
        step10: step10Data,
      };

      const { data: inserted, error } = await supabase
        .from("drafts")
        .insert({
          analysis_slug: analysisSlug,
          content,
          status: "pilot-finalized",
        })
        .select("id")
        .single();

      if (error || !inserted?.id) {
        throw error || new Error("Failed to save final script to data store");
      }

      setSavedDraftId(inserted.id);
      setSaveStatus("saved");
    } catch (error) {
      console.error("[pilot-save-final-retry]", error);
      setSaveStatus("error");
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not save final script to data store."
      );
    }
  };

  const STEP_ICONS = {
    1: "📥",
    2: "🔍",
    3: "🎯",
    4: "⚡",
    5: "🎭",
    6: "✅",
    7: "🏗️",
    8: "🔐",
    9: "✍️",
    10: "🎬",
  } as const;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* PROGRESS HEADER */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6">
        <div className="mb-4">
          <h1 className="text-white text-2xl font-display tracking-wider uppercase mb-2">
            PILOT Director System
          </h1>
          <p className="text-[#888] text-sm">
            10-Step Strategic Content Framework
          </p>
        </div>

        {/* Step Tracker */}
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#888] text-xs uppercase tracking-wide">
              Progress
            </span>
            <span className="text-green-600 font-semibold text-sm">
              Step {currentStep} / 10
            </span>
          </div>
          <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-300"
              style={{ width: `${(currentStep / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Navigation */}
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((step) => (
            <button
              key={step}
              onClick={() => setCurrentStep(step)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                currentStep === step
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-[#1a1a1a] text-[#888] hover:text-white hover:bg-[#222]"
              }`}
            >
              {step}
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: DATA INTAKE */}
      {currentStep === 1 && (
        <SectionCard
          index={1}
          title="Data Intake"
          icon="📥"
          badge="REQUIRED"
        >
          <p className="text-[#888] text-sm mb-4">
            Provide competitor transcript and top audience comments for AI analysis.
          </p>

          <FormField
            label="Competitor Transcript"
            value={step1Data.competitorTranscript}
            onChange={(v) =>
              setStep1Data({ ...step1Data, competitorTranscript: v })
            }
            placeholder="Paste competitor video script here..."
            rows={6}
          />

          {/* Top Comments - 10 Separate Fields */}
          <div className="mb-4">
            <p className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-3">
              Audience Comments (Provide 7-10 individual comments)
            </p>
            <p className="text-[#888] text-xs mb-4">
              Each comment should be from a different audience member
            </p>
            <div className="space-y-3 bg-[#0a0a0a] p-4 rounded border border-[#1e1e1e]">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-green-600 bg-green-600/10 px-2 py-1 rounded">
                      #{idx + 1}
                    </span>
                    <span className="text-xs text-gray-500">
                      {!step1Data.topComments[idx]?.trim() && "Optional"}
                    </span>
                  </div>
                  <textarea
                    value={step1Data.topComments[idx] || ""}
                    onChange={(e) => {
                      const newComments = [...step1Data.topComments];
                      newComments[idx] = e.target.value;
                      setStep1Data({ ...step1Data, topComments: newComments });
                    }}
                    placeholder={`Comment ${idx + 1} from audience member...`}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#222] rounded text-sm text-[#ddd] placeholder-[#555] focus:outline-none focus:border-green-600 transition resize-none hover:border-[#333]"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <ActionButton
              label={loading ? "Analyzing..." : "Next → Logic Analysis"}
              onClick={handleNextStep}
              disabled={
                !step1Data.competitorTranscript ||
                step1Data.topComments.filter((c) => c.trim()).length === 0 ||
                loading
              }
              variant="primary"
            />
          </div>
        </SectionCard>
      )}

      {/* STEP 2: LOGIC ANALYSIS */}
      {currentStep === 2 && (
        <SectionCard index={2} title="Logic Analysis" icon="🔍">
          <p className="text-[#888] text-sm mb-4">
            AI extracted demand signal only: core problem, audience emotion, and attention trigger.
          </p>

          {loading ? (
            <div className="bg-[#1a1a1a] border border-[#222] rounded p-4 animate-pulse">
              <p className="text-[#666] text-sm">Analyzing transcript structure...</p>
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#222] rounded p-4 space-y-3">
              <p className="text-[#ddd] text-sm">
                <span className="text-green-600 font-semibold">Core Problem</span> •{" "}
                <span className="text-green-600 font-semibold">Audience Emotion</span> •{" "}
                <span className="text-green-600 font-semibold">Attention Trigger</span>
              </p>
              <p className="text-[#888] text-xs">
                Analysis results will display in your dashboard after wizard completion.
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <ActionButton
              label={loading ? "Processing..." : "Next → POV Definition"}
              onClick={handleNextStep}
              disabled={loading}
              variant="primary"
            />
          </div>
        </SectionCard>
      )}

      {/* STEP 3: POV INTERVIEW MODE */}
      {currentStep === 3 && (
        <SectionCard
          index={3}
          title="POV Interview Mode"
          icon="🎤"
          badge="MANDATORY"
        >
          <p className="text-[#888] text-sm mb-4">
            A sharp POV cannot be generic. We&apos;re going to extract yours through a guided interview process.
          </p>

          {/* Layer Progress */}
          <div className="mb-6 bg-[#0a0a0a] p-4 rounded border border-[#1e1e1e]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#888] text-xs font-semibold uppercase">
                Interview Progress
              </p>
              <p className="text-green-600 text-sm font-bold">
                {povInterviewLayer}/5 Layers
              </p>
            </div>
            <div className="w-full bg-[#1a1a1a] rounded h-2 overflow-hidden">
              <div
                className="bg-green-600 h-full transition-all duration-300"
                style={{ width: `${(povInterviewLayer / 5) * 100}%` }}
              />
            </div>
            <p className="text-green-600 text-xs mt-3 font-semibold">
              Layer {povInterviewLayer}: {
                layerNames[povInterviewLayer as 1 | 2 | 3 | 4 | 5]
              }
            </p>
          </div>

          {/* Interview History */}
          {povInterviewHistory.length > 0 && (
            <div className="mb-6 bg-[#0a0a0a] p-4 rounded border border-[#1e1e1e]">
              <p className="text-[#888] text-xs font-semibold uppercase mb-3">
                Interview History
              </p>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {povInterviewHistory.map((entry, idx) => (
                  <div key={idx} className="bg-[#1a1a1a] p-3 rounded border border-[#222]">
                    <p className="text-green-600 text-xs font-semibold mb-1">
                      Layer {entry.layer}: {entry.question}
                    </p>
                    <p className="text-[#ddd] text-sm italic">
                      &quot;{entry.answer}&quot;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Question */}
          <div className="mb-6">
            <p className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-3">
              Current Question
            </p>
            <div className="bg-[#1a1a1a] border border-green-900 rounded p-4 mb-4">
              <p className="text-green-600 font-semibold text-sm">
                {povCurrentQuestion || "Generating next interview question..."}
              </p>
              <p className="text-[#666] text-xs mt-2">
                {povCurrentObjective || "Interview objective will appear here."}
              </p>
              <p className="text-[#777] text-xs mt-2">
                {povFeedback || "Answer with concrete details, names, decisions, and stakes."}
              </p>
            </div>

            <textarea
              value={povCurrentAnswer}
              onChange={(e) => setPovCurrentAnswer(e.target.value)}
              placeholder="Answer the question. Be specific, personal, and honest..."
              rows={4}
              className="w-full bg-[#1a1a1a] border border-[#222] rounded text-[#ddd] text-sm p-3 focus:border-green-600 focus:outline-none resize-none hover:border-[#333]"
            />
          </div>

          {/* Instructions */}
          <div className="mb-6 bg-[#0a0a0a] p-4 rounded border border-[#1e1e1e]">
            <p className="text-[#888] text-xs font-semibold uppercase mb-2">
              What to Do
            </p>
            <ul className="text-[#888] text-xs space-y-1">
              <li>
                • {povInterviewLayer === 1 &&
                  "Answer honestly. Don't give a surface-level opinion."}
                {povInterviewLayer === 2 &&
                  "Be specific about boundaries and nuances."}
                {povInterviewLayer === 3 &&
                  "Share a real moment or decision you made."}
                {povInterviewLayer === 4 &&
                  "Say what most people won't admit."}
                {povInterviewLayer === 5 &&
                  "Compress your answer to 1–3 sharp, memorable lines."}
              </li>
            </ul>
          </div>

          <div className="flex gap-3 mt-6">
            <ActionButton
              label={
                povInterviewLayer === 5
                  ? loading
                    ? "Locking POV..."
                    : "Lock POV → Strategic Angles"
                  : loading
                  ? "Next..."
                  : "Next Question"
              }
              onClick={handlePOVAnswer}
              disabled={!povCurrentAnswer.trim() || loading}
              variant={povInterviewLayer === 5 ? "success" : "primary"}
            />
          </div>
        </SectionCard>
      )}

      {/* STEP 4: STRATEGIC GAPS */}
      {currentStep === 4 && (
        <SectionCard index={4} title="Strategic Gaps & Angles" icon="⚡">
          <p className="text-[#888] text-sm mb-4">
            Based on your POV, AI identified gaps the competitor missed and generated strategic angles.
          </p>

          {loading ? (
            <div className="bg-[#1a1a1a] border border-[#222] rounded p-4 animate-pulse">
              <p className="text-[#666] text-sm">Generating strategic angles...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded p-4">
                <p className="text-[#888] text-xs uppercase tracking-wide mb-2">Angle Rule</p>
                <p className="text-[#ddd] text-sm">
                  {step4Data?.selectionNotice || "Only ONE angle will be selected and used as the CORE ANGLE for the video."}
                </p>
              </div>

              {step4Data?.gaps?.length ? (
                <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
                  <p className="text-green-600 text-xs font-semibold uppercase tracking-wide mb-2">Strategic Gaps</p>
                  <ul className="space-y-1">
                    {step4Data.gaps.map((gap, idx) => (
                      <li key={idx} className="text-[#bbb] text-sm">
                        • {gap.gap}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="bg-[#1a1a1a] border border-[#222] rounded p-4 space-y-3">
                <p className="text-green-600 text-xs font-semibold uppercase tracking-wide">Select ONE Core Angle</p>
                {step4Data?.angles?.map((angle, idx) => {
                  const selected = selectedAngleIndex === idx;
                  return (
                    <button
                      key={`${angle.name}-${idx}`}
                      type="button"
                      onClick={() => setSelectedAngleIndex(idx)}
                      className={`w-full text-left p-3 rounded border transition ${
                        selected
                          ? "border-green-700 bg-green-900/20"
                          : "border-[#222] bg-[#111] hover:border-[#333]"
                      }`}
                    >
                      <p className="text-[#ddd] text-sm font-semibold">{angle.name}</p>
                      <p className="text-[#aaa] text-xs mt-1">{angle.description}</p>
                      <p className="text-[#777] text-xs mt-1">Emotional pull: {angle.emotionalPull}</p>
                    </button>
                  );
                })}
              </div>

              <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
                <p className="text-[#888] text-xs uppercase tracking-wide mb-3">Core Angle Justification</p>
                <FormField
                  label="Why this angle?"
                  value={angleReasoning}
                  onChange={setAngleReasoning}
                  placeholder="Explain why this should be the one core angle for the whole video"
                  rows={3}
                />
                <FormField
                  label="Real-world example"
                  value={angleExample}
                  onChange={setAngleExample}
                  placeholder="Give one concrete real-world scenario that proves this angle"
                  rows={3}
                />
                <FormField
                  label="Emotional relevance"
                  value={angleEmotion}
                  onChange={setAngleEmotion}
                  placeholder="Why will this angle emotionally matter to your viewer"
                  rows={2}
                />
                <FormField
                  label="Optional challenge response"
                  value={angleChallenge}
                  onChange={setAngleChallenge}
                  placeholder="If challenged, how would you defend this angle more specifically?"
                  rows={2}
                />
              </div>

              {coreAngleSelection?.confirmation ? (
                <div className="bg-green-950/30 border border-green-900 rounded p-4">
                  <p className="text-green-500 text-sm font-semibold">{coreAngleSelection.confirmation}</p>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <ActionButton
              label={loading ? "Locking Core Angle..." : "Lock Core Angle → Human Input"}
              onClick={handleNextStep}
              disabled={loading || selectedAngleIndex === null}
              variant="primary"
            />
          </div>
        </SectionCard>
      )}

      {/* STEP 5: HUMAN INPUT */}
      {currentStep === 5 && (
        <SectionCard
          index={5}
          title="Human Input Deep-Dive"
          icon="🎭"
          badge="NO AI"
        >
          <p className="text-[#888] text-sm mb-4">
            Step 5 now drills into your selected core angle. Answer the angle-specific questions below, then add stories and emotional proof.
          </p>

          <div className="bg-[#0a0a0a] p-4 rounded border border-[#1e1e1e] mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#888] text-xs font-semibold uppercase tracking-wider">
                What You Still Need To Add
              </p>
              <button
                onClick={async () => {
                  const result = await callPilotAPI("step5");
                  if (result?.step5Guidance) {
                    const guidance = result.step5Guidance as Step5InputGuidance;
                    setStep5Guidance(guidance);
                    setStep5Data((prev) => mergeStep5WithGuidance(guidance, prev));
                  }
                }}
                disabled={loading}
                className="text-xs px-2 py-1 rounded bg-[#1a1a1a] border border-[#222] text-[#bbb] hover:text-white hover:border-[#333] disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh Suggestions"}
              </button>
            </div>

            {step5Guidance ? (
              <div className="space-y-3">
                <p className="text-[#ddd] text-sm leading-relaxed">
                  {step5Guidance.rationale}
                </p>
                {step5Guidance.missingSignals?.length > 0 && (
                  <div>
                    <p className="text-[#888] text-xs uppercase tracking-wide mb-2">
                      Missing Signals
                    </p>
                    <ul className="space-y-1">
                      {step5Guidance.missingSignals.map((signal, idx) => (
                        <li key={idx} className="text-[#bdbdbd] text-xs">
                          • {signal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[#888] text-xs">
                Suggestions are generated from previous steps. If this block is empty, click Refresh Suggestions.
              </p>
            )}
          </div>

          <div className="mb-5 bg-[#0a0a0a] p-4 rounded border border-[#1e1e1e]">
            <p className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-3">
              Core Angle Deep-Dive Questions
            </p>
            {step5Guidance?.deepDiveQuestions?.length ? (
              <div className="space-y-4">
                {step5Guidance.deepDiveQuestions.map((question, idx) => {
                  const answer = step5Data.angleDeepDiveAnswers[idx]?.answer || "";
                  return (
                    <div key={`${question}-${idx}`} className="bg-[#1a1a1a] border border-[#222] rounded p-3">
                      <p className="text-green-600 text-xs font-semibold mb-2">Question {idx + 1}</p>
                      <p className="text-[#ddd] text-sm mb-3">{question}</p>
                      <textarea
                        value={answer}
                        onChange={(e) => {
                          const next = [...step5Data.angleDeepDiveAnswers];
                          next[idx] = { question, answer: e.target.value };
                          setStep5Data({ ...step5Data, angleDeepDiveAnswers: next });
                        }}
                        placeholder="Add concrete details, names, decisions, stakes, and what this proves about the core angle..."
                        rows={3}
                        className="w-full bg-[#111] border border-[#2a2a2a] rounded text-[#ddd] text-sm p-3 focus:border-green-600 focus:outline-none resize-none"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[#888] text-xs">
                No deep-dive questions yet. Click Refresh Suggestions to generate angle-specific interview questions.
              </p>
            )}
          </div>

          <div className="mb-5 bg-[#0a0a0a] p-4 rounded border border-[#1e1e1e] space-y-4">
            <p className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-1">
              AI-Requested Human Inputs
            </p>
            {step5Data.requestedInputs?.length ? (
              <div className="space-y-4">
                {step5Data.requestedInputs.map((item, idx) => (
                  <div key={item.id || idx} className="bg-[#1a1a1a] border border-[#222] rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[#ddd] text-sm font-semibold">{item.label || `Input ${idx + 1}`}</p>
                      <p className="text-[10px] uppercase tracking-wide text-[#777]">
                        {item.required === false ? "optional" : "required"}
                      </p>
                    </div>
                    <p className="text-[#aaa] text-xs mb-2">{item.prompt}</p>
                    {item.whyNeeded ? (
                      <p className="text-[#6f6f6f] text-[11px] mb-3">Why needed: {item.whyNeeded}</p>
                    ) : null}
                    <textarea
                      value={item.response || ""}
                      onChange={(e) => {
                        const next = [...step5Data.requestedInputs];
                        next[idx] = {
                          ...item,
                          response: e.target.value,
                        };
                        setStep5Data({ ...step5Data, requestedInputs: next });
                      }}
                      placeholder="Provide concrete details (names, decisions, stakes, outcome)"
                      rows={3}
                      className="w-full bg-[#111] border border-[#2a2a2a] rounded text-[#ddd] text-sm p-3 focus:border-green-600 focus:outline-none resize-none"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#888] text-xs">
                No requested inputs generated yet. Click Refresh Suggestions to let AI tell you exactly what material to provide.
              </p>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <ActionButton
              label={loading ? "Validating..." : "Next → Input Validation"}
              onClick={handleNextStep}
              disabled={
                (() => {
                  const requiredInputs = step5Data.requestedInputs.filter((item) => item.required !== false);
                  const answeredRequired = requiredInputs.filter(
                    (item) => (item.response || "").trim().length > 0
                  ).length;
                  const minimumRequired = step5Guidance?.minimumRequired || Math.min(3, requiredInputs.length || 3);
                  const answeredMinimum = step5Data.requestedInputs.filter(
                    (item) => (item.response || "").trim().length > 0
                  ).length;

                  return (
                    answeredRequired < Math.min(requiredInputs.length, minimumRequired) ||
                    answeredMinimum < minimumRequired
                  );
                })() ||
                (step5Guidance?.deepDiveQuestions?.length
                  ? step5Data.angleDeepDiveAnswers.filter((item) => item?.answer?.trim()).length <
                    Math.min(3, step5Guidance.deepDiveQuestions.length)
                  : false) ||
                loading
              }
              variant="primary"
            />
          </div>
        </SectionCard>
      )}

      {/* STEP 6: VALIDATION */}
      {currentStep === 6 && (
        <SectionCard index={6} title="Input Validation" icon="✅">
          <p className="text-[#888] text-sm mb-4">
            AI is checking your inputs for specificity, emotional weight, and usability.
          </p>

          {loading ? (
            <div className="bg-[#1a1a1a] border border-[#222] rounded p-4 animate-pulse">
              <p className="text-[#666] text-sm">Validating input quality...</p>
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-green-900 rounded p-4">
              <p className="text-green-500 text-sm font-semibold">
                ✓ Inputs validated and strong
              </p>
              <p className="text-[#888] text-xs mt-2">
                Your human inputs have sufficient emotional weight and specificity to guide script generation.
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <ActionButton
              label={loading ? "Processing..." : "Next → Structure Blueprint"}
              onClick={handleNextStep}
              disabled={loading}
              variant="primary"
            />
          </div>
        </SectionCard>
      )}

      {/* STEP 7: STRUCTURE BLUEPRINT */}
      {currentStep === 7 && (
        <SectionCard index={7} title="Structure Blueprint" icon="🏗️">
          <p className="text-[#888] text-sm mb-4">
            AI built a blueprint based on your POV, stories, and strategic angles.
          </p>

          {loading ? (
            <div className="bg-[#1a1a1a] border border-[#222] rounded p-4 animate-pulse">
              <p className="text-[#666] text-sm">Building blueprint...</p>
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#222] rounded p-4 space-y-3">
              <p className="text-[#ddd] text-sm">
                <span className="text-green-600 font-semibold">Hook Direction</span> •{" "}
                <span className="text-green-600 font-semibold">Section Breakdown</span> •{" "}
                <span className="text-green-600 font-semibold">Story Mapping</span>
              </p>
              <p className="text-[#888] text-xs">
                This blueprint ensures your human input is interwoven throughout the final script.
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <ActionButton
              label={loading ? "Processing..." : "Next → Script Permission"}
              onClick={handleNextStep}
              disabled={loading}
              variant="primary"
            />
          </div>
        </SectionCard>
      )}

      {/* STEP 8: PERMISSION GATE */}
      {currentStep === 8 && (
        <SectionCard
          index={8}
          title="Script Permission Gate"
          icon="🔐"
          badge="APPROVAL NEEDED"
        >
          <p className="text-[#888] text-sm mb-4">
            Ready to generate the full script based on all your inputs?
          </p>

          <div className="bg-[#1a1a1a] border border-green-900 rounded p-4 space-y-2 mb-6">
            <p className="text-green-500 text-sm font-semibold">
              Before you approve:
            </p>
            <ul className="text-[#888] text-xs space-y-1">
              <li>✓ POV is locked and clear</li>
              <li>✓ All 4 human inputs provided</li>
              <li>✓ Strategic angles generated</li>
              <li>✓ Blueprint is ready</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <ActionButton
              label="← Go Back"
              onClick={() => setCurrentStep(7)}
              variant="secondary"
            />
            <ActionButton
              label="Generate Script"
              onClick={() => {
                setStep9Approved(true);
                handleNextStep();
              }}
              variant="success"
            />
          </div>
        </SectionCard>
      )}

      {/* STEP 9: SCRIPT GENERATION */}
      {currentStep === 9 && (
        <SectionCard index={9} title="Script Generated" icon="✍️">
          <p className="text-[#888] text-sm mb-4">
            AI drafted the script with deliberate human insertion slots so you can add lived details without breaking narrative flow.
          </p>

          {loading ? (
            <div className="bg-[#1a1a1a] border border-[#222] rounded p-4 animate-pulse">
              <p className="text-[#666] text-sm">Generating full script...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#1a1a1a] border border-[#222] rounded p-4 space-y-2">
                <p className="text-green-600 font-semibold text-sm">✓ Script Draft Ready</p>
                <p className="text-[#888] text-xs">
                  Markers like [HUMAN_INSERT_1] show where your personal material should be inserted.
                </p>
                {step9Data?.scriptWithHumanSlots ? (
                  <pre className="mt-3 max-h-64 overflow-auto bg-[#111] border border-[#2a2a2a] rounded p-3 text-[12px] leading-5 text-[#ddd] whitespace-pre-wrap">
                    {step9Data.scriptWithHumanSlots}
                  </pre>
                ) : (
                  <p className="text-[#777] text-xs">Script preview will appear after generation.</p>
                )}
              </div>

              <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
                <p className="text-[#888] text-xs uppercase tracking-wide mb-3">
                  Human Intervention Guidance
                </p>
                {step9Data?.humanInsertions?.length ? (
                  <div className="space-y-3">
                    {step9Data.humanInsertions.map((slot, idx) => (
                      <div key={`${slot.slotId}-${idx}`} className="bg-[#111] border border-[#2a2a2a] rounded p-3">
                        <p className="text-green-600 text-xs font-semibold">{slot.slotId} · {slot.location}</p>
                        <p className="text-[#ddd] text-sm mt-1">{slot.whatToAdd}</p>
                        <p className="text-[#aaa] text-xs mt-2">Purpose: {slot.purpose}</p>
                        <p className="text-[#888] text-xs mt-1">Why now: {slot.whyNow}</p>
                        <p className="text-[#888] text-xs mt-1">Starter: {slot.exampleStarter}</p>
                        <p className="text-[#888] text-xs mt-1">Consistency: {slot.consistencyNote}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#777] text-xs">
                    No insertion guidance available yet. Regenerate script if needed.
                  </p>
                )}
              </div>

              <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
                <p className="text-[#888] text-xs uppercase tracking-wide mb-3">
                  Fill Human Insertions (Your Real Material)
                </p>
                {step9Data?.humanInsertions?.length ? (
                  <div className="space-y-3">
                    {step9Data.humanInsertions.map((slot) => {
                      const currentValue =
                        slotEdits.find((item) => item.slotId === slot.slotId)?.userText || "";
                      return (
                        <div key={`input-${slot.slotId}`} className="bg-[#111] border border-[#2a2a2a] rounded p-3">
                          <p className="text-green-600 text-xs font-semibold mb-2">{slot.slotId}</p>
                          <p className="text-[#888] text-xs mb-2">Add your real story / viewpoint for this slot:</p>
                          <textarea
                            value={currentValue}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSlotEdits((prev) => {
                                const exists = prev.find((item) => item.slotId === slot.slotId);
                                if (exists) {
                                  return prev.map((item) =>
                                    item.slotId === slot.slotId ? { ...item, userText: value } : item
                                  );
                                }
                                return [...prev, { slotId: slot.slotId, userText: value }];
                              });
                            }}
                            placeholder="Add concrete human detail: what happened, why it mattered, what changed..."
                            rows={3}
                            className="w-full bg-[#1a1a1a] border border-[#222] rounded text-[#ddd] text-sm p-3 focus:border-green-600 focus:outline-none resize-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[#777] text-xs">No insertion slots to fill.</p>
                )}

                <div className="mt-4">
                  <p className="text-[#888] text-xs uppercase tracking-wide mb-2">Final Context Notes (Optional)</p>
                  <textarea
                    value={step10Notes}
                    onChange={(e) => setStep10Notes(e.target.value)}
                    placeholder="Add final context constraints: tone, pacing, words to avoid, audience sensitivity..."
                    rows={2}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded text-[#ddd] text-sm p-3 focus:border-green-600 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-[#222] rounded p-4 space-y-2">
                <p className="text-[#888] text-xs uppercase tracking-wide">Narrative Notes</p>
                <p className="text-[#ddd] text-sm">Flow: {step9Data?.naturalFlow || "-"}</p>
                <p className="text-[#ddd] text-sm">Emotion map: {step9Data?.embeddedEmotion || "-"}</p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#222] rounded p-4 space-y-3">
              <p className="text-green-600 font-semibold text-sm">
                  What To Do Next
              </p>
                <ul className="text-[#888] text-xs space-y-1">
                  <li>1. Keep one core angle and only add human details that reinforce it.</li>
                  <li>2. Replace each [HUMAN_INSERT_n] with a concrete real moment.</li>
                  <li>3. Keep emotional stakes specific: decision, consequence, and lesson.</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <ActionButton
              label={loading ? "Finalizing..." : "Next → Final Contextual Rewrite"}
              onClick={handleNextStep}
              disabled={
                loading ||
                (step9Data?.humanInsertions?.length
                  ? slotEdits.filter((item) => item.userText.trim()).length <
                    Math.min(1, step9Data.humanInsertions.length)
                  : false)
              }
              variant="primary"
            />
          </div>
        </SectionCard>
      )}

      {/* STEP 10: DISTORTION REMINDER */}
      {currentStep === 10 && (
        <SectionCard
          index={10}
          title="Final Contextual Rewrite"
          icon="🎬"
          badge="FINAL"
        >
          <p className="text-[#888] text-sm mb-4">
            Final pass complete. Your script is now rewritten with your human inserts and contextual humanization.
          </p>

          <div className="space-y-4">
            <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
              <p className="text-[#888] text-xs uppercase tracking-wide mb-2">Final Script</p>
              <pre className="max-h-[420px] overflow-auto bg-[#111] border border-[#2a2a2a] rounded p-3 text-[12px] leading-5 text-[#ddd] whitespace-pre-wrap">
                {step10Data?.finalScript || "Final script will appear here after rewrite."}
              </pre>
            </div>

            {step10Data?.slotResolution?.length ? (
              <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
                <p className="text-[#888] text-xs uppercase tracking-wide mb-3">Slot Integration Summary</p>
                <div className="space-y-2">
                  {step10Data.slotResolution.map((item, idx) => (
                    <div key={`${item.slotId}-${idx}`} className="bg-[#111] border border-[#2a2a2a] rounded p-3">
                      <p className="text-green-600 text-xs font-semibold">{item.slotId}</p>
                      <p className="text-[#ddd] text-sm mt-1">{item.usedText}</p>
                      <p className="text-[#888] text-xs mt-1">Integrated: {item.integratedWhere}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
              <p className="text-[#888] text-xs uppercase tracking-wide mb-3">Humanization Tips Applied</p>
              <div className="space-y-2">
                {(step10Data?.tips || []).map((tip, i) => (
                  <div key={i} className="bg-[#111] border border-[#2a2a2a] rounded p-3">
                    <p className="text-green-600 text-sm font-semibold mb-1">{tip.technique}</p>
                    <p className="text-[#888] text-xs">{tip.description}</p>
                  </div>
                ))}
              </div>
              {step10Data?.exampleEdit ? (
                <p className="text-[#aaa] text-xs mt-3">Example edit: {step10Data.exampleEdit}</p>
              ) : null}
            </div>

            {step10Data?.consistencyCheck ? (
              <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
                <p className="text-[#888] text-xs uppercase tracking-wide mb-2">Core Angle Consistency</p>
                <p className="text-[#ddd] text-sm">Core angle: {step10Data.consistencyCheck.coreAngle}</p>
                <p className="text-[#ddd] text-sm mt-1">
                  Drift detected: {step10Data.consistencyCheck.driftDetected ? "Yes" : "No"}
                </p>
                <p className="text-[#888] text-xs mt-2">Fix applied: {step10Data.consistencyCheck.fixApplied}</p>
              </div>
            ) : null}

            <div className="bg-[#1a1a1a] border border-[#222] rounded p-4">
              <p className="text-[#888] text-xs uppercase tracking-wide mb-2">Data Save Status</p>
              {saveStatus === "saving" && (
                <p className="text-[#ddd] text-sm">Saving final script to data...</p>
              )}
              {saveStatus === "saved" && (
                <p className="text-green-500 text-sm">
                  Saved to data successfully{savedDraftId ? ` (ID: ${savedDraftId})` : ""}.
                </p>
              )}
              {saveStatus === "error" && (
                <div className="space-y-2">
                  <p className="text-red-400 text-sm">
                    Save failed{saveError ? `: ${saveError}` : "."}
                  </p>
                  <button
                    onClick={handleRetrySaveFinal}
                    disabled={false}
                    className="px-3 py-1.5 rounded bg-[#111] border border-[#2a2a2a] text-[#ddd] text-xs hover:border-[#3a3a3a]"
                  >
                    Retry Save
                  </button>
                </div>
              )}
              {saveStatus === "idle" && (
                <p className="text-[#888] text-sm">Final script not saved yet.</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <ActionButton
              label="Complete → Back to Dashboard"
              onClick={() => {
                if (onComplete) onComplete(session!);
                setCurrentStep(1);
              }}
              variant="success"
            />
          </div>
        </SectionCard>
      )}
    </div>
  );
}
