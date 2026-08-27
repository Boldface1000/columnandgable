import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuthGuard } from "@/lib/auth-guard";
import {
  useAccount,
  fetchActivities,
  directionOf,
  DIRECTION_LABEL,
  type Activity,
  type ActivityDirection,
} from "@/lib/app-state";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Transaction History — Column & Gable" },
      {
        name: "description",
        content: "Every deposit, withdrawal, transfer and payment on your Column & Gable account, split into received and sent.",
      },
      { property: "og:title", content: "Transaction History — Column & Gable" },
      { property: "og:description", content: "See everything you've received and sent." },
    ],
  }),
  component: HistoryPage,
});

const money = (n: number) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

type FilterKey = "all" | ActivityDirection;

function HistoryPage() {
  const { authed } = useAuthGuard();
  const { account, ready } = useAccount();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    if (!account) return;
    let alive = true;
    setLoading(true);
    void fetchActivities(account.id).then((rows) => {
      if (alive) {
        setActivities(rows);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [account]);

  const filtered = useMemo(
    () => activities.filter((a) => filter === "all" || directionOf(a.kind) === filter),
    [activities, filter],
  );

  if (!authed || !ready) return <div className="min-h-screen bg-background" />;

  return (
    <AppShell variant="plain" title="History">
      <div className="flex gap-2 rounded-full border border-border bg-card p-1.5">
        {(
          [
            { key: "all", label: "All" },
            { key: "received", label: "Received" },
            { key: "sent", label: "Sent" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={
              filter === key
                ? "gold-surface flex-1 rounded-full py-2.5 text-sm font-bold shadow-gold"
                : "flex-1 rounded-full py-2.5 text-sm font-medium text-muted-foreground"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!loading && filtered.length === 0 && (
          <div className="rounded-3xl border border-border bg-card p-8 text-center">
            <Receipt className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No transactions yet.</p>
          </div>
        )}

        {!loading &&
          filtered.map((a) => {
            const direction = directionOf(a.kind);
            const received = direction === "received";
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                <span
                  className={
                    received
                      ? "grid size-11 shrink-0 place-items-center rounded-full bg-success/15 text-success"
                      : "grid size-11 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive"
                  }
                >
                  {received ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold capitalize">{a.kind}</span>
                    <span
                      className={
                        received
                          ? "rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-success"
                          : "rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-destructive"
                      }
                    >
                      {DIRECTION_LABEL[direction]}
                    </span>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {a.method ? `${a.method} · ` : ""}
                    {new Date(a.created_at).toLocaleString()} · {a.status}
                  </span>
                </span>
                <span className={received ? "font-display font-bold text-success" : "font-display font-bold text-destructive"}>
                  {received ? "+" : "-"}
                  {money(Number(a.amount))}
                </span>
              </div>
            );
          })}
      </div>
    </AppShell>
  );
}
