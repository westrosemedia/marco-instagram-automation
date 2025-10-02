import { NextResponse } from "next/server";
import { getRecentComments } from "@/lib/instagram";
import { writeInWRMVoice } from "@/lib/openai";
import { WRM_CONTEXT } from "@/lib/prompts";
import { upsertLead } from "@/lib/notion";

export async function GET() {
  // Check if we have Instagram credentials
  if (!process.env.IG_USER_ID || process.env.IG_USER_ID === 'your-instagram-business-account-id') {
    // Return mock data for testing
    const mockComments = [
      {
        commentId: "mock_1",
        from: "testuser1",
        text: "Love this post! How can I learn more?",
        draft: "Thanks for the love! Check out our free guide in my bio - it's packed with exactly what you need to get started. What's your biggest challenge right now?"
      },
      {
        commentId: "mock_2", 
        from: "coach_sarah",
        text: "This is exactly what I needed to hear today",
        draft: "So glad it resonated! I'd love to hear more about your journey. What's your main focus this quarter?"
      }
    ];
    return NextResponse.json({ drafts: mockComments });
  }

  try {
    const comments = await getRecentComments(25);
    const drafts = [];
    for (const c of comments) {
      const incoming = `${c.from?.username ?? "unknown"}: ${c.text}`;
      const draft = await writeInWRMVoice({
        context: WRM_CONTEXT,
        incoming,
        goal: "comment",
      });
      drafts.push({
        commentId: c.id,
        from: c.from?.username,
        text: c.text,
        draft,
      });
      if (c.from?.username) {
        await upsertLead({
          handle: `@${c.from.username}`,
          platform: "instagram",
          source: "comment",
          lastMessage: c.text,
        });
      }
    }
    return NextResponse.json({ drafts });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ drafts: [] });
  }
}