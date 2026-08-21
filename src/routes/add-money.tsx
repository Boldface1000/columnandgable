import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Landmark, CreditCard, Bitcoin, ChevronRight, Copy, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useAccount, logActivity } from "@/lib/app-state";
import { useAuthGuard } from "@/lib/auth-guard";
import { COMPANY_ACCOUNT } from "@/lib/treasury";
import { amountSchema, collectErrors } from "@/lib/validators";

export const Route = createFileRoute("/add-money")({
  head: () => ({
    meta: [
      { title: "Add Money — Column & Gable" },
      { name: "description", content: "Fund your Column & Gable account by bank transfer, card or digital assets." },
      { property: "og:title", content: "Add Money — Column & Gable" },
      { property: "og:description", content: "Bank transfer, card or crypto funding options." },
    ],
  }),
  component: AddMoney,
});

const METHODS = [
  { id: "bank", label: "Bank transfer", note: "Free · arrives in 1 business day", Icon: Landmark, to: "/bank-transfer" },
  { id: "card", label: "Add card", note: "1.2% fee · instant", Icon: CreditCard, to: "/add-card" },
  { id: "crypto", label: "Digital assets", note: "Network fee only · ~10 min", Icon: Bitcoin, to: "/digital-assets" },
] as const;

function AddMoney() {
  const navigate = useNavigate();
  const { authed } = useAuthGuard();
  const { account, update } = useAccount();
  const [method, setMethod] = useState<string>("bank");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | undefined>();

  const value = Number(amount) || 0;

  const copy = (text: string, what: string) => {
    void navigator.clipboard?.writeText(text);
    toast.success(`${what} copied`);
  };

  const confirm = () => {
    const found = collectErrors(amountSchema(100), value);
    setError(found["form"]);
    if (found["form"]) return;
    const chosen = METHODS.find((m) => m.id === method);
    if (chosen?.to) {
      navigate({ to: chosen.to });
      return;
    }
    update({ balance: (account?.balance ?? 0) + value });
    void logActivity({ kind: "deposit", amount: value, method });
    toast.success(`$${value.toFixed(2)} added`);
    navigate({ to: "/discover" });
  };

  if (!authed) return <div className="min-h-screen bg-background" />;


  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="Add money" />
      <div className="px-6 pt-6">
        <p className="text-sm text-muted-foreground">
          Minimum first deposit is US$100 for managed accounts.
        </p>

        <div className="mt-5 rounded-3xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Amount</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-display text-3xl font-black text-muted-foreground">USD</span>
            <input
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value.replace(/[^\d.]/g, ""));
                setError(undefined);
              }}
              inputMode="decimal"
              placeholder="0"
              aria-label="Deposit amount"
              className="w-full bg-transparent font-display text-3xl font-black outline-none"
            />
          </div>
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>

        <div className="mt-5 space-y-3">
          {METHODS.map(({ id, label, note, Icon }) => (
            <button
              key={id}
              onClick={() => setMethod(id)}
              className={
                method === id
                  ? "flex w-full items-center gap-4 rounded-2xl border-2 border-primary bg-card p-4 text-left"
                  : "flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left"
              }
            >
              <Icon className="size-6 text-primary" />
              <div className="flex-1">
                <p className="font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{note}</p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </button>
          ))}
        </div>



        <h2 className="mt-7 font-display text-lg font-bold">Company custody account</h2>
        <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
          {[
            ["Beneficiary", COMPANY_ACCOUNT.beneficiary],
            ["Bank", COMPANY_ACCOUNT.bank],
            ["Routing (ABA)", COMPANY_ACCOUNT.routing],
            ["Account", COMPANY_ACCOUNT.account],
            ["SWIFT", COMPANY_ACCOUNT.swift],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="text-muted-foreground">{k}</span>
              <span className="flex items-center gap-2 text-right font-semibold">
                {v}
                <button aria-label={`Copy ${k}`} onClick={() => copy(v!, k!)} className="text-primary">
                  <Copy className="size-4" />
                </button>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Always quote your account number below as the wire reference — it is how the custodian matches
          your deposit to your balance.
        </p>

        <h2 className="mt-7 font-display text-lg font-bold">Your accounts</h2>
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
            <Landmark className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Account number</p>
              <p className="font-display font-bold tracking-wider">{account?.accountId ?? "————————————"}</p>
            </div>
            <button
              aria-label="Copy account number"
              onClick={() => copy(account?.accountId ?? "", "Account number")}
              className="text-primary"
            >
              <Copy className="size-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-accent/40 px-4 py-3">
            <Wallet className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                Crypto wallet created for you with the bank
              </p>
              <p className="break-all text-xs font-semibold">{account?.cryptoWallet ?? "Provisioning…"}</p>
            </div>
            <button
              aria-label="Copy wallet address"
              onClick={() => copy(account?.cryptoWallet ?? "", "Wallet address")}
              className="text-primary"
            >
              <Copy className="size-4" />
            </button>
          </div>
        </div>


        <div className="mt-6 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Please prepare the following:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Identity card / passport</li>
            <li>Proof of residential address</li>
            <li>Proof of bank account</li>
            <li>US$100 minimum initial deposit</li>
          </ul>
        </div>

        <button
          onClick={confirm}
          className="gold-surface mt-7 flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export function Header({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur-xl">
      <button aria-label="Back" onClick={() => navigate({ to: "/discover" })}>
        <ArrowLeft className="size-6" />
      </button>
      <h1 className="font-display text-xl font-bold">{title}</h1>
    </header>
  );
}
