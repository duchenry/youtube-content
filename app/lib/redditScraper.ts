import { RedditPostData } from "./types";

/**
 * Extract Reddit post ID and subreddit from URL
 * Handles formats:
 *   - https://reddit.com/r/subreddit/comments/abc123/title/
 *   - https://www.reddit.com/r/subreddit/comments/abc123/title/
 *   - https://old.reddit.com/r/subreddit/comments/abc123/title/
 */
function parseRedditUrl(url: string): { postId: string; subreddit: string } | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Match /r/subreddit/comments/postId/
    const match = pathname.match(
      /\/r\/([a-zA-Z0-9_]+)\/comments\/([a-zA-Z0-9]+)\//
    );

    if (!match) {
      return null;
    }

    const subreddit = match[1];
    const postId = match[2];

    return { postId, subreddit };
  } catch {
    return null;
  }
}

/**
 * Scrape Reddit post data using Reddit JSON API
 * No authentication required — uses public API endpoint
 *
 * Fetches:
 * - Post title
 * - Post self-text
 * - Top 10 most upvoted comments
 *
 * Error Handling:
 * - Network failures: throws with descriptive message
 * - Invalid URL: returns null
 * - Reddit API errors: throws with API error
 */
export async function scrapeRedditPost(
  redditUrl: string
): Promise<RedditPostData | null> {
  // Validate and parse URL
  const parsed = parseRedditUrl(redditUrl);
  if (!parsed) {
    throw new Error(
      "Invalid Reddit URL. Expected format: https://reddit.com/r/subreddit/comments/postId/title/"
    );
  }

  const { postId } = parsed;

  try {
    // Fetch post data from Reddit JSON API
    // Reddit API returns JSON when you append .json to any post URL
    const apiUrl = `${redditUrl.replace(/\/$/, "")}.json`;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Reddit post not found (404). Check URL validity.");
      }
      if (response.status === 403) {
        throw new Error("Access denied (403). Post may be private or deleted.");
      }
      throw new Error(
        `Reddit API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = (await response.json()) as unknown[];

    if (!Array.isArray(data) || data.length < 2) {
      throw new Error("Invalid Reddit API response structure");
    }

    // Reddit API returns [post, comments] array
    const postData = data[0] as { data: { children: unknown[] } };
    const commentsData = data[1] as { data: { children: unknown[] } };

    if (
      !postData?.data?.children?.[0] ||
      !commentsData?.data?.children
    ) {
      throw new Error("Could not parse Reddit post data");
    }

    const post = (postData.data.children[0] as { data: RedditAPIPost }).data;

    if (!post) {
      throw new Error("Post data is empty");
    }

    // Extract top 10 comments
    const comments = (commentsData.data.children as Array<{ data: RedditAPIComment }>)
      .map((item: { data: RedditAPIComment }) => {
        const comment = item.data;
        return {
          author: comment.author || "[deleted]",
          text: comment.body || "",
          upvotes: comment.ups || 0,
        };
      })
      .filter((c) => c.text && c.text.length < 5000) // Filter out empty/huge comments
      .sort((a, b) => b.upvotes - a.upvotes) // Sort by upvotes descending
      .slice(0, 10); // Take top 10

    const result: RedditPostData = {
      title: post.title || "",
      selfText: post.selftext || "",
      upvotes: post.ups || 0,
      comments,
    };

    // Validate we got meaningful data
    if (!result.title || (!result.selfText && result.comments.length === 0)) {
      throw new Error("Post appears empty or inaccessible");
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw with context if it's already our custom error
      if (
        error.message.includes("Invalid Reddit") ||
        error.message.includes("Reddit API") ||
        error.message.includes("Post")
      ) {
        throw error;
      }
      throw new Error(
        `Failed to scrape Reddit post: ${error.message}`
      );
    }
    throw new Error("Failed to scrape Reddit post: Unknown error");
  }
}

// ── Type definitions for Reddit API response ──────────────

interface RedditAPIPost {
  title: string;
  selftext: string;
  ups: number;
  author: string;
  created_utc: number;
  score: number;
  url: string;
}

interface RedditAPIComment {
  author: string;
  body: string;
  ups: number;
  score: number;
  created_utc: number;
}
