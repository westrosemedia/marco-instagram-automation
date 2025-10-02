import { NextRequest, NextResponse } from "next/server";
import { replyToComment, sendDM } from "@/lib/instagram";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["comment", "dm"]),
  targetId: z.string(),
  text: z.string().min(1).max(900),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, targetId, text, userId } = schema.parse(body);

  if (type === "comment") {
    const res = await replyToComment(targetId, text);
    return NextResponse.json({ ok: true, res });
  }

  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });
  }

  const res = await sendDM(userId, text);
  return NextResponse.json({ ok: true, res });
}