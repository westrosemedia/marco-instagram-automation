import { NextResponse } from "next/server";
import { getRecentMessages } from "@/lib/instagram";
import { writeInWRMVoice } from "@/lib/openai";
import { WRM_CONTEXT } from "@/lib/prompts";
import { upsertLead } from "@/lib/notion";

export async function GET() {
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
}