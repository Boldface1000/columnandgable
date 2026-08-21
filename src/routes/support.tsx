import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useThread, sendMessage } from "@/lib/app-state";
import { useAuthGuard } from "@/lib/auth-guard";
import { useEffect } from "react";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Message Support — Column & Gable" },
      {
        name: "description",
        content:
          "Chat directly with the Column & Gable operations desk about deposits, withdrawals, loans and savings.",
      },
      { property: "og:title", content: "Message Support — Column & Gable" },
      { property: "og:description", content: "Talk to the operations desk in real time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Support,
});

function Support() {
  const navigate = useNavigate();
  const { authed } = useAuthGuard();
  const [userId, setUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const { messages } = useThread(userId, "user");

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const send = async () => {
    const body = draft.trim();
    if (!body || !userId) return;
    setDraft("");
    const { error } = await sendMessage(userId, body, "user");
    if (error) toast.error(error);
  };

  if (!authed) return <div className="min-h-screen bg-background" />;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur-xl">
        <button aria-label="Back" onClick={() => navigate({ to: "/discover" })}>
          <ArrowLeft className="size-6" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold">Operations desk</h1>
          <p className="text-xs text-muted-foreground">Typically replies within minutes</p>
        </div>
      </header>

      <div className="flex-1 space-y-3 px-5 py-6">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            <ShieldCheck className="mb-2 size-5 text-primary" />
            Start the conversation — deposits, withdrawals, loan files and savings plans are all handled
            here by a named operator.
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.sender_role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.sender_role === "user"
                  ? "gold-surface max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm font-medium"
                  : "max-w-[80%] rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 text-sm"
              }
            >
              {m.body}
              <span className="mt-1 block text-[10px] opacity-60">
                {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-background/95 px-5 py-4 backdrop-blur-xl">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send();
          }}
          aria-label="Message"
          placeholder="Write a message…"
          className="h-13 w-full rounded-full bg-muted px-5 py-3 outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => void send()}
          disabled={!draft.trim()}
          aria-label="Send message"
          className="gold-surface grid size-13 shrink-0 place-items-center rounded-full p-3.5 shadow-gold disabled:opacity-40"
        >
          <Send className="size-5" />
        </button>
      </div>
    </div>
  );
}
