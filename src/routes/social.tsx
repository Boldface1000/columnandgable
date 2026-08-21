import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { buildLeaderboard } from "@/lib/app-state";
import { useAuthGuard } from "@/lib/auth-guard";

export const Route = createFileRoute("/social")({
  head: () => ({
    meta: [
      { title: "Social — Top 50 Members | Column & Gable" },
      {
        name: "description",
        content: "See the top 50 Column & Gable members, their headline holding and this cycle's profit margin.",
      },
      { property: "og:title", content: "Social — Top 50 Members" },
      { property: "og:description", content: "The members compounding fastest this cycle." },
    ],
  }),
  component: Social,
});

function Social() {
  const { authed } = useAuthGuard();
  const leaders = buildLeaderboard(50);


  if (!authed) return <div className="min-h-screen bg-background" />;
  return (
    <AppShell variant="social" title="Social">
      <p className="mb-4 text-sm text-muted-foreground">
        Top 50 members this cycle. Rankings rotate every 12 hours.
      </p>
      <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
        {leaders.map((l) => (
          <div key={l.rank} className="flex items-center gap-3 p-4">
            <span className="w-6 font-display text-sm font-bold text-muted-foreground">{l.rank}</span>
            <span className="grid size-11 place-items-center rounded-full bg-muted text-xl">{l.avatar}</span>
            <div className="flex-1">
              <p className="font-semibold">{l.name}</p>
              <p className="text-xs text-muted-foreground">Bought {l.ticker}</p>
            </div>
            <span className="font-display font-bold text-success">+{l.gain}%</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
