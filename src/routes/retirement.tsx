import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, Landmark, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "@/lib/app-state";
import { amountSchema, collectErrors } from "@/lib/validators";
import { useAuthGuard } from "@/lib/auth-guard";

export const Route = createFileRoute("/retirement")({
  head: () => ({
    meta: [
      { title: "Create a 401(k) — Column & Gable" },
      { name: "description", content: "Open a Column & Gable 401(k), fund it from your balance and project your legacy." },
      { property: "og:title", content: "Create a 401(k) — Column & Gable" },
      { property: "og:description", content: "Set contributions and project decades of compounding." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Retirement,
});

function Retirement() {
  const { authed } = useAuthGuard();
  const navigate = useNavigate();
  const { account, update } = useAccount();
  const [monthly, setMonthly] = useState(500);
  const [years, setYears] = useState(25);
  const [created, setCreated] = useState(false);
  const [initial, setInitial] = useState("");
  const [error, setError] = useState<string | undefined>();

  const balance = account?.balance ?? 0;
  const hasFunds = balance > 0;
  const projected = monthly * 12 * years * 2.6;

  const deposit = () => {
    const value = Number(initial) || 0;
    const found = collectErrors(amountSchema(100), value);
    if (value > balance) found["form"] = "Amount exceeds your available balance";
    setError(found["form"]);
    if (found["form"]) return;
    update({ balance: balance - value, savings: (account?.savings ?? 0) + value });
    toast.success(`401(k) funded with $${value.toFixed(2)}`);
    navigate({ to: "/discover" });
  };


  if (!authed) return <div className="min-h-screen bg-background" />;
  return (
    <div className="min-h-screen bg-background pb-14">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur-xl">
        <button aria-label="Back" onClick={() => navigate({ to: "/discover" })}>
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="font-display text-xl font-bold">Create 401(k)</h1>
      </header>

      <div className="px-6 pt-6">
        {!created ? (
          <>
            <div className="onyx-surface rounded-3xl p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Projected at retirement</p>
              <p className="mt-1 font-display text-4xl font-black">
                ${projected.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="mt-2 text-sm text-white/70">
                The account your grandchildren will thank you for.
              </p>
            </div>

            <label className="mt-6 block text-sm font-medium">Monthly contribution — ${monthly}</label>
            <input
              type="range"
              min={100}
              max={3000}
              step={50}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="mt-2 w-full accent-[oklch(0.78_0.13_87)]"
            />

            <label className="mt-6 block text-sm font-medium">Years to retirement — {years}</label>
            <input
              type="range"
              min={5}
              max={45}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="mt-2 w-full accent-[oklch(0.78_0.13_87)]"
            />

            <button
              onClick={() => {
                setCreated(true);
                toast.success("401(k) created — fund it to activate");
              }}
              className="gold-surface mt-10 flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold"
            >
              Create my 401(k)
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-2xl border border-primary/40 bg-accent/40 p-4">
              <CheckCircle2 className="size-5 text-primary" />
              <p className="text-sm font-semibold">
                401(k) created · ${monthly}/mo for {years} years
              </p>
            </div>

            <div className="onyx-surface mt-4 rounded-3xl p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Your account balance</p>
              <p className="mt-1 font-display text-4xl font-black">
                ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="mt-2 text-sm text-white/70">
                {hasFunds
                  ? "Choose how much of your balance opens the plan."
                  : "You need funds in your account before the plan can be activated."}
              </p>
            </div>

            {hasFunds ? (
              <>
                <h2 className="mt-7 font-display text-lg font-bold">Initial deposit</h2>
                <div className="mt-3 rounded-3xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-3xl font-black text-muted-foreground">USD</span>
                    <input
                      value={initial}
                      onChange={(e) => {
                        setInitial(e.target.value.replace(/[^\d.]/g, ""));
                        setError(undefined);
                      }}
                      inputMode="decimal"
                      placeholder="0"
                      aria-label="Initial 401(k) deposit"
                      className="w-full bg-transparent font-display text-3xl font-black outline-none"
                    />
                  </div>
                  {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
                </div>
                <button
                  onClick={deposit}
                  className="gold-surface mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-full font-bold shadow-gold"
                >
                  <Landmark className="size-5" /> Fund my 401(k)
                </button>
              </>
            ) : (
              <Link
                to="/add-money"
                className="gold-surface mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-full font-bold shadow-gold"
              >
                <Plus className="size-5" /> Add money
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
