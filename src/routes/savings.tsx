import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "@/lib/app-state";
import { useAuthGuard } from "@/lib/auth-guard";

export const Route = createFileRoute("/savings")({
  head: () => ({
    meta: [
      { title: "Savings Vault — Column & Gable" },
      { name: "description", content: "Track your savings vault balance, weekly profit and loss on Column & Gable." },
      { property: "og:title", content: "Savings Vault — Column & Gable" },
      { property: "og:description", content: "Weekly profit and loss on your savings vault." },
    ],
  }),
  component: Savings,
});

function Savings() {
  const { authed } = useAuthGuard();
  const navigate = useNavigate();
  const { account, update } = useAccount();
  const balance = account?.savings ?? 0;


  if (!authed) return <div className="min-h-screen bg-background" />;
  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur-xl">
        <button aria-label="Back" onClick={() => navigate({ to: "/finance" })}>
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="font-display text-xl font-bold">Savings</h1>
      </header>

      <div className="px-6 pt-6">
        <div className="onyx-surface rounded-3xl p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Vault balance</p>
          <p className="mt-1 font-display text-4xl font-black">${balance.toFixed(2)}</p>
        </div>

        <h2 className="mt-6 font-display text-lg font-bold">Profit &amp; Loss</h2>
        <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
          {[
            ["This week", balance * 0.25],
            ["This month", balance * 1.1],
            ["Year to date", balance * 4.2],
            ["Realised loss", 0],
          ].map(([k, v]) => (
            <div key={k as string} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{k}</span>
              <span className={(v as number) > 0 ? "font-semibold text-success" : "text-muted-foreground"}>
                {(v as number) > 0 ? "+" : ""}${(v as number).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            const move = Math.min(100, account?.balance ?? 0);
            if (move <= 0) {
              toast.error("Add money to your balance first");
              return;
            }
            update({ balance: (account?.balance ?? 0) - move, savings: balance + move });
            toast.success(`$${move} moved into savings`);
          }}
          className="gold-surface mt-8 flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold"
        >
          Move $100 into savings
        </button>
      </div>
    </div>
  );
}
