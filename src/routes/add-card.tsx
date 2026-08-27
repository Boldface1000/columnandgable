import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  X,
  RefreshCw,
  CreditCard,
  Lock,
  Info,
  ShieldCheck,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { cardSchema, collectErrors } from "@/lib/validators";
import { saveCard, useCards, createPayment, useAccount, type Card } from "@/lib/app-state";
import { useAuthGuard } from "@/lib/auth-guard";

export const Route = createFileRoute("/add-card")({
  head: () => ({
    meta: [
      { title: "Checkout — Add a Card | Column & Gable" },
      {
        name: "description",
        content:
          "Securely store a payment card and pay into your Column & Gable account. Powered by Stripe, certified by FDIC, CFPB and IMF standards.",
      },
      { property: "og:title", content: "Checkout — Add a Card | Column & Gable" },
      { property: "og:description", content: "Store a card securely, then pay in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AddCard,
});

const BRANDS = [
  { id: "discover", label: "DISCOVER", className: "bg-[#f68121] text-white" },
  { id: "visa", label: "VISA", className: "bg-[#1a1f71] text-white" },
  { id: "amex", label: "AMEX", className: "bg-[#006fcf] text-white" },
  { id: "mastercard", label: "MC", className: "bg-[#eb001b] text-white" },
  { id: "diners", label: "DINERS", className: "bg-[#0079be] text-white" },
  { id: "jcb", label: "JCB", className: "bg-[#0e4c96] text-white" },
  { id: "unionpay", label: "UNIONPAY", className: "bg-[#e21836] text-white" },
] as const;

const SELECTABLE = ["visa", "mastercard", "amex", "discover"] as const;

function AddCard() {
  const { authed } = useAuthGuard();
  const navigate = useNavigate();
  const { account } = useAccount();
  const { cards, reload } = useCards();
  const [mode, setMode] = useState<"auto" | "new">("auto");

  const hasCard = cards.length > 0;
  const showPay = hasCard && mode === "auto";

  if (!authed) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-muted/40 pb-16">
      {/* Checkout chrome */}
      <header className="flex items-center justify-between bg-background px-5 py-4">
        <div className="flex items-center gap-4">
          <button aria-label="Back" onClick={() => navigate({ to: "/finance" })}>
            <ArrowLeft className="size-6" />
          </button>
          <button aria-label="Close" onClick={() => navigate({ to: "/discover" })}>
            <X className="size-6" />
          </button>
        </div>
        <h1 className="font-display text-lg font-bold">Column &amp; Gable Checkout</h1>
        <button aria-label="Refresh" onClick={() => void reload()}>
          <RefreshCw className="size-5" />
        </button>
      </header>

      <div className="flex items-center justify-between bg-muted px-5 py-4">
        <span className="flex items-center gap-3 font-semibold">
          <span className="grid size-9 place-items-center rounded-full bg-card">
            <CreditCard className="size-4" />
          </span>
          Card
        </span>
        <button
          onClick={() => navigate({ to: "/add-money" })}
          className="font-semibold text-destructive"
        >
          Cancel
        </button>
      </div>

      <div className="bg-background px-5 pb-8 pt-6">
        {showPay ? (
          <PayWithCard
            card={cards[0]!}
            reference={account?.accountId ?? ""}
            onAddNew={() => setMode("new")}
          />
        ) : (
          <NewCardForm
            hasCard={hasCard}
            onCancel={() => setMode("auto")}
            onSaved={async () => {
              await reload();
              setMode("auto");
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ---------------- Pay with a stored card ---------------- */

function PayWithCard({
  card,
  reference,
  onAddNew,
}: {
  card: Card;
  reference: string;
  onAddNew: () => void;
}) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const value = Number(amount) || 0;

  const pay = async () => {
    if (value < 100) {
      toast.error("Minimum deposit is $100");
      return;
    }
    setBusy(true);
    const { error } = await createPayment({ card, amount: value, method: `card:${card.brand}` });
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Payment of $${value.toFixed(2)} submitted for settlement`);
    navigate({ to: "/discover" });
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-foreground font-display text-sm font-black text-background">
            C&amp;G
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {reference || "Column & Gable"}
          </span>
        </span>
        <span className="text-right">
          <span className="block">
            <span className="text-sm font-semibold text-muted-foreground">USD </span>
            <span className="font-display text-2xl font-black">{value.toFixed(2)}</span>
          </span>
          <span className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
            Transaction breakdown <Info className="size-4" />
          </span>
        </span>
      </div>

      <p className="py-6 text-center text-lg">Confirm the amount to pay</p>

      <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Amount
      </label>
      <div className="mt-1 flex items-center gap-3 border-b border-border pb-3">
        <span className="grid size-7 place-items-center rounded bg-primary text-xs font-black text-primary-foreground">
          $
        </span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, "").slice(0, 9))}
          inputMode="decimal"
          aria-label="Amount"
          placeholder="0.00"
          className="w-full bg-transparent font-display text-2xl outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-7 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            <span
              className={
                (BRANDS.find((b) => b.id === card.brand)?.className ??
                  "bg-foreground text-background") +
                " rounded px-2 py-1 text-[10px] font-black tracking-wider"
              }
            >
              {card.brand.toUpperCase()}
            </span>
            <span className="font-display font-bold tracking-widest">•••• {card.last4}</span>
          </span>
          <span className="text-sm text-muted-foreground">
            {String(card.exp_month).padStart(2, "0")}/{String(card.exp_year).slice(-2)}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{card.holder}</p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm">Remember this card next time</span>
        <button
          role="switch"
          aria-checked={remember}
          aria-label="Remember this card next time"
          onClick={() => setRemember(!remember)}
          className={
            remember
              ? "h-8 w-14 rounded-full bg-primary p-1 transition-colors"
              : "h-8 w-14 rounded-full bg-muted p-1 transition-colors"
          }
        >
          <span
            className={
              remember
                ? "block size-6 translate-x-6 rounded-full bg-background transition-transform"
                : "block size-6 rounded-full bg-background transition-transform"
            }
          />
        </button>
      </div>

      <button
        onClick={() => void pay()}
        disabled={busy || value < 100}
        className="gold-surface mt-7 flex h-14 w-full items-center justify-center rounded-xl font-bold shadow-gold disabled:opacity-40 disabled:shadow-none"
      >
        {busy ? "Processing…" : `Pay USD ${value.toFixed(2)}`}
      </button>

      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="size-3.5 text-primary" /> Secured by Stripe · FDIC · CFPB · IMF certified
      </p>

      <button
        onClick={onAddNew}
        className="mt-8 flex w-full items-center justify-center gap-2 border-t border-border pt-5 font-semibold text-primary"
      >
        <RotateCw className="size-4" /> Change payment method
      </button>
    </>
  );
}

/* ---------------- Add a new card ---------------- */

function NewCardForm({
  hasCard,
  onCancel,
  onSaved,
}: {
  hasCard: boolean;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] = useState({
    holder: "",
    number: "",
    expiry: "",
    cvc: "",
    brand: "visa",
    billing_address: "",
    billing_city: "",
    billing_state: "",
    postal_code: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    const found = collectErrors(cardSchema, form);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    const [m, y] = form.expiry.split("/");
    const { error } = await saveCard({
      brand: form.brand,
      holder: form.holder.trim(),
      last4: form.number.replace(/\D/g, "").slice(-4),
      exp_month: Number(m),
      exp_year: 2000 + Number(y),
      billing_address: form.billing_address.trim(),
      billing_city: form.billing_city.trim(),
      billing_state: form.billing_state.trim(),
      postal_code: form.postal_code.trim(),
    });
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Card added");
    await onSaved();
  };

  return (
    <>
      <p className="pb-6 text-center text-lg">Enter your card details to pay</p>

      <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Card number
      </label>
      <div className="mt-1 flex items-center gap-3 border-b border-border pb-3">
        <span className="h-5 w-7 rounded bg-primary" />
        <input
          value={form.number}
          onChange={(e) => set("number")(e.target.value.replace(/[^\d ]/g, "").slice(0, 23))}
          inputMode="numeric"
          aria-label="Card number"
          placeholder="0000 0000 0000 0000"
          className="w-full bg-transparent font-display text-xl outline-none placeholder:text-muted-foreground"
        />
        <Lock className="size-4 shrink-0 text-muted-foreground" />
        <CreditCard className="size-5 shrink-0" />
      </div>
      {errors["number"] && <Err msg={errors["number"]} />}

      <div className="mt-3 flex flex-wrap justify-end gap-1.5">
        {BRANDS.map((b) => (
          <span
            key={b.id}
            className={`${b.className} rounded px-2 py-1 text-[10px] font-black tracking-wider`}
          >
            {b.label}
          </span>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Valid till
          </label>
          <div className="mt-1 flex items-center gap-3 border-b border-border pb-3">
            <span className="h-5 w-7 rounded bg-primary" />
            <input
              value={form.expiry}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                set("expiry")(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
              }}
              inputMode="numeric"
              aria-label="Valid till"
              placeholder="MM/YY"
              className="w-full bg-transparent font-display text-xl outline-none placeholder:text-muted-foreground"
            />
          </div>
          {errors["expiry"] && <Err msg={errors["expiry"]} />}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              CVV
            </label>
            <span className="text-xs text-muted-foreground">What is this?</span>
          </div>
          <div className="mt-1 flex items-center gap-3 border-b border-border pb-3">
            <span className="h-5 w-7 rounded bg-primary" />
            <input
              value={form.cvc}
              onChange={(e) => set("cvc")(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              aria-label="CVV"
              placeholder="123"
              className="w-full bg-transparent font-display text-xl outline-none placeholder:text-muted-foreground"
            />
          </div>
          {errors["cvc"] && <Err msg={errors["cvc"]} />}
        </div>
      </div>

      <h2 className="mt-8 font-display text-lg font-bold">Card type</h2>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {SELECTABLE.map((id) => {
          const active = form.brand === id;
          return (
            <label
              key={id}
              className={
                active
                  ? "flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-primary bg-card p-3.5 text-sm font-semibold capitalize"
                  : "flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-sm capitalize"
              }
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => set("brand")(id)}
                aria-label={id}
                className="size-4 accent-[oklch(0.78_0.13_87)]"
              />
              {id}
            </label>
          );
        })}
      </div>

      <h2 className="mt-8 font-display text-lg font-bold">Billing information</h2>
      <div className="mt-3 space-y-3">
        <Field
          label="Cardholder name"
          value={form.holder}
          onChange={set("holder")}
          error={errors["holder"]}
          placeholder="MASON GODWIN"
        />
        <Field
          label="Billing address"
          value={form.billing_address}
          onChange={set("billing_address")}
          error={errors["billing_address"]}
          placeholder="One Federal Street"
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="City"
            value={form.billing_city}
            onChange={set("billing_city")}
            error={errors["billing_city"]}
            placeholder="Boston"
          />
          <Field
            label="State"
            value={form.billing_state}
            onChange={set("billing_state")}
            error={errors["billing_state"]}
            placeholder="MA"
          />
        </div>
        <Field
          label="Postal code"
          value={form.postal_code}
          onChange={(v) => set("postal_code")(v.replace(/[^\d-]/g, "").slice(0, 10))}
          error={errors["postal_code"]}
          placeholder="02110"
          inputMode="numeric"
        />
      </div>

      <button
        onClick={() => void submit()}
        disabled={saving}
        className="gold-surface mt-8 flex h-14 w-full items-center justify-center rounded-xl font-bold shadow-gold disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save card"}
      </button>

      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-primary" /> Powered by Stripe · Certified by FDIC ·
        CFPB · IMF
      </p>

      {hasCard && (
        <button
          onClick={onCancel}
          className="mt-8 flex w-full items-center justify-center gap-2 border-t border-border pt-5 font-semibold text-primary"
        >
          <RotateCw className="size-4" /> Change payment method
        </button>
      )}
    </>
  );
}

function Err({ msg }: { msg: string }) {
  return <p className="mt-1.5 text-xs text-destructive">{msg}</p>;
}

export function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
  placeholder?: string;
  inputMode?: "numeric" | "decimal" | "text";
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
        inputMode={inputMode ?? "text"}
        aria-label={label}
        aria-invalid={Boolean(error)}
        className={
          error
            ? "mt-1 h-14 w-full rounded-2xl border border-destructive bg-muted px-5 outline-none"
            : "mt-1 h-14 w-full rounded-2xl bg-muted px-5 outline-none focus:ring-2 focus:ring-ring"
        }
      />
      {error && <Err msg={error} />}
    </div>
  );
}
