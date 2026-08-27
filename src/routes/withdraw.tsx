import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Landmark, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAccount, logActivity } from "@/lib/app-state";
import { useAuthGuard } from "@/lib/auth-guard";
import { collectErrors, withdrawSchema, withdrawCryptoSchema } from "@/lib/validators";

export const Route = createFileRoute("/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — Column & Gable" },
      {
        name: "description",
        content: "Withdraw funds to your bank or a digital-asset wallet — BTC, ETH, USDT and more.",
      },
      { property: "og:title", content: "Withdraw — Column & Gable" },
      { property: "og:description", content: "Send your balance to a bank account or crypto wallet." },
    ],
  }),
  component: Withdraw,
});

type Method = "bank" | "crypto";
type CryptoAsset = "usdt" | "btc" | "eth" | "other";

const CRYPTO_OPTIONS: { id: CryptoAsset; label: string }[] = [
  { id: "usdt", label: "USDT" },
  { id: "btc", label: "BTC" },
  { id: "eth", label: "ETH" },
  { id: "other", label: "Others" },
];

function Withdraw() {
  const { authed } = useAuthGuard();
  const navigate = useNavigate();
  const { account, update } = useAccount();
  const available = account?.balance ?? 0;

  const [method, setMethod] = useState<Method>("bank");

  // Bank fields
  const [routing, setRouting] = useState("");
  const [recipient, setRecipient] = useState("");

  // Crypto fields
  const [asset, setAsset] = useState<CryptoAsset>("usdt");
  const [assetName, setAssetName] = useState("");
  const [address, setAddress] = useState("");
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherDraft, setOtherDraft] = useState("");

  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const value = Number(amount) || 0;

  const pickAsset = (id: CryptoAsset) => {
    if (id === "other") {
      setOtherDraft(assetName);
      setOtherOpen(true);
      return;
    }
    setAsset(id);
  };

  const confirmOther = () => {
    if (otherDraft.trim().length < 2) {
      toast.error("Enter the asset name");
      return;
    }
    setAsset("other");
    setAssetName(otherDraft.trim());
    setOtherOpen(false);
  };

  const bankReady = routing.length === 9 && recipient.length >= 6;
  const cryptoReady = address.trim().length >= 26 && (asset !== "other" || assetName.trim().length >= 2);
  const ready = value > 0 && value <= available && (method === "bank" ? bankReady : cryptoReady);

  const submit = async () => {
    if (!account) return;

    if (method === "bank") {
      const found = collectErrors(withdrawSchema(available), { routing, recipient, amount: value });
      setErrors(found);
      if (Object.keys(found).length) {
        toast.error("Please fix the highlighted fields");
        return;
      }
    } else {
      const found = collectErrors(withdrawCryptoSchema(available), {
        asset,
        assetName: asset === "other" ? assetName : undefined,
        address,
        amount: value,
      });
      setErrors(found);
      if (Object.keys(found).length) {
        toast.error("Please fix the highlighted fields");
        return;
      }
    }

    setBusy(true);
    const remaining = available - value;
    await update({ balance: remaining });
    await logActivity({
      kind: "withdrawal",
      amount: value,
      method: method === "bank" ? "bank" : `crypto:${asset === "other" ? assetName.toLowerCase() : asset}`,
      reference: method === "bank" ? recipient : address,
    });
    setBusy(false);
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

      <div className="space-y-5 px-6 pt-6">
        <p className="text-sm text-muted-foreground">Available: ${available.toFixed(2)}</p>

        <div className="flex gap-2 rounded-full border border-border bg-card p-1.5">
          <button
            onClick={() => setMethod("bank")}
            className={
              method === "bank"
                ? "gold-surface flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold shadow-gold"
                : "flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium text-muted-foreground"
            }
          >
            <Landmark className="size-4" /> Bank transfer
          </button>
          <button
            onClick={() => setMethod("crypto")}
            className={
              method === "crypto"
                ? "gold-surface flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold shadow-gold"
                : "flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium text-muted-foreground"
            }
          >
            <Wallet className="size-4" /> Digital asset
          </button>
        </div>

        {method === "bank" ? (
          <>
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
          </>
        ) : (
          <>
            <div>
              <p className="mb-2 text-sm font-medium">Receive via</p>
              <div className="grid grid-cols-4 gap-2">
                {CRYPTO_OPTIONS.map((o) => {
                  const active = asset === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => pickAsset(o.id)}
                      aria-pressed={active}
                      className={
                        active
                          ? "rounded-2xl border-2 border-primary bg-card py-3 text-center text-sm font-bold"
                          : "rounded-2xl border border-border bg-card py-3 text-center text-sm font-medium text-muted-foreground"
                      }
                    >
                      {o.id === "other" && asset === "other" && assetName ? assetName : o.label}
                    </button>
                  );
                })}
              </div>
              {errors["assetName"] && <p className="mt-1 text-xs text-destructive">{errors["assetName"]}</p>}
            </div>

            <div>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value.trim())}
                placeholder={`Destination ${asset === "other" ? assetName || "asset" : asset.toUpperCase()} wallet address`}
                aria-label="Destination wallet address"
                className="h-14 w-full rounded-2xl bg-muted px-5 outline-none focus:ring-2 focus:ring-ring"
              />
              {errors["address"] && <p className="mt-1 text-xs text-destructive">{errors["address"]}</p>}
            </div>
          </>
        )}

        <div>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="Amount (USD)"
            aria-label="Withdrawal amount"
            inputMode="decimal"
            className="h-14 w-full rounded-2xl bg-muted px-5 outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-1 flex items-center justify-between">
            {errors["amount"] && <p className="text-xs text-destructive">{errors["amount"]}</p>}
            <button
              type="button"
              onClick={() => setAmount(String(available))}
              className="ml-auto text-xs font-semibold text-primary"
            >
              Use max
            </button>
          </div>
        </div>

        <button
          disabled={!ready || busy}
          onClick={() => void submit()}
          className={
            ready && !busy
              ? "gold-surface flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold"
              : "flex h-14 w-full items-center justify-center rounded-full bg-muted font-bold text-muted-foreground opacity-50 blur-[1px]"
          }
        >
          Next
        </button>
      </div>

      <Dialog open={otherOpen} onOpenChange={setOtherOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name the asset</DialogTitle>
          </DialogHeader>
          <input
            value={otherDraft}
            onChange={(e) => setOtherDraft(e.target.value)}
            placeholder="e.g. Solana (SOL)"
            aria-label="Asset name"
            autoFocus
            className="h-14 w-full rounded-2xl bg-muted px-5 outline-none focus:ring-2 focus:ring-ring"
          />
          <DialogFooter>
            <button
              onClick={confirmOther}
              className="gold-surface flex h-12 w-full items-center justify-center rounded-full font-bold shadow-gold"
            >
              Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
