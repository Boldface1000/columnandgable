import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Copy, Share2, Bitcoin, Building2, User, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Field } from "./add-card";
import { bankTransferSchema, collectErrors } from "@/lib/validators";
import { useAccount, logActivity } from "@/lib/app-state";
import { useAuthGuard } from "@/lib/auth-guard";
import {
  WHY_COMPANY_ACCOUNT,
  BTC_SETTLEMENT,
  TRANSFER_STEPS,
  BANK_PARTNERS,
  ENDORSED_PARTNERS,
  logoUrl,
} from "@/lib/treasury";

export const Route = createFileRoute("/bank-transfer")({
  head: () => ({
    meta: [
      { title: "Bank Transfer — Column & Gable" },
      {
        name: "description",
        content:
          "Fund your Column & Gable account in three steps using the fixed Bitcoin settlement address, endorsed by leading banks, exchanges and DeFi venues.",
      },
      { property: "og:title", content: "Bank Transfer — Column & Gable" },
      { property: "og:description", content: "Three-step funding to our fixed settlement wallet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BankTransfer,
});

function BankTransfer() {
  const navigate = useNavigate();
  const { authed } = useAuthGuard();
  const { account, update } = useAccount();
  const [form, setForm] = useState({ bankName: "", holder: "", routing: "", account: "", amount: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(`${what} copied`);
  };

  const share = async () => {
    const details = `${BTC_SETTLEMENT.name}\n${BTC_SETTLEMENT.network}\n${BTC_SETTLEMENT.address}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Column & Gable settlement details", text: details });
        return;
      } catch {
        /* dismissed */
      }
    }
    copy(details, "Details");
  };

  const submit = () => {
    const payload = { ...form, amount: Number(form.amount) || 0 };
    const found = collectErrors(bankTransferSchema, payload);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    update({ balance: (account?.balance ?? 0) + payload.amount });
    void logActivity({
      kind: "deposit",
      amount: payload.amount,
      method: "bank-transfer",
      reference: payload.bankName,
    });
    toast.success(`Transfer of $${payload.amount.toFixed(2)} initiated`);
    navigate({ to: "/discover" });
  };

  if (!authed) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-muted/40 pb-14">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur-xl">
        <button aria-label="Back" onClick={() => navigate({ to: "/add-money" })}>
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="font-display text-xl font-bold">Bank Transfer</h1>
      </header>

      <div className="px-4 pt-4">
        {/* Settlement details card */}
        <section className="rounded-3xl bg-card p-5 shadow-float">
          <Detail
            icon={<Bitcoin className="size-5 text-primary" />}
            label="Settlement Wallet Address"
            value={BTC_SETTLEMENT.address}
            mono
          />
          <Detail
            icon={<Building2 className="size-5 text-primary" />}
            label="Network"
            value={BTC_SETTLEMENT.network}
          />
          <Detail icon={<User className="size-5 text-primary" />} label="Name" value={BTC_SETTLEMENT.name} last />

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => copy(BTC_SETTLEMENT.address, "Wallet address")}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-accent font-semibold text-accent-foreground"
            >
              <Copy className="size-4" /> Copy Address
            </button>
            <button
              onClick={() => void share()}
              className="gold-surface flex h-12 items-center justify-center gap-2 rounded-full font-semibold shadow-gold"
            >
              <Share2 className="size-4" /> Share Details
            </button>
          </div>
        </section>

        {/* 3 steps */}
        <section className="mt-4 rounded-3xl bg-card p-5">
          <h2 className="font-display text-lg font-bold">Add money via transfer in just 3 steps</h2>
          <ol className="mt-3 space-y-3">
            {TRANSFER_STEPS.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="font-display font-black text-primary">{i + 1}.</span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-2xl bg-muted p-3 text-xs text-muted-foreground">
            Always include <span className="font-semibold text-foreground">{account?.accountId ?? BTC_SETTLEMENT.memo}</span>{" "}
            as the transfer reference so the custodian can match your deposit.
          </p>
        </section>

        {/* Endorsed partners */}
        <section className="mt-4 rounded-3xl bg-card p-5">
          <h2 className="font-display text-lg font-bold">Endorsed partners</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Banking systems that clear our settlements.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {BANK_PARTNERS.map((b) => (
              <PartnerLogo key={b.name} name={b.name} domain={b.domain} />
            ))}
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Crypto wallets and DeFi exchange systems we settle through.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {ENDORSED_PARTNERS.map((p) => (
              <PartnerLogo key={p.name} name={p.name} domain={p.domain} caption={p.role} />
            ))}
          </div>
        </section>

        {/* Why custody first */}
        <section className="mt-4 rounded-3xl bg-card p-5">
          <p className="font-display font-bold">Why funds settle with custody first</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {WHY_COMPANY_ACCOUNT.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>

        {/* Sending account */}
        <section className="mt-4 rounded-3xl bg-card p-5">
          <h2 className="font-display text-lg font-bold">Your sending account</h2>
          <div className="mt-3 space-y-3">
            <Field label="Bank name" value={form.bankName} onChange={set("bankName")} error={errors["bankName"]} placeholder="Chase" />
            <Field label="Account holder" value={form.holder} onChange={set("holder")} error={errors["holder"]} placeholder="Mason Godwin" />
            <Field
              label="Routing number"
              value={form.routing}
              onChange={(v) => set("routing")(v.replace(/\D/g, "").slice(0, 9))}
              error={errors["routing"]}
              placeholder="9 digits"
              inputMode="numeric"
            />
            <Field
              label="Account number"
              value={form.account}
              onChange={(v) => set("account")(v.replace(/\D/g, "").slice(0, 17))}
              error={errors["account"]}
              placeholder="6–17 digits"
              inputMode="numeric"
            />
            <Field
              label="Amount (USD)"
              value={form.amount}
              onChange={(v) => set("amount")(v.replace(/[^\d.]/g, ""))}
              error={errors["amount"]}
              placeholder="Minimum $100"
              inputMode="decimal"
            />
          </div>

          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            Funds are held with our custodian in a segregated client account.
          </p>

          <button
            onClick={submit}
            className="gold-surface mt-5 flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold"
          >
            Confirm transfer
          </button>
        </section>
      </div>
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
  mono,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div className={last ? "flex gap-3 py-3" : "flex gap-3 border-b border-dashed border-border py-3"}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span
          className={
            mono
              ? "block break-all font-display text-lg font-black leading-tight"
              : "block font-display text-base font-bold leading-tight"
          }
        >
          {value}
        </span>
      </span>
    </div>
  );
}

function PartnerLogo({ name, domain, caption }: { name: string; domain: string; caption?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <span className="grid size-14 place-items-center overflow-hidden rounded-full border border-border bg-background">
        {failed ? (
          <span className="font-display text-sm font-black text-primary">
            {name.slice(0, 2).toUpperCase()}
          </span>
        ) : (
          <img
            src={logoUrl(domain)}
            alt={`${name} logo`}
            loading="lazy"
            onError={() => setFailed(true)}
            className="size-9 object-contain"
          />
        )}
      </span>
      <span className="text-xs font-medium leading-tight">{name}</span>
      {caption && <span className="text-[10px] text-muted-foreground">{caption}</span>}
    </div>
  );
}
