import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";
import { RedditIdea } from "./types";

export interface RedditIdeaEntry {
  id: string;
  url: string;
  analysis: RedditIdea;
  label: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useRedditHistory() {
  const [history, setHistory] = useState<RedditIdeaEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all reddit ideas
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reddit_ideas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setHistory((data || []) as RedditIdeaEntry[]);
    } catch (err) {
      console.error("Failed to fetch Reddit history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Get idea by URL
  const getIdeaByUrl = useCallback(
    (url: string): RedditIdeaEntry | null => {
      return history.find((entry) => entry.url === url) || null;
    },
    [history]
  );

  // Update label
  const updateLabel = useCallback(
    async (id: string, label: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("reddit_ideas")
          .update({ label, updated_at: new Date().toISOString() })
          .eq("id", id);

        if (error) throw error;

        // Update local state
        setHistory((prev) =>
          prev.map((entry) =>
            entry.id === id
              ? { ...entry, label, updated_at: new Date().toISOString() }
              : entry
          )
        );

        return true;
      } catch (err) {
        console.error("Failed to update label:", err);
        return false;
      }
    },
    []
  );

  // Update notes
  const updateNotes = useCallback(
    async (id: string, notes: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("reddit_ideas")
          .update({ notes, updated_at: new Date().toISOString() })
          .eq("id", id);

        if (error) throw error;

        // Update local state
        setHistory((prev) =>
          prev.map((entry) =>
            entry.id === id
              ? { ...entry, notes, updated_at: new Date().toISOString() }
              : entry
          )
        );

        return true;
      } catch (err) {
        console.error("Failed to update notes:", err);
        return false;
      }
    },
    []
  );

  // Delete idea
  const deleteIdea = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("reddit_ideas").delete().eq("id", id);

      if (error) throw error;

      setHistory((prev) => prev.filter((entry) => entry.id !== id));
      return true;
    } catch (err) {
      console.error("Failed to delete idea:", err);
      return false;
    }
  }, []);

  return {
    history,
    loading,
    fetchHistory,
    getIdeaByUrl,
    updateLabel,
    updateNotes,
    deleteIdea,
  };
}
