import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Info, ChevronDown, CreditCard, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAccount, submitLoanApplication, submitSavingsPlan } from "@/lib/app-state";
import { useAuthGuard } from "@/lib/auth-guard";
const tradingBot = "https://placehold.co/800x600?text=Trading+Bot";


export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "Finance — Loans, Savings & Auto Invest | Column & Gable" },
      {
        name: "description",
        content:
          "Deposit to gain 25% interest, run an auto-invest portfolio, track savings profit and loss, or draw a member loan.",
      },
      { property: "og:title", content: "Finance — Loans, Savings & Auto Invest" },
      { property: "og:description", content: "Investment, savings and credit in one tab." },
    ],
  }),
  component: Finance,
});

const RISK = [
  { name: "Conservative", desc: "Primary aim is to preserve capital and minimise potential of loss.", mix: [97, 2, 1], weekly: "15%" },
  { name: "Balanced", desc: "Blend of growth and protection. The member favourite.", mix: [55, 30, 15], weekly: "20%" },
  { name: "Aggressive", desc: "Maximum exposure to growth assets and digital markets.", mix: [20, 55, 25], weekly: "25%" },
];

function Finance() {
  const { authed } = useAuthGuard();
  const { account, update } = useAccount();
  const [tab, setTab] = useState<"loan" | "savings" | "invest">("invest");
  const [busy, setBusy] = useState(false);
  const [loan, setLoan] = useState({ amount: "", id_type: "", id_number: "", ssn_last4: "" });
  const [plan, setPlan] = useState("");

  const applyLoan = async () => {
    setBusy(true);
    const { error } = await submitLoanApplication({
      amount: Number(loan.amount) || 0,
      id_type: loan.id_type.trim(),
      id_number: loan.id_number.trim(),
      ssn_last4: loan.ssn_last4,
    });
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Loan application submitted for review");
    setLoan({ amount: "", id_type: "", id_number: "", ssn_last4: "" });
  };

  const openPlan = async () => {
    setBusy(true);
    const { error } = await submitSavingsPlan(Number(plan) || 0);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Savings plan submitted");
    setPlan("");
  };

  const [risk, setRisk] = useState(0);
  const [initial, setInitial] = useState(100);
  const [monthly, setMonthly] = useState(0);
  const profile = RISK[risk]!;

  if (!authed) return <div className="min-h-screen bg-background" />;

  return (
    <AppShell variant="finance" title="Finance">
      <div className="flex gap-2 rounded-full border border-border bg-card p-1.5">

        {(["loan", "savings", "invest"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "gold-surface flex-1 rounded-full py-2.5 text-sm font-bold capitalize shadow-gold"
                : "flex-1 rounded-full py-2.5 text-sm font-medium capitalize text-muted-foreground"
            }
          >
            {t === "invest" ? "Investment" : t}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-primary/40 bg-accent/40">
        <img
          src={tradingBot}
          alt="Column & Gable algorithmic trading desk driving a rising returns curve"
          loading="lazy"
          width={1024}
          height={640}
          className="h-32 w-full object-cover"
        />
        <div className="p-4">
          <p className="font-display font-bold">Deposit to gain 25% interest</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Weekly settlement on eligible balances, executed by our in-house trading bots.{" "}
            <Link to="/about" className="font-semibold text-primary underline-offset-2 hover:underline">
              Read more
            </Link>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Message — due to investors from onboarding.
          </p>
        </div>
      </div>


      {tab === "invest" && (
        <section className="mt-6 animate-rise">
          <div className="flex items-start justify-between">
            <div className="pr-4">
              <h2 className="font-display text-3xl font-black text-muted-foreground">{profile.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{profile.desc}</p>
            </div>
            <ChevronDown className="mt-2 size-6 shrink-0 text-muted-foreground" />
          </div>

          <input
            type="range"
            min={0}
            max={2}
            value={risk}
            onChange={(e) => setRisk(Number(e.target.value))}
            aria-label="Risk profile"
            className="mt-4 w-full accent-[oklch(0.78_0.13_87)]"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>More Conservative</span>
            <span>More Aggressive</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Contribution label="Initial Contribution" value={initial} onChange={setInitial} />
            <Contribution label="Monthly Contribution" value={monthly} onChange={setMonthly} />
          </div>

          <h3 className="mt-8 font-display text-lg font-bold">Historical Returns</h3>
          <p className="text-xs text-muted-foreground">Cumulated before fees · target {profile.weekly} weekly</p>
          <div className="mt-2 divide-y divide-border rounded-2xl border border-border bg-card">
            {[
              ["1 month", "+18.4%"],
              ["3 months", "+64.2%"],
              ["Year to date", "+141.7%"],
              ["1-year", "+312.5%"],
              ["3-years", "—"],
              ["Since inception (Dec 31, 2023)", "+486.1%"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{k}</span>
                <span className={v === "—" ? "text-muted-foreground" : "font-semibold text-success"}>{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl bg-muted p-5">
            <h3 className="font-display text-2xl font-black text-primary">Assets</h3>
            <div className="mt-3 space-y-2">
              {[
                ["Fixed Income", profile.mix[0]!],
                ["Equity & Crypto", profile.mix[1]!],
                ["Cash", profile.mix[2]!],
              ].map(([k, v], i) => (
                <div key={k as string}>
                  <div className="flex justify-between text-sm">
                    <span>{k}</span>
                    <span className="font-semibold">{v}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-background">
                    <div
                      className="h-2 rounded-full gold-surface"
                      style={{ width: `${v}%`, opacity: 1 - i * 0.25 }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-right text-xs text-muted-foreground">Based on model portfolio</p>
          </div>

          <button
            onClick={() => {
              update({ invested: (account?.invested ?? 0) + initial });
              toast.success(`${profile.name} portfolio funded with $${initial}`);
            }}
            className="gold-surface mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full font-bold shadow-gold"
          >
            <TrendingUp className="size-5" /> Start auto invest
          </button>
        </section>
      )}

      {tab === "savings" && (
        <section className="mt-6 animate-rise">
          <div className="onyx-surface rounded-3xl p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Savings balance</p>
            <p className="mt-1 font-display text-4xl font-black">
              ${(account?.savings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Profit" value={`+$${(account?.monthlyGain ?? 0).toFixed(2)}`} good />
            <Stat label="Loss" value="-$0.00" />
          </div>
          <Link
            to="/savings"
            className="mt-5 flex h-14 w-full items-center justify-center rounded-full border border-border font-semibold"
          >
            Open savings vault
          </Link>
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <p className="font-display text-lg font-bold">Open a savings plan</p>
            <input
              value={plan}
              onChange={(e) => setPlan(e.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              aria-label="Purposed amount"
              placeholder="Purposed amount (USD)"
              className="mt-3 h-14 w-full rounded-2xl bg-muted px-5 outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              disabled={busy || Number(plan) <= 0}
              onClick={() => void openPlan()}
              className="gold-surface mt-4 flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold disabled:opacity-40"
            >
              Submit plan
            </button>
          </div>
        </section>
      )}

      {tab === "loan" && (
        <section className="mt-6 animate-rise space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-display text-lg font-bold">Draw against your portfolio</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Up to 70% LTV, same-day release, no early-repayment fee. Add a card or make a deposit to unlock
              your limit.
            </p>
            <p className="mt-4 font-display text-3xl font-black">
              ${(((account?.invested ?? 0) + (account?.balance ?? 0)) * 0.7).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Available to borrow</p>
          </div>
          <Link
            to="/add-card"
            className="gold-surface flex h-14 w-full items-center justify-center gap-2 rounded-full font-bold shadow-gold"
          >
            <CreditCard className="size-5" /> Add card
          </Link>
          <Link
            to="/add-money"
            className="flex h-14 w-full items-center justify-center rounded-full border border-border font-semibold"
          >
            Make a deposit
          </Link>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-display text-lg font-bold">Apply for a loan</p>
            <div className="mt-3 space-y-3">
              <input
                value={loan.amount}
                onChange={(e) => setLoan({ ...loan, amount: e.target.value.replace(/[^\d.]/g, "") })}
                inputMode="decimal"
                aria-label="Amount to take"
                placeholder="Amount to take (USD)"
                className="h-14 w-full rounded-2xl bg-muted px-5 outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={loan.id_type}
                onChange={(e) => setLoan({ ...loan, id_type: e.target.value.slice(0, 40) })}
                aria-label="Valid ID type"
                placeholder="Valid ID type (Driver's licence, Passport)"
                className="h-14 w-full rounded-2xl bg-muted px-5 outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={loan.id_number}
                onChange={(e) => setLoan({ ...loan, id_number: e.target.value.slice(0, 40) })}
                aria-label="ID card number"
                placeholder="ID card number"
                className="h-14 w-full rounded-2xl bg-muted px-5 outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={loan.ssn_last4}
                onChange={(e) => setLoan({ ...loan, ssn_last4: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                inputMode="numeric"
                aria-label="Last 4 of SSN"
                placeholder="Last 4 of SSN"
                className="h-14 w-full rounded-2xl bg-muted px-5 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              disabled={
                busy ||
                Number(loan.amount) <= 0 ||
                loan.id_type.trim().length < 2 ||
                loan.id_number.trim().length < 4 ||
                loan.ssn_last4.length !== 4
              }
              onClick={() => void applyLoan()}
              className="gold-surface mt-4 flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold disabled:opacity-40"
            >
              Submit application
            </button>
          </div>

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            Loan approval requires one cleared weekly settlement and a funded main balance.
          </p>

        </section>
      )}
    </AppShell>
  );
}

function Contribution({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="rounded-2xl border border-border bg-card p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">USD</span>
          <input
            value={value}
            onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
            inputMode="numeric"
            aria-label={label}
            className="w-20 bg-transparent text-center font-display text-2xl font-black outline-none"
          />
        </div>
      </div>
      <p className="mt-2 text-center text-sm">{label}</p>
    </div>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={good ? "font-display text-xl font-bold text-success" : "font-display text-xl font-bold"}>
        {value}
      </p>
    </div>
  );
}
