"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useHistory, HistoryEntry } from "@/app/lib/useHistory";
import { AnalysisResult } from "@/app/lib/types";

type ScriptSection =
  | { time: string; section: string; narration: string; bullets: string[] }
  | { time: string; section: string; content: string };

export default function ContentDraftPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { getAnalysisBySlug } = useHistory();

  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHook, setSelectedHook] = useState<string | null>(null);
  const [editingHook, setEditingHook] = useState(false);
  const [customHook, setCustomHook] = useState("");

  const [draftScriptStructure, setDraftScriptStructure] = useState<ScriptSection[]>([]);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftGenerated, setDraftGenerated] = useState(false);
  const [apiHooks, setApiHooks] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAnalysisBySlug(slug);
      setEntry(data);
      setLoading(false);
    };
    fetchData();
  }, [slug, getAnalysisBySlug]);

  useEffect(() => {
    if (!entry || draftLoading || draftGenerated) return;

    const generateDraft = async () => {
      setDraftLoading(true);
      setDraftError(null);

      try {
        const res = await fetch(`/api/draft?slug=${encodeURIComponent(slug)}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to generate draft.");
        }

        setDraftScriptStructure(json.draft || []);
        setApiHooks(json.hooks || []);

        if (json.chosenHook) {
          setSelectedHook(json.chosenHook);
          setCustomHook(json.chosenHook);
        }

        setDraftGenerated(true);
      } catch (err) {
        setDraftError(err instanceof Error ? err.message : "Unable to generate draft.");
      } finally {
        setDraftLoading(false);
      }
    };

    generateDraft();
  }, [entry, slug, draftLoading, draftGenerated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Content not found</h1>
          <Link href="/" className="text-[#ff2d20] hover:text-[#ff6b35]">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  const result: AnalysisResult = entry.result;

  // Generate 20-minute script structure
  const scriptStructure = [
    { time: "0:00 - 0:30", section: "Hook", content: result.structureDNA.hook },
    { time: "0:30 - 2:00", section: "Setup & Context", content: result.structureDNA.setup },
    { time: "2:00 - 5:00", section: "Contrast Story", content: result.structureDNA.contrastStory },
    { time: "5:00 - 10:00", section: "Insight Reveal", content: result.structureDNA.insightReveal },
    { time: "10:00 - 15:00", section: "Value Delivery", content: result.structureDNA.valueDelivery },
    { time: "15:00 - 18:00", section: "Action Steps", content: "Detailed actionable steps based on the insight" },
    { time: "18:00 - 19:30", section: "Social Proof", content: "Share success stories or testimonials" },
    { time: "19:30 - 20:00", section: "Call to Action", content: result.structureDNA.actionConclusion },
  ];

  // Hook suggestions
  const hookSuggestions =
    apiHooks.length > 0
      ? apiHooks
      : [
          ...result.hookBreakdown.newHooks,
          ...result.contentOpportunities.map((op) => op.hook),
        ].filter((hook, index, arr) => arr.indexOf(hook) === index); // Remove duplicates

  const handleSelectHook = (hook: string) => {
    setSelectedHook(hook);
    setCustomHook(hook);
    setEditingHook(false);
  };

  const handleEditHook = () => {
    setEditingHook(true);
  };

  const handleSaveHook = () => {
    setSelectedHook(customHook);
    setEditingHook(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] sticky top-0 z-40 backdrop-blur-md bg-[#0a0a0a]/90">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-[#555] hover:text-[#aaa] text-sm">
            ← Back to analysis
          </Link>
          <h1 className="font-display text-xl tracking-wider gradient-text">
            CONTENT DRAFT
          </h1>
          <div></div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h2 className="font-display text-3xl tracking-wider gradient-text mb-2">
            {result.coreInsight.summary}
          </h2>
          <p className="text-[#555] text-sm">
            20-minute video script structure
          </p>
        </div>

        {/* Hook Selection */}
        <div className="mb-8 bg-[#111] border border-[#1e1e1e] rounded-xl p-6">
          <h3 className="font-display text-xl tracking-wider text-white mb-4">
            SELECT YOUR HOOK
          </h3>
          {!selectedHook ? (
            <div className="space-y-3">
              {hookSuggestions.map((hook, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectHook(hook)}
                  className="w-full text-left p-3 bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg
                             hover:border-[#ff2d20]/40 transition-all text-[#ccc]"
                >
                  {hook}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg">
                <p className="text-[#ccc] mb-2">Selected Hook:</p>
                {editingHook ? (
                  <div className="space-y-2">
                    <textarea
                      value={customHook}
                      onChange={(e) => setCustomHook(e.target.value)}
                      className="w-full bg-[#111] border border-[#1e1e1e] rounded px-3 py-2 text-[#ccc]"
                      rows={3}
                    />
                    <button
                      onClick={handleSaveHook}
                      className="px-4 py-2 bg-[#ff2d20] text-white rounded hover:bg-[#ff6b35] transition-colors"
                    >
                      Save Hook
                    </button>
                  </div>
                ) : (
                  <p className="text-white">{selectedHook}</p>
                )}
              </div>
              {!editingHook && (
                <button
                  onClick={handleEditHook}
                  className="px-4 py-2 border border-[#1e1e1e] text-[#666] rounded hover:text-white hover:border-[#333] transition-colors"
                >
                  Edit Hook
                </button>
              )}
            </div>
          )}
        </div>

        {/* Draft generation status */}
        <div className="mb-4">
          {draftLoading && (
            <div className="px-4 py-3 bg-[#111] border border-[#1e1e1e] rounded-xl text-[#aaa] text-sm">
              Generating draft content from prompt... Please wait.
            </div>
          )}
          {draftError && (
            <div className="px-4 py-3 bg-red-900/20 border border-red-900/40 rounded-xl text-red-400 text-sm">
              {draftError}
            </div>
          )}
        </div>

        {/* Script Structure */}
        <div className="space-y-4">
          {(draftScriptStructure.length > 0 ? draftScriptStructure : scriptStructure).map(
            (section, index) => {
              const isDraft = "narration" in section;
              const text = isDraft ? section.narration : section.content;
              const characters = text?.length || 0;
              const bullets = isDraft ? section.bullets : [];

              return (
                <div key={index} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-display text-lg tracking-wider text-white">
                      {section.time} - {section.section}
                    </h4>
                    <span className="text-[#444] text-xs font-mono">{characters} chars</span>
                  </div>
                  <p className="text-[#ccc] leading-relaxed">{text}</p>
                  {bullets.length > 0 && (
                    <ul className="mt-3 text-[#bbb] list-disc list-inside space-y-1">
                      {bullets.map((bullet, j) => (
                        <li key={j}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }
          )}
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-[#111] border border-[#1e1e1e] rounded-xl p-6">
          <h3 className="font-display text-xl tracking-wider text-white mb-4">
            NEXT STEPS
          </h3>
          <div className="space-y-3 text-[#ccc]">
            <p>1. Review and refine each section based on your style</p>
            <p>2. Add specific examples and stories from your experience</p>
            <p>3. Record a practice run and time each section</p>
            <p>4. Adjust pacing and add transitions between sections</p>
            <p>5. Create engaging visuals to support each part</p>
          </div>
        </div>
      </div>
    </div>
  );
}
