"use client";
import { useEffect, useState } from "react";

export default function LeadTable() {
  const [comments, setComments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/ig/comments").then(r=>r.json()).then(d=>setComments(d.drafts));
    fetch("/api/ig/messages").then(r=>r.json()).then(d=>setMessages(d.drafts));
  }, []);

  async function send(type: "comment" | "dm", row: any) {
    const body: any = { type, targetId: type==="comment" ? row.commentId : row.threadId, text: row.draft };
    if (type === "dm") body.userId = row.userId;
    const res = await fetch("/api/ig/reply", { method: "POST", body: JSON.stringify(body) });
    alert(res.ok ? "Sent" : "Failed");
  }

  return (
    <div className="p-6 grid gap-8">
      <section>
        <h2 className="text-xl font-semibold">Comment replies</h2>
        <div className="grid gap-3">
          {comments.map((c, i) => (
            <div key={i} className="p-4 bg-white rounded-2xl shadow flex flex-col gap-2">
              <div className="text-sm opacity-70">@{c.from}</div>
              <div className="text-sm">Their comment: {c.text}</div>
              <textarea className="border p-2 rounded" value={c.draft} onChange={e=>setComments(prev=>prev.map((x,j)=>j===i?{...x,draft:e.target.value}:x))}/>
              <div className="flex gap-2">
                <button onClick={()=>send("comment", c)} className="px-3 py-2 bg-black text-white rounded">Post reply</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">DM drafts</h2>
        <div className="grid gap-3">
          {messages.map((m, i) => (
            <div key={i} className="p-4 bg-white rounded-2xl shadow flex flex-col gap-2">
              <div className="text-sm opacity-70">@{m.username}</div>
              <div className="text-sm">Last msg: {m.lastMsg}</div>
              <textarea className="border p-2 rounded" value={m.draft} onChange={e=>setMessages(prev=>prev.map((x,j)=>j===i?{...x,draft:e.target.value}:x))}/>
              <div className="flex gap-2">
                <button onClick={()=>send("dm", m)} className="px-3 py-2 bg-black text-white rounded">Send DM</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
