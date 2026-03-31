"use client";

import React, { useState } from "react";
import { RedditIdea } from "../lib/types";

interface RedditIdeaDisplayProps {
  idea: RedditIdea;
}

type SectionItem = {
  id: string;
  title: string;
  icon: string;
  colorClass: string;
  cards: Array<{ label: string; value: string }>;
};

function SectionCard({ section }: { section: SectionItem }) {
  return (
    <div className="rounded-3xl border border-slate-700/40 bg-slate-900/40 p-4 shadow-lg shadow-indigo-950/30 backdrop-blur-md transition-all duration-300">
      <div className="flex items-center gap-3 text-white mb-4">
        <span className="text-2xl">{section.icon}</span>
        <h2 className="text-2xl font-bold">{section.title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {section.cards.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-600/30 bg-slate-950/30 p-3"
          >
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {item.label}
            </p>
            <p className="mt-1 text-sm text-slate-100">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RedditIdeaDisplay({ idea }: RedditIdeaDisplayProps) {
  // Check if this is new schema (has hardTruth) or old schema (has coreInsight)
  const isNewSchema = idea.hardTruth !== undefined;

  const [activeSection, setActiveSection] = useState("hardTruth");

  const sections = [
    { id: "hardTruth", label: "Hard Truth" },
    { id: "hook", label: "The Hook" },
    { id: "angles", label: "Viral Angles" },
    { id: "vocab", label: "Street Vocabulary" },
    { id: "painPoints", label: "Pain Points" },
  ];

  const sectionData: SectionItem[] = [
    {
      id: "hardTruth",
      title: "Hard Truth",
      icon: "💀",
      colorClass: "from-red-500 to-pink-500",
      cards: [
        { label: "The Paradox", value: idea.hardTruth?.theParadox ?? "..." },
        {
          label: "The Self-Deception",
          value: idea.hardTruth?.theSelfDeception ?? "...",
        },
        {
          label: "The Brutal Reality",
          value: idea.hardTruth?.theBrutalReality ?? "...",
        },
        { label: "The Pivot", value: idea.hardTruth?.thePivot ?? "..." },
      ],
    },
    {
      id: "hook",
      title: "The Hook",
      icon: "🎣",
      colorClass: "from-blue-500 to-cyan-400",
      cards: [
        {
          label: "Shocking Headline",
          value: idea.theHook?.shockingHeadline ?? "...",
        },
        {
          label: "Visual Trigger",
          value: idea.theHook?.visualTrigger ?? "...",
        },
        {
          label: "Psychological Hook",
          value: idea.theHook?.psychologicalHook ?? "...",
        },
      ],
    },
    {
      id: "angles",
      title: "Viral Angles",
      icon: "🚀",
      colorClass: "from-purple-500 to-fuchsia-400",
      cards:
        idea.viralAngles?.map((angle) => ({
          label: angle.name,
          value: `${angle.gimmick} · Ego: ${angle.egoTrigger}`,
        })) ?? [],
    },
    {
      id: "vocab",
      title: "Street Vocabulary",
      icon: "🗣️",
      colorClass: "from-emerald-500 to-teal-400",
      cards: [
        {
          label: "Power Slang",
          value: idea.vocabulary?.powerSlang.join(" · ") ?? "...",
        },
        {
          label: "Physical Metaphors",
          value: idea.vocabulary?.physicalMetaphors.join(" · ") ?? "...",
        },
        {
          label: "Inner Monologue",
          value: idea.vocabulary?.innerMonologue.join(" · ") ?? "...",
        },
      ],
    },
    {
      id: "painPoints",
      title: "Pain Points",
      icon: "💔",
      colorClass: "from-pink-500 to-fuchsia-400",
      cards:
        idea.painPoints?.map((point, idx) => ({
          label: `Scenario ${idx + 1}`,
          value: `Situation: ${point.scenario} · Feeling: ${point.internalFeeling}`,
        })) ?? [],
    },
  ];

  const activeSectionData = sectionData.find(
    (sect) => sect.id === activeSection,
  );

  const exportToCSV = () => {
    const rows: string[][] = [];
    rows.push(["Section", "Field", "Value"]);

    // Hard Truth
    if (idea.hardTruth) {
      rows.push(["Hard Truth", "The Paradox", idea.hardTruth.theParadox || ""]);
      rows.push([
        "Hard Truth",
        "The Self-Deception",
        idea.hardTruth.theSelfDeception || "",
      ]);
      rows.push([
        "Hard Truth",
        "The Brutal Reality",
        idea.hardTruth.theBrutalReality || "",
      ]);
      rows.push(["Hard Truth", "The Pivot", idea.hardTruth.thePivot || ""]);
    }

    // The Hook
    if (idea.theHook) {
      rows.push([
        "The Hook",
        "Shocking Headline",
        idea.theHook.shockingHeadline || "",
      ]);
      rows.push([
        "The Hook",
        "Visual Trigger",
        idea.theHook.visualTrigger || "",
      ]);
      rows.push([
        "The Hook",
        "Psychological Hook",
        idea.theHook.psychologicalHook || "",
      ]);
    }

    // Viral Angles
    if (idea.viralAngles) {
      idea.viralAngles.forEach((angle, i) => {
        rows.push([`Viral Angles ${i + 1}`, "Name", angle.name || ""]);
        rows.push([`Viral Angles ${i + 1}`, "Gimmick", angle.gimmick || ""]);
        rows.push([
          `Viral Angles ${i + 1}`,
          "Ego Trigger",
          angle.egoTrigger || "",
        ]);
      });
    }

    // Street Vocabulary
    if (idea.vocabulary) {
      rows.push([
        "Street Vocabulary",
        "Power Slang",
        (idea.vocabulary.powerSlang || []).join("; "),
      ]);
      rows.push([
        "Street Vocabulary",
        "Physical Metaphors",
        (idea.vocabulary.physicalMetaphors || []).join("; "),
      ]);
      rows.push([
        "Street Vocabulary",
        "Inner Monologue",
        (idea.vocabulary.innerMonologue || []).join("; "),
      ]);
    }

    // Pain Points
    if (idea.painPoints) {
      idea.painPoints.forEach((point, i) => {
        rows.push([`Pain Points ${i + 1}`, "Scenario", point.scenario || ""]);
        rows.push([
          `Pain Points ${i + 1}`,
          "Internal Feeling",
          point.internalFeeling || "",
        ]);
      });
    }

    // Create CSV content
    const csvContent = rows
      .map((row) =>
        row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reddit-idea-analysis-data.csv";
    link.click();
  };

  return (
    <>
      {/* Export Button */}
      <div className="mt-8 flex justify-end mb-4">
        <button
          onClick={exportToCSV}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
        >
          <span>📊</span>
          Export to CSV
        </button>
      </div>
      <div className="min-h-screen bg-[radial-gradient(circle_at_10%_20%,_rgba(139,92,246,0.25),_transparent_45%),_radial-gradient(circle_at_90%_15%,_rgba(59,130,246,0.25),_transparent_45%),_linear-gradient(180deg,_#070a12,_#0f1320)] text-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <header className="mb-8 rounded-3xl border border-slate-700/40 bg-slate-900/50 p-6 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-widest text-indigo-300/90">
                  Reddit Viral DNA
                </p>
                <h1
                  className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg"
                  style={{ textShadow: "0 2px 18px rgba(79,70,229,0.55)" }}
                >
                  Analysis Dashboard
                </h1>
                <p className="mt-2 text-slate-300">
                  Tối ưu mỗi ý tưởng viral từ Reddit, đã được phân tích bằng AI
                  siêu sâu.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-700/40 bg-slate-800/40 p-3 backdrop-blur-md">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {sections.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      activeSection === item.id
                        ? "border-indigo-300 bg-indigo-500/20 text-white"
                        : "border-slate-600/60 bg-slate-700/30 text-slate-200 hover:bg-slate-600/70 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
            <article className="space-y-4">
              {isNewSchema ? (
                activeSectionData ? (
                  <SectionCard section={activeSectionData} />
                ) : (
                  <p className="text-center text-slate-300">
                    Chọn một mục để xem nội dung.
                  </p>
                )
              ) : (
                <div className="rounded-3xl border border-yellow-500/25 bg-yellow-950/30 p-8 text-center shadow-lg shadow-yellow-950/30 backdrop-blur-md">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h2 className="text-2xl font-bold text-yellow-200">
                    Legacy Analysis Format
                  </h2>
                  <p className="mt-3 text-slate-100 max-w-2xl mx-auto">
                    Bản phân tích này sử dụng cấu trúc cũ. Để có trải nghiệm
                    chuẩn mực và nhiều insights hơn, hãy gửi URL mới để phân
                    tích theo Viral DNA mới.
                  </p>
                </div>
              )}
            </article>

            <aside className="rounded-3xl border border-slate-700/40 bg-slate-900/35 p-5 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white mb-3">
                Quick Utilities
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Copy analysis summary</li>
                <li>• Export as markdown</li>
                <li>• Compare with previous idea</li>
              </ul>
              <div className="mt-6 p-4 rounded-2xl border border-slate-700/50 bg-slate-950/20">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                  Pro Tip
                </p>
                <p className="text-sm text-slate-100">
                  Chọn 1 ý tưởng và nhấn nút mới để xem điểm mạnh / yếu, sau đó
                  sử dụng prompt below để tạo video script ngay lập tức.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
