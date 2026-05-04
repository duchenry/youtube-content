"use client";

import { useState, useCallback } from "react";
import type { GeneratedScript } from "@/app/lib/types";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type SectionKey = keyof GeneratedScript["sections"];

interface SectionMeta {
  key: SectionKey;
  label: string;
  targetWords: string;
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const SECTIONS: SectionMeta[] = [
  { key: "hook",          label: "Hook",          targetWords: "180–220w" },
  { key: "setup",         label: "Setup",         targetWords: "350–450w" },
  { key: "contradiction", label: "Contradiction",  targetWords: "450–600w" },
  { key: "reframe",       label: "Reframe",        targetWords: "260–340w" },
  { key: "solution",      label: "Solution",       targetWords: "320–420w" },
  { key: "close",         label: "Close",          targetWords: "150–200w" },
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  setTimeout(() => {
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      if (document.body.contains(a)) document.body.removeChild(a);
    }, 150);
  }, 0);
}

function buildDownloadContent(data: GeneratedScript): string {
  const divider = "─".repeat(64);
  const lines: string[] = [
    "YOUTUBE SCRIPT", divider, "", "FULL SCRIPT", divider, "",
    data.fullScript, "", "",
    "RAW SECTIONS", divider,
  ];
  for (const { key, label } of SECTIONS) {
    const { text, wordCount } = data.sections[key];
    lines.push("", `${label.toUpperCase()}  (${wordCount}w)`, divider, "", text);
  }
  lines.push("", divider, `Generated: ${new Date().toLocaleString("vi-VN")}`);
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────

function CopyButton({ getText }: { getText: () => string }) {
  const [state, setState] = useState<"idle" | "copied">("idle");

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(getText());
      setState("copied");
      setTimeout(() => setState("idle"), 1600);
    } catch { /* ignore */ }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs
        border border-[#2c2c2c] bg-transparent text-[#666]
        hover:border-[#3a3a3a] hover:text-[#999] transition-colors"
    >
      {state === "copied" ? (
        <>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <rect x="4" y="1" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M1 4v7h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function WordBadge({ count, target }: { count: number; target: string }) {
  return (
    <span className="text-[11px] text-[#444] tabular-nums">
      {count.toLocaleString()}w
      <span className="text-[#333] ml-1">/ {target}</span>
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 12 12" fill="none"
      className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
    >
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="#555" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION ROW
// ─────────────────────────────────────────────────────────────

function SectionRow({
  meta,
  section,
  defaultOpen,
}: {
  meta: SectionMeta;
  section: { text: string; wordCount: number };
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!section.text.trim()) return null;

  return (
    <div className="border border-[#1c1c1c] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3
          bg-[#0c0c0c] hover:bg-[#0f0f0f] transition-colors text-left"
      >
        <span className="text-[#c8c8c8] text-sm font-medium">{meta.label}</span>
        <div className="flex items-center gap-3">
          <WordBadge count={section.wordCount} target={meta.targetWords} />
          <CopyButton getText={() => section.text} />
          <Chevron open={open} />
        </div>
      </button>

      {open && (
        <div className="px-4 py-4 border-t border-[#181818] bg-[#080808]">
          <p className="text-[#aaa] text-sm leading-[1.9] whitespace-pre-wrap font-mono">
            {section.text}
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export function ScriptDisplay({ data }: { data: GeneratedScript | null }) {
  const [fullOpen, setFullOpen] = useState(true);

  const getFullScript = useCallback(() => data?.fullScript ?? "", [data]);

  if (!data) return null;

  const { fullScript, sections, status } = data;

  const totalWords = SECTIONS.reduce((sum, { key }) => sum + sections[key].wordCount, 0);

  return (
    <div className="space-y-3">

      {/* ── HEADER BAR ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[#555] text-xs uppercase tracking-widest">{status}</span>
          <span className="text-[#333] text-xs">·</span>
          <span className="text-[#444] text-xs">{totalWords.toLocaleString()} words total</span>
        </div>

        <div className="flex items-center gap-2">
          <CopyButton getText={getFullScript} />
          <button
            onClick={() => downloadText(buildDownloadContent(data), `script-${Date.now()}.txt`)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs
              border border-[#2c2c2c] bg-transparent text-[#666]
              hover:border-[#3a3a3a] hover:text-[#999] transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v7M3 6l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* ── FULL SCRIPT ── */}
      <div className="border border-[#1c1c1c] rounded-xl overflow-hidden">
        <button
          onClick={() => setFullOpen((p) => !p)}
          className="w-full flex items-center justify-between px-4 py-3
            bg-[#0c0c0c] hover:bg-[#0f0f0f] transition-colors text-left"
        >
          <span className="text-[#c8c8c8] text-sm font-medium">Full script</span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#444]">{totalWords.toLocaleString()}w</span>
            <Chevron open={fullOpen} />
          </div>
        </button>

        {fullOpen && (
          <div className="border-t border-[#181818] bg-[#080808]">
            <div className="max-h-[560px] overflow-y-auto px-4 py-4">
              <p className="text-[#bbb] text-sm leading-[1.9] whitespace-pre-wrap font-mono">
                {fullScript}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION DIVIDER ── */}
      <p className="text-[#333] text-[11px] uppercase tracking-widest pt-1 px-0.5">
        Sections
      </p>

      {/* ── RAW SECTIONS ── */}
      <div className="space-y-2">
        {SECTIONS.map((meta, i) => (
          <SectionRow
            key={meta.key}
            meta={meta}
            section={sections[meta.key]}
            defaultOpen={i === 0}
          />
        ))}
      </div>

    </div>
  );
}