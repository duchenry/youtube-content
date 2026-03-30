import { useState } from "react";
import { RedditIdea } from "./types";

interface AnalysisResponse {
  success: boolean;
  analysis?: RedditIdea;
  error?: string;
  code?: string;
  cached?: boolean;
  id?: string;
}

export function useRedditAnalyzer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RedditIdea | null>(null);
  const [cached, setCached] = useState(false);

  const analyze = async (redditUrl: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setCached(false);

    try {
      const res = await fetch("/api/reddit-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reddit_url: redditUrl }),
      });

      const data: AnalysisResponse = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to analyze Reddit post");
        return false;
      }

      setAnalysis(data.analysis || null);
      setCached(data.cached || false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setError(null);
    setCached(false);
  };

  return {
    analyze,
    reset,
    loading,
    error,
    analysis,
    cached,
  };
}
