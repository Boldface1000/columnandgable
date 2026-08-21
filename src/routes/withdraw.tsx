import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAccount, logActivity } from "@/lib/app-state";
import { useAuthGuard } from "@/lib/auth-guard";
import { collectErrors, withdrawSchema } from "@/lib/validators";


export const Route = createFileRoute("/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — Column & Gable" },
      { name: "description", content: "Withdraw funds to your bank using a recipient routing and account number." },
      { property: "og:title", content: "Withdraw — Column & Gable" },
      { property: "og:description", content: "Send your balance to a verified bank account." },
    ],
  }),
  component: Withdraw,
});

function Withdraw() {
  const { authed } = useAuthGuard();
  const navigate = useNavigate();
  const { account, update } = useAccount();
  const [routing, setRouting] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const value = Number(amount) || 0;
  const ready =
    routing.length === 9 && recipient.length >= 6 && value > 0 && value <= (account?.balance ?? 0);

  const submit = () => {
    const found = collectErrors(withdrawSchema(account?.balance ?? 0), { routing, recipient, amount: value });
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    update({ balance: (account?.balance ?? 0) - value });
    void logActivity({ kind: "withdrawal", amount: value, method: "bank", reference: recipient });
    toast.success(`$${value.toFixed(2)} on its way`);
    navigate({ to: "/discover" });
  };

  if (!authed) return <div className="min-h-screen bg-background" />;
  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur-xl">
        <button aria-label="Back" onClick={() => navigate({ to: "/discover" })}>
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="font-display text-xl font-bold">Withdraw</h1>
      </header>

      <div className="space-y-4 px-6 pt-6">
        <p className="text-sm text-muted-foreground">
          Available: ${(account?.balance ?? 0).toFixed(2)}
        </p>
        <div>
          <input
            value={routing}
            onChange={(e) => setRouting(e.target.value.replace(/\D/g, "").slice(0, 9))}
            placeholder="Routing number (9 digits)"
            aria-label="Routing number"
            inputMode="numeric"
            className="h-14 w-full rounded-2xl bg-muted px-5 outline-none focus:ring-2 focus:ring-ring"
          />
          {errors["routing"] && <p className="mt-1 text-xs text-destructive">{errors["routing"]}</p>}
        </div>
        <div>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value.replace(/\D/g, "").slice(0, 17))}
            placeholder="Recipient account number"
            aria-label="Recipient account number"
            inputMode="numeric"
            className="h-14 w-full rounded-2xl bg-muted px-5 outline-none focus:ring-2 focus:ring-ring"
          />
          {errors["recipient"] && <p className="mt-1 text-xs text-destructive">{errors["recipient"]}</p>}
        </div>
        <div>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="Amount (USD)"
            aria-label="Withdrawal amount"
            inputMode="decimal"
            className="h-14 w-full rounded-2xl bg-muted px-5 outline-none focus:ring-2 focus:ring-ring"
          />
          {errors["amount"] && <p className="mt-1 text-xs text-destructive">{errors["amount"]}</p>}
        </div>

        <button
          disabled={!ready}
          onClick={submit}
          className={
            ready
              ? "gold-surface flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold"
              : "flex h-14 w-full items-center justify-center rounded-full bg-muted font-bold text-muted-foreground opacity-50 blur-[1px]"
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}

