import { NextResponse } from "next/server";
import { getRecentMessages } from "@/lib/instagram";
import { writeInWRMVoice } from "@/lib/openai";
import { WRM_CONTEXT } from "@/lib/prompts";
import { upsertLead } from "@/lib/notion";

export async function GET() {
  // Check if we have Instagram credentials
  if (!process.env.IG_USER_ID || process.env.IG_USER_ID === 'your-instagram-business-account-id') {
    // Return mock data for testing
    const mockMessages = [
      {
        threadId: "mock_thread_1",
        userId: "mock_user_1",
        username: "potential_client",
        lastMsg: "Hi! I saw your post about content strategy. I'm interested in working with you.",
        draft: "Hey! Thanks for reaching out. I'd love to learn more about your business and how I can help. What's your biggest content challenge right now? Let's hop on a quick call this week."
      },
      {
        threadId: "mock_thread_2",
        userId: "mock_user_2", 
        username: "coach_mike",
        lastMsg: "Your content is amazing! Do you offer any coaching programs?",
        draft: "Thank you so much! Yes, I have a few options that might be perfect for you. What's your main goal - growing your audience or converting better? I'd love to share what's working for my clients."
      }
    ];
    return NextResponse.json({ drafts: mockMessages });
  }

  try {
    const threads = await getRecentMessages(20);
    const out = [];
    for (const t of threads) {
      const userId = t.participants?.data?.[0]?.id;
      const username = t.participants?.data?.[0]?.username ?? "unknown";
      const lastMsg = t?.messages?.data?.[0]?.message ?? "";
      const draft = await writeInWRMVoice({
        context: WRM_CONTEXT,
        incoming: `${username}: ${lastMsg}`,
        goal: "dm",
      });
      out.push({ threadId: t.id, userId, username, lastMsg, draft });
      await upsertLead({
        handle: `@${username}`,
        platform: "instagram",
        source: "dm",
        lastMessage: lastMsg,
        status: "warm",
      });
    }
    return NextResponse.json({ drafts: out });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ drafts: [] });
  }
}