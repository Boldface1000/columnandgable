import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useLiveQuotes } from "@/lib/app-state";
import { useAuthGuard } from "@/lib/auth-guard";

export const Route = createFileRoute("/stocks")({
  head: () => ({
    meta: [
      { title: "Live Stocks — Column & Gable" },
      { name: "description", content: "Live prices and movement across the most traded stocks and digital assets." },
      { property: "og:title", content: "Live Stocks — Column & Gable" },
      { property: "og:description", content: "Track the most traded tickers in real time." },
    ],
  }),
  component: Stocks,
});

function Stocks() {
  const { authed } = useAuthGuard();
  const navigate = useNavigate();
  const { quotes } = useLiveQuotes();


  if (!authed) return <div className="min-h-screen bg-background" />;
  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur-xl">
        <button aria-label="Back" onClick={() => navigate({ to: "/discover" })}>
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="font-display text-xl font-bold">Live stocks</h1>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2 animate-pulse rounded-full bg-success" /> Live
        </span>
      </header>

      <div className="divide-y divide-border px-6">
        {quotes.map((s) => (
          <div key={s.ticker} className="flex items-center justify-between py-4">
            <div>
              <p className="font-display font-bold">{s.ticker}</p>
              <p className="text-xs text-muted-foreground">{s.name}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">${s.price.toLocaleString()}</p>
              <p className={s.change >= 0 ? "text-sm text-success" : "text-sm text-destructive"}>
                {s.change >= 0 ? "+" : ""}
                {s.change}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
