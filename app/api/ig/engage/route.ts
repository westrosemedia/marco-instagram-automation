import { NextResponse } from "next/server";
import { TARGET_MEDIA_IDS, getMediaComments, createComment } from "@/lib/instagram";
import { writeInWRMVoice } from "@/lib/openai";
import { WRM_CONTEXT } from "@/lib/prompts";

export async function POST() {
  const results = [];
  for (const mediaId of TARGET_MEDIA_IDS) {
    const comments = await getMediaComments(mediaId, 10);
    const top = comments.slice(0, 3); // engage lightly
    for (const c of top) {
      const draft = await writeInWRMVoice({
        context: WRM_CONTEXT,
        incoming: `${c.from?.username ?? "unknown"}: ${c.text}`,
        goal: "comment",
      });
      // Safety: only post if draft contains value
      if (draft.split(" ").length >= 6) {
        const res = await createComment(mediaId, draft);
        results.push({ mediaId, posted: true, id: res.id });
      }
    }
  }
  return NextResponse.json({ results });
}