import { NextResponse } from "next/server";
import { getRecentComments } from "@/lib/instagram";
import { writeInWRMVoice } from "@/lib/openai";
import { WRM_CONTEXT } from "@/lib/prompts";
import { upsertLead } from "@/lib/notion";

export async function GET() {
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
}