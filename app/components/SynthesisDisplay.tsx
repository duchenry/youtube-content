/**
 * Hiển thị kết quả Bước 3 — tổng hợp chiến lược hành động
 * viewerPsychology, enrichedPainMap, platformTranslation,
 * differentiation, hookStrategy, contentBriefSeed, qualityGate
 * CSV export: flat array, auto-filter empty rows
 */
"use client";

import { useMemo } from "react";
import type { StrategicSynthesis } from "@/app/lib/types";

interface Props { data: StrategicSynthesis }

const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;

function Row({ label, value, note }: { label: string; value?: string; note?: string }) {
  if (!value?.trim()) return null;
  return (
    <div className="py-2">
      <p className="text-[#8a8a8a] text-xs uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-[#e2e2e2] text-sm leading-relaxed">{value}</p>
      {note && <p className="text-[#555] text-[11px] mt-1 italic">{note}</p>}
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#222] bg-gradient-to-b from-[#101010] to-[#0b0b0b] p-4">
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      {note && <p className="text-[#555] text-[11px] italic mb-3">{note}</p>}
      {children}
    </div>
  );
}

export function SynthesisDisplay({ data }: Props) {
  const pa = data.painArchitecture;
  const csvContent = useMemo(() => {
    const r = (s: string, f: string, v: string): string[] | null => (v ? [s, f, v] : null);
    const d = data;
    const rows: (string[] | null)[] = [
      r("Viewer Psychology", "Ego Threat", d.viewerPsychology.egoThreat),
      r("Viewer Psychology", "Identity Shift", d.viewerPsychology.identityShift),
      r("Viewer Psychology", "Shame Trigger", d.viewerPsychology.shameTrigger),
      r("Pain — Raw", "Surface", pa.rawPain.surface), r("Pain — Raw", "Real", pa.rawPain.real), r("Pain — Raw", "Evidence", pa.rawPain.redditEvidence),
      r("Pain — Resentment", "Target", pa.resentment.target), r("Pain — Resentment", "Expression", pa.resentment.expression), r("Pain — Resentment", "Evidence", pa.resentment.redditEvidence),
      r("Pain — False Belief", "Belief", pa.falseBeliefCollapse.belief), r("Pain — False Belief", "Crack Moment", pa.falseBeliefCollapse.crackMoment), r("Pain — False Belief", "Evidence", pa.falseBeliefCollapse.redditEvidence),
      r("Pain — Constraint", "Constraint", pa.specificConstraint.constraint), r("Pain — Constraint", "Why It Matters", pa.specificConstraint.whyItMatters), r("Pain — Constraint", "Evidence", pa.specificConstraint.redditEvidence),
      r("Pain — Conflict", "Know", pa.internalConflict.know), r("Pain — Conflict", "Can't", pa.internalConflict.cant), r("Pain — Conflict", "Evidence", pa.internalConflict.redditEvidence),
      r("Pain — Identity", "Admission", pa.identityThreat.admission), r("Pain — Identity", "Avoidance", pa.identityThreat.avoidance), r("Pain — Identity", "Evidence", pa.identityThreat.redditEvidence),
      r("Differentiation", "Competitor Voice", d.differentiation.competitorVoice),
      r("Differentiation", "Blind Spot", d.differentiation.blindSpot),
      r("Differentiation", "Unowned Angle", d.differentiation.unownedAngle),
      r("Differentiation", "Voice Opportunity", d.differentiation.voiceOpportunity),
      r("Hook Strategy", "Type", d.hookStrategy.type),
      r("Hook Strategy", "Target Emotion", d.hookStrategy.targetEmotion),
      r("Hook Strategy", "False Belief Hook", d.hookStrategy.falseBeliefHook),
      r("Content Brief", "Content Angle", d.contentBriefSeed.contentAngle),
      r("Content Brief", "Emotional Arc", d.contentBriefSeed.emotionalArc),
      r("Content Brief", "Key Differentiator", d.contentBriefSeed.keyDifferentiator),
      r("Content Brief", "Avoid List", d.contentBriefSeed.avoidList.join(" | ")),
      r("Quality Gate", "Pain Depth", d.qualityGate.painDepth),
      r("Quality Gate", "Resentment Found", d.qualityGate.resentmentFound),
      r("Quality Gate", "Belief Identified", d.qualityGate.beliefIdentified),
      r("Quality Gate", "Constraint Specific", d.qualityGate.constraintSpecific),
      r("Quality Gate", "Conflict Present", d.qualityGate.conflictPresent),
      r("Quality Gate", "Hook Strength", d.qualityGate.hookStrength),
      r("Quality Gate", "Novelty", d.qualityGate.novelty),
      r("Quality Gate", "Raw Voice Sample", d.qualityGate.rawVoiceSample),
    ];
    d.platformTranslation.forEach((t, i) => {
      rows.push(r(`Translation ${i + 1}`, "Reddit Insight", t.redditInsight), r(`Translation ${i + 1}`, "YouTube Language", t.youtubeLanguage), r(`Translation ${i + 1}`, "Emotion + Intensity", `${t.emotion} — ${t.intensity}`));
    });
    const valid = rows.filter(Boolean) as string[][];
    return [["Section", "Field", "Value"], ...valid].map((row) => row.map(esc).join(",")).join("\n");
  }, [data, pa]);

  function exportCSV() {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "youtube-synthesis.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={exportCSV} className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
          Export CSV
        </button>
      </div>
      <Section title="Viewer Psychology" note="Tâm lý sâu của viewer — dùng để chọn góc cảm xúc cho video">
        <Row label="Ego Threat" value={data.viewerPsychology.egoThreat} note="Điều đe dọa cái tôi họ" />
        <Row label="Identity Shift" value={data.viewerPsychology.identityShift} note="Thay đổi nhận thức bản thân" />
        <Row label="Shame Trigger" value={data.viewerPsychology.shameTrigger} />
      </Section>

      <Section title="Pain Architecture — 6 tầng giải phẫu" note="Từ pain bề mặt → identity threat. Mỗi tầng có bằng chứng Reddit.">
        {/* Raw Pain */}
        <div className="border-b border-[#1f1f1f] py-3">
          <p className="text-emerald-400 text-xs font-semibold mb-1">① Raw Pain</p>
          <Row label="Surface (đối thủ nói)" value={pa.rawPain.surface} />
          <Row label="Real (Reddit nói)" value={pa.rawPain.real} />
          <Row label="Evidence" value={pa.rawPain.redditEvidence} note="Trích dẫn Reddit" />
        </div>
        {/* Resentment */}
        <div className="border-b border-[#1f1f1f] py-3">
          <p className="text-red-400 text-xs font-semibold mb-1">② Resentment</p>
          <Row label="Target" value={pa.resentment.target} note="Ai/cái gì bị oán giận" />
          <Row label="Expression" value={pa.resentment.expression} />
          <Row label="Evidence" value={pa.resentment.redditEvidence} />
        </div>
        {/* False Belief Collapse */}
        <div className="border-b border-[#1f1f1f] py-3">
          <p className="text-amber-400 text-xs font-semibold mb-1">③ False Belief Collapse</p>
          <Row label="Belief" value={pa.falseBeliefCollapse.belief} note="Niềm tin sai đang bám víu" />
          <Row label="Crack Moment" value={pa.falseBeliefCollapse.crackMoment} note="Khoảnh khắc vỡ mộng" />
          <Row label="Evidence" value={pa.falseBeliefCollapse.redditEvidence} />
        </div>
        {/* Specific Constraint */}
        <div className="border-b border-[#1f1f1f] py-3">
          <p className="text-blue-400 text-xs font-semibold mb-1">④ Specific Constraint</p>
          <Row label="Constraint" value={pa.specificConstraint.constraint} note="Ràng buộc cụ thể (số tiền/hoàn cảnh)" />
          <Row label="Why It Matters" value={pa.specificConstraint.whyItMatters} />
          <Row label="Evidence" value={pa.specificConstraint.redditEvidence} />
        </div>
        {/* Internal Conflict */}
        <div className="border-b border-[#1f1f1f] py-3">
          <p className="text-purple-400 text-xs font-semibold mb-1">⑤ Internal Conflict</p>
          <Row label="Know (biết nên làm)" value={pa.internalConflict.know} />
          <Row label="Can't (nhưng không thể)" value={pa.internalConflict.cant} />
          <Row label="Evidence" value={pa.internalConflict.redditEvidence} />
        </div>
        {/* Identity Threat */}
        <div className="py-3">
          <p className="text-pink-400 text-xs font-semibold mb-1">⑥ Identity Threat</p>
          <Row label="Admission" value={pa.identityThreat.admission} note="Thừa nhận này đe dọa cái tôi" />
          <Row label="Avoidance" value={pa.identityThreat.avoidance} note="Cách họ né tránh" />
          <Row label="Evidence" value={pa.identityThreat.redditEvidence} />
        </div>
      </Section>

      {data.platformTranslation.length > 0 && (
        <Section title="Platform Translation" note="Chuyển ngữ Reddit → YouTube — dùng ngôn ngữ này trong script">
          {data.platformTranslation.map((t, i) => (
            <div key={i} className="border-b border-[#1f1f1f] last:border-0 py-3">
              <Row label="Reddit Insight" value={t.redditInsight} />
              <Row label="→ YouTube Language" value={t.youtubeLanguage} />
              <Row label="Emotion" value={t.emotion} />
            </div>
          ))}
        </Section>
      )}

      <Section title="Differentiation" note="Cách định vị video bạn khác biệt so với đối thủ">
        <Row label="Competitor Voice" value={data.differentiation.competitorVoice} />
        <Row label="Blind Spot" value={data.differentiation.blindSpot} note="Điểm mù đối thủ — cơ hội lớn nhất" />
        <Row label="Unowned Angle" value={data.differentiation.unownedAngle} note="Góc chưa ai khai thác" />
        <Row label="Voice Opportunity" value={data.differentiation.voiceOpportunity} />
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Hook Strategy" note="Kiểu hook nên dùng cho video bạn">
          <Row label="Type" value={data.hookStrategy.type} />
          <Row label="Target Emotion" value={data.hookStrategy.targetEmotion} />
          <Row label="False Belief Hook" value={data.hookStrategy.falseBeliefHook} note="Hook phá vỡ niềm tin sai — kết nối trực tiếp với Pain Architecture" />
        </Section>
        <Section title="Quality Gate" note="Checklist kiểm tra chất lượng — kỳ vọng có NO nếu data yếu">
          <Row label="Pain Depth" value={data.qualityGate.painDepth} />
          <Row label="Resentment Found" value={data.qualityGate.resentmentFound} />
          <Row label="Belief Identified" value={data.qualityGate.beliefIdentified} />
          <Row label="Constraint Specific" value={data.qualityGate.constraintSpecific} />
          <Row label="Conflict Present" value={data.qualityGate.conflictPresent} />
          <Row label="Hook Strength" value={data.qualityGate.hookStrength} />
          <Row label="Novelty" value={data.qualityGate.novelty} />
        </Section>
      </div>

      {data.qualityGate.rawVoiceSample && (
        <Section title="Raw Voice Sample" note="Giọng thật của viewer lúc 2AM — nếu câu này nghe giả, toàn bộ output cần xem lại">
          <p className="text-[#e2e2e2] text-sm italic leading-relaxed bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3">
            &ldquo;{data.qualityGate.rawVoiceSample}&rdquo;
          </p>
        </Section>
      )}

      <Section title="Content Brief Seed" note="Bản tóm tắt để bắt đầu viết script — điểm xuất phát hành động">
        <Row label="Content Angle" value={data.contentBriefSeed.contentAngle} />
        <Row label="Emotional Arc" value={data.contentBriefSeed.emotionalArc} />
        <Row label="Key Differentiator" value={data.contentBriefSeed.keyDifferentiator} />
        {data.contentBriefSeed.avoidList.length > 0 && (
          <div className="py-2">
            <p className="text-[#8a8a8a] text-xs uppercase tracking-wider mb-2">Avoid List</p>
            <div className="flex flex-wrap gap-2">
              {data.contentBriefSeed.avoidList.map((a, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md bg-red-900/20 border border-red-900/30 text-red-400 text-xs">{a}</span>
              ))}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
