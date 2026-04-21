/**
 * INPUT MAPPING LAYER
 * Chỉ map đúng field cần thiết cho từng section
 * KHÔNG inject toàn bộ object
 * Tuân thủ nguyên tắc: chỉ gửi đúng data phần đó cần
 */

export function buildSectionInput(section: string, data: any): Record<string, string> {
  switch (section) {

    case "hook":
      return {
        rawPain: data.painArchitecture?.rawPain?.real || "",
        surfacePain: data.painArchitecture?.rawPain?.surface || "",
        contradiction: data.painArchitecture?.internalConflict?.know + " vs " + data.painArchitecture?.internalConflict?.cant || "",
        egoThreat: data.viewerPsychology?.egoThreat || "",
        falseBelief: data.painArchitecture?.falseBeliefCollapse?.belief || ""
      };

    case "setup":
      return {
        surfacePain: data.painArchitecture?.rawPain?.surface || "",
        realPain: data.painArchitecture?.rawPain?.real || "",
        constraint: data.painArchitecture?.specificConstraint?.constraint || "",
        scenario: data.painArchitecture?.rawPain?.redditEvidence || "",
        example: data.platformTranslation?.[0]?.youtubeLanguage || ""
      };

    case "contradiction":
      return {
        contradiction: data.painArchitecture?.internalConflict?.know + " vs " + data.painArchitecture?.internalConflict?.cant || "",
        noWinLoop: data.painArchitecture?.internalConflict?.redditEvidence || "",
        behaviorLoop: data.platformTranslation?.[0]?.redditInsight || "",
        emotionalDriver: data.painArchitecture?.resentment?.expression || "",
        identityPressure: data.viewerPsychology?.shameTrigger || "",
        hiddenTruth: data.differentiation?.blindSpot || ""
      };

    case "reframe":
      return {
        falseBelief: data.painArchitecture?.falseBeliefCollapse?.belief || "",
        crackMoment: data.painArchitecture?.falseBeliefCollapse?.crackMoment || "",
        hiddenTruth: data.painArchitecture?.falseBeliefCollapse?.redditEvidence || "",
        blindSpot: data.differentiation?.blindSpot || ""
      };

    case "solution":
      return {
        constraint: data.painArchitecture?.specificConstraint?.constraint || "",
        behaviorLoop: data.platformTranslation?.[0]?.redditInsight || "",
        emotionalDriver: data.contentBriefSeed?.emotionalArc || ""
      };

    case "close":
      return {
        coreTruth: data.painArchitecture?.falseBeliefCollapse?.belief || "",
        egoThreat: data.viewerPsychology?.egoThreat || "",
        identityShift: data.viewerPsychology?.identityShift || ""
      };

    default:
      return {};
  }
}