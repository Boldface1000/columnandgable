import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Bitcoin, Copy, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Field } from "./add-card";
import { useAccount, logActivity } from "@/lib/app-state";
import { useAuthGuard } from "@/lib/auth-guard";
import { CRYPTO_TREASURY, EXCHANGE_PARTNERS, WHY_COMPANY_ACCOUNT } from "@/lib/treasury";
import { collectErrors, cryptoDepositSchema } from "@/lib/validators";

export const Route = createFileRoute("/digital-assets")({
  head: () => ({
    meta: [
      { title: "Digital Assets — Column & Gable" },
      {
        name: "description",
        content:
          "Fund your Column & Gable account with Bitcoin, Ethereum or USDT through custody accounts sponsored by Binance, Coinbase and OKX.",
      },
      { property: "og:title", content: "Digital Assets — Column & Gable" },
      { property: "og:description", content: "Crypto funding with exchange-sponsored custody." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DigitalAssets,
});

const ASSETS = [
  { id: "btc", label: "Bitcoin (BTC)", network: "Bitcoin network", address: CRYPTO_TREASURY.btc },
  { id: "eth", label: "Ethereum (ETH)", network: "ERC-20", address: CRYPTO_TREASURY.eth },
  { id: "usdt", label: "Tether (USDT)", network: "TRC-20", address: CRYPTO_TREASURY.usdt },
] as const;

function DigitalAssets() {
  const navigate = useNavigate();
  const { authed } = useAuthGuard();
  const { account } = useAccount();
  const [asset, setAsset] = useState<"btc" | "eth" | "usdt">("btc");
  const [from, setFrom] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const chosen = ASSETS.find((a) => a.id === asset)!;

  const copy = (value: string, what: string) => {
    void navigator.clipboard?.writeText(value);
    toast.success(`${what} copied`);
  };

  const submit = async () => {
    const payload = { asset, from: from.trim(), amount: Number(amount) || 0 };
    const found = collectErrors(cryptoDepositSchema, payload);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    await logActivity({
      kind: "deposit",
      amount: payload.amount,
      method: `crypto:${asset}`,
      reference: payload.from,
    });
    toast.success("Deposit submitted — credited after network confirmations");
    navigate({ to: "/discover" });
  };

  if (!authed) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background pb-14">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur-xl">
        <button aria-label="Back" onClick={() => navigate({ to: "/add-money" })}>
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="font-display text-xl font-bold">Digital assets</h1>
      </header>

      <div className="px-6 pt-6">
        <div className="onyx-surface rounded-3xl p-5">
          <Bitcoin className="size-7 text-primary" />
          <p className="mt-3 font-display text-xl font-bold">Network fee only · ~10 minutes</p>
          <p className="mt-1 text-sm text-white/70">
            Digital-asset settlement is run in partnership with the three largest exchanges on earth.
          </p>
          <div className="mt-4 space-y-1.5">
            {EXCHANGE_PARTNERS.map((p) => (
              <p key={p.name} className="text-xs text-white/60">
                <span className="font-semibold text-primary">{p.name}</span> — {p.role}
              </p>
            ))}
          </div>
        </div>

        <h2 className="mt-7 font-display text-lg font-bold">Beneficiary account</h2>
        <div className="mt-3 space-y-3">
          {ASSETS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAsset(a.id)}
              className={
                a.id === asset
                  ? "w-full rounded-2xl border-2 border-primary bg-card p-4 text-left"
                  : "w-full rounded-2xl border border-border bg-card p-4 text-left"
              }
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{a.label}</p>
                <span className="text-xs text-muted-foreground">{a.network}</span>
              </div>
              <p className="mt-1 break-all text-xs text-muted-foreground">{a.address}</p>
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
          <span className="flex-1 break-all text-xs">{chosen.address}</span>
          <button
            aria-label="Copy beneficiary address"
            onClick={() => copy(chosen.address, "Beneficiary address")}
            className="text-primary"
          >
            <Copy className="size-4" />
          </button>
        </div>

        <h2 className="mt-7 font-display text-lg font-bold">Your Column &amp; Gable wallet</h2>
        <div className="mt-3 rounded-2xl border border-primary/40 bg-accent/40 p-4">
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-primary" />
            <p className="text-sm font-semibold">Bitcoin wallet held for you with the bank</p>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <span className="flex-1 break-all text-xs text-muted-foreground">
              {account?.cryptoWallet ?? "Wallet is being provisioned…"}
            </span>
            <button
              aria-label="Copy my wallet address"
              onClick={() => copy(account?.cryptoWallet ?? "", "Wallet address")}
              className="text-primary"
            >
              <Copy className="size-4" />
            </button>
          </div>
        </div>

        <h2 className="mt-7 font-display text-lg font-bold">Confirm your transfer</h2>
        <div className="mt-3 space-y-3">
          <Field
            label="Sending wallet address"
            value={from}
            onChange={setFrom}
            error={errors["from"]}
            placeholder="Your exchange or self-custody address"
          />
          <Field
            label="Amount (USD equivalent)"
            value={amount}
            onChange={(v) => setAmount(v.replace(/[^\d.]/g, ""))}
            error={errors["amount"]}
            placeholder="Minimum $100"
            inputMode="decimal"
          />
        </div>

        <div className="mt-5 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Why the beneficiary account first?</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {WHY_COMPANY_ACCOUNT.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>

        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          Assets are held in exchange-sponsored qualified custody, segregated from firm capital.
        </p>

        <button
          onClick={() => void submit()}
          className="gold-surface mt-6 flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold"
        >
          I have sent the transfer
        </button>
      </div>
    </div>
  );
}
