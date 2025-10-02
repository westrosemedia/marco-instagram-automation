import { NextResponse } from "next/server";
import { shouldRunNow } from "@/lib/scheduler";

export async function GET() {
  if (!shouldRunNow()) {
    return NextResponse.json({ ran: false, reason: "not time" });
  }
  const base = process.env.APP_URL!;
  const r1 = await fetch(`${base}/api/ig/comments`, { cache: "no-store" });
  const r2 = await fetch(`${base}/api/ig/messages`, { cache: "no-store" });
  const c1 = await r1.json();
  const c2 = await r2.json();
  return NextResponse.json({ ran: true, comments: c1, messages: c2 });
}
