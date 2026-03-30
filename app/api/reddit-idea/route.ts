import { NextRequest, NextResponse } from "next/server";
import { scrapeRedditPost } from "@/app/lib/redditScraper";
import { analyzeRedditWithGPT5Mini } from "@/app/lib/redditAnalyzer";
import { supabase } from "@/app/lib/supabase";
import { RedditIdea } from "@/app/lib/types";

/**
 * POST /api/reddit-idea
 *
 * Accepts a Reddit post URL and returns viral content DNA analysis
 *
 * Request body:
 * {
 *   "reddit_url": "https://reddit.com/r/subreddit/comments/abc123/title/"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "id": "uuid",
 *   "url": "...",
 *   "analysis": { ...RedditIdea... },
 *   "message": "Analysis saved to database"
 * }
 *
 * Error response:
 * {
 *   "success": false,
 *   "error": "Error message",
 *   "code": "INVALID_URL" | "SCRAPE_FAILED" | "ANALYSIS_FAILED" | "DB_ERROR"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // ─────────────────────────────────────────────────────────
    // 1. Validate request
    // ─────────────────────────────────────────────────────────
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Server not configured: OPENAI_API_KEY missing",
          code: "SERVER_ERROR",
        },
        { status: 500 }
      );
    }

    const body = (await req.json()) as { reddit_url?: string };
    const redditUrl = body.reddit_url?.trim();
    
    if (!redditUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "reddit_url is required",
          code: "MISSING_URL",
        },
        { status: 400 }
      );
    }

    // Ensure it's actually a Reddit URL
    if (!redditUrl.includes("reddit.com")) {
      return NextResponse.json(
        {
          success: false,
          error: "URL must be a valid Reddit post URL (reddit.com)",
          code: "INVALID_URL",
        },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────
    // 2. Check if we've already analyzed this URL
    // ─────────────────────────────────────────────────────────
    const { data: existing } = await supabase
      .from("reddit_ideas")
      .select("id, analysis")
      .eq("url", redditUrl)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        id: existing.id,
        url: redditUrl,
        analysis: existing.analysis as RedditIdea,
        cached: true,
        message: "Analysis retrieved from cache",
      });
    }

    // ─────────────────────────────────────────────────────────
    // 3. Scrape Reddit post
    // ─────────────────────────────────────────────────────────
    let redditData;
    try {
      redditData = await scrapeRedditPost(redditUrl);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown scraping error";

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          code: "SCRAPE_FAILED",
        },
        { status: 400 }
      );
    }

    if (!redditData) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not parse Reddit post data",
          code: "SCRAPE_FAILED",
        },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────
    // 4. Analyze with gpt-5-mini
    // ─────────────────────────────────────────────────────────
    let analysis: RedditIdea;
    try {
      analysis = await analyzeRedditWithGPT5Mini(redditData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown analysis error";

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          code: "ANALYSIS_FAILED",
        },
        { status: 500 }
      );
    }

    // ─────────────────────────────────────────────────────────
    // 5. Store in Supabase
    // ─────────────────────────────────────────────────────────
    const { data: inserted, error: dbError } = await supabase
      .from("reddit_ideas")
      .insert({
        url: redditUrl,
        reddit_data: redditData,
        analysis: analysis,
        status: "analyzed",
      })
      .select("id")
      .single();

    if (dbError || !inserted) {
      console.error("Supabase insert error:", dbError);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to save analysis to database",
          code: "DB_ERROR",
        },
        { status: 500 }
      );
    }

    // ─────────────────────────────────────────────────────────
    // 6. Return success response
    // ─────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      id: inserted.id,
      url: redditUrl,
      analysis: analysis,
      cached: false,
      message: "Reddit post analyzed successfully",
    });
  } catch (error) {
    console.error("Unhandled error in /api/reddit-idea:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reddit-idea?url=...
 *
 * Retrieve analysis for a Reddit URL (if it exists)
 * Useful for checking cache before making POST request
 */
export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: "url query parameter is required",
          code: "MISSING_URL",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("reddit_ideas")
      .select("id, url, analysis, created_at")
      .eq("url", url)
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error: "No analysis found for this URL",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      url: data.url,
      analysis: data.analysis as RedditIdea,
      created_at: data.created_at,
      message: "Analysis retrieved successfully",
    });
  } catch (error) {
    console.error("Unhandled error in GET /api/reddit-idea:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
