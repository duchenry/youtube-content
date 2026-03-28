"use client";

import React, { useState } from "react";

interface SectionCardProps {
  index: number;
  title: string;
  icon: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SectionCard({
  index,
  title,
  icon,
  badge,
  children,
  defaultOpen = true,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="section-animate rounded-xl border border-[#1e1e1e] bg-[#111] overflow-hidden"
      style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
      >
        <span className="text-xl">{icon}</span>
        <span className="flex-1 font-display text-lg tracking-wide text-white uppercase">
          {title}
        </span>
        {badge && (
          <span className="tag-pill bg-[#1a1a1a] text-[#888]">{badge}</span>
        )}
        <span
          className="text-[#444] text-sm transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-[#1a1a1a]">{children}</div>
      )}
    </div>
  );
}
