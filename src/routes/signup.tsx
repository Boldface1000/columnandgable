import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { AVATARS } from "@/lib/app-state";
import { supabase } from "@/integrations/supabase/client";
import { PinPad } from "@/components/PinPad";
import { setPin as setPinRemote } from "@/lib/pin.functions";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Your Column & Gable Account" },
      {
        name: "description",
        content:
          "Sign up with Google or email, secure your account with an authenticator code, then pick the sectors you care about.",
      },
      { property: "og:title", content: "Create Your Column & Gable Account" },
      { property: "og:description", content: "Sign up, verify with 2FA and build your investor profile." },
    ],
  }),
  component: SignUp,
});

const SECTORS = [
  "🧱 Basic Materials", "📡 Communication Services", "🛍️ Consumer Cyclical",
  "🧺 Consumer Defensive", "⚡ Energy", "🏛️ Financial Services", "🩺 Healthcare",
  "🏭 Industrials", "🏠 Real Estate", "🧠 Technology", "💧 Utilities", "🪙 Digital Assets",
];

const pwSchema = z
  .string()
  .min(8, "8 characters or more")
  .regex(/[A-Z]/, "Needs an uppercase character")
  .regex(/[a-z]/, "Needs a lowercase character")
  .regex(/[0-9]/, "Needs a number")
  .regex(/[-#$.%&@!+=<>*]/, "Needs one of - # $ . % & @ ! + = < > *");

function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState<
    "credentials" | "verify" | "2fa" | "sectors" | "profile" | "pin"
  >("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [terms, setTerms] = useState(true);
  const [marketing, setMarketing] = useState(true);
  const [code, setCode] = useState("");
  const [sectors, setSectors] = useState<string[]>([]);
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]!);
  const [createPin, setCreatePin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinStage, setPinStage] = useState<"create" | "confirm">("create");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinBusy, setPinBusy] = useState(false);

  const emailOk = z.string().email().safeParse(email).success;
  const pwResult = pwSchema.safeParse(password);
  const canSubmit = emailOk && pwResult.success && password === confirm && terms;

  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNickname(email.split("@")[0] ?? "Investor");
    setStep("verify");
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error("Google sign-up failed");
      return;
    }
    // Supabase redirects the browser to Google; execution stops here.
  };

  const finish = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Confirm your email, then log in to finish your profile");
      navigate({ to: "/login" });
      return;
    }
    await supabase
      .from("profiles")
      .update({
        nickname: nickname.trim() || "Investor",
        avatar,
        sectors,
        onboarded: true,
      })
      .eq("id", auth.user.id);
    toast.success("Welcome to Column & Gable");
    navigate({ to: "/discover" });
  };

  const submitPinDigit = (next: string) => {
    setPinError(null);
    if (pinStage === "create") setCreatePin(next);
    else setConfirmPin(next);
  };

  const confirmPinAndFinish = async (confirmValue: string) => {
    if (createPin !== confirmValue) {
      setPinError("PINs don't match — try again.");
      setConfirmPin("");
      setPinStage("create");
      setCreatePin("");
      return;
    }
    setPinBusy(true);
    const { data: session } = await supabase.auth.getSession();
    const accessToken = session.session?.access_token;
    if (!accessToken) {
      setPinBusy(false);
      toast.error("Confirm your email, then log in to finish your profile");
      navigate({ to: "/login" });
      return;
    }
    try {
      await setPinRemote({ data: { accessToken, pin: createPin } });
    } catch (e) {
      setPinBusy(false);
      toast.error(e instanceof Error ? e.message : "Couldn't save your PIN");
      return;
    }
    setPinBusy(false);
    await finish();
  };

  // Once the confirm-pin box fills to 6 digits, resolve it automatically.
  const onConfirmPinChange = (next: string) => {
    setConfirmPin(next);
    if (next.length === 6) void confirmPinAndFinish(next);
  };


  return (
    <div className="min-h-screen bg-background px-6 pb-12 pt-12">
      <h1 className="font-display text-3xl font-extrabold">
        {step === "credentials" && "Sign up"}
        {step === "verify" && "Confirm your email"}
        {step === "2fa" && "Google Authenticator"}
        {step === "sectors" && "Sectors"}
        {step === "profile" && "Profile"}
        {step === "pin" && "App PIN"}
      </h1>

      {step === "credentials" && (
        <div className="animate-rise mt-7 space-y-4">
          <button
            onClick={() => void google()}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-border bg-card font-semibold"
          >
            <span className="font-display text-lg font-black text-primary">G</span>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            inputMode="email"
            maxLength={255}
            className="h-14 w-full rounded-2xl bg-muted px-5 outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="relative">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={show ? "text" : "password"}
              placeholder="Password"
              maxLength={72}
              className="h-14 w-full rounded-2xl bg-muted px-5 pr-14 outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label="Toggle password visibility"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            type={show ? "text" : "password"}
            placeholder="Confirm password"
            maxLength={72}
            className="h-14 w-full rounded-2xl bg-muted px-5 outline-none focus:ring-2 focus:ring-ring"
          />

          <div className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">Your password must meet the following criteria:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>8 characters or more</li>
              <li>Contain an uppercase character, lowercase character and a number</li>
              <li>Contain one of these symbols: - # $ . % &amp; @ ! + = &lt; &gt; *</li>
            </ul>
            {password && !pwResult.success && (
              <p className="mt-2 text-destructive">{pwResult.error.issues[0]?.message}</p>
            )}
            {confirm && confirm !== password && (
              <p className="mt-1 text-destructive">Passwords do not match</p>
            )}
          </div>

          <button
            disabled={!canSubmit || busy}
            onClick={() => void start()}
            className="gold-surface flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold transition disabled:opacity-40 disabled:shadow-none"
          >
            Sign Up
          </button>

          <Consent checked={terms} onChange={setTerms}>
            I accept and agree to the Terms of Use — Column &amp; Gable App and the Notice to Customers
            Relating to Personal Data.
          </Consent>
          <Consent checked={marketing} onChange={setMarketing}>
            I agree to the use of my personal data for direct marketing purposes.
          </Consent>
        </div>
      )}

      {step === "verify" && (
        <div className="animate-rise mt-7 space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">We sent a confirmation link to</p>
            <p className="mt-1 font-display text-lg font-bold break-all">{email}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Open it to confirm ownership. You can continue securing your account meanwhile.
            </p>
          </div>
          <button
            onClick={() => setStep("2fa")}
            className="gold-surface flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold"
          >
            I've confirmed my email
          </button>
        </div>
      )}

      {step === "2fa" && (
        <div className="animate-rise mt-7 space-y-5">
          <p className="text-muted-foreground">
            Scan this key in Google Authenticator, then enter the 6-digit code.
          </p>
          <SecretKey />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="000000"
            className="h-16 w-full rounded-2xl bg-muted text-center font-display text-3xl tracking-[0.4em] outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            disabled={code.length !== 6}
            onClick={() => setStep("sectors")}
            className="gold-surface flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold disabled:opacity-40 disabled:shadow-none"
          >
            Verify
          </button>
        </div>
      )}

      {step === "sectors" && (
        <div className="animate-rise mt-6">
          <p className="font-display text-lg font-bold">Pick up to 5 sectors that you are interested in:</p>
          <p className="text-muted-foreground">This will make your Discover page bespoke to you</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {SECTORS.map((s) => {
              const on = sectors.includes(s);
              return (
                <button
                  key={s}
                  onClick={() =>
                    setSectors(
                      on
                        ? sectors.filter((x) => x !== s)
                        : sectors.length >= 5
                          ? sectors
                          : [...sectors, s],
                    )
                  }
                  className={
                    on
                      ? "gold-surface rounded-full px-4 py-2.5 text-sm font-semibold shadow-gold"
                      : "rounded-full border border-border bg-card px-4 py-2.5 text-sm"
                  }
                >
                  {s}
                </button>
              );
            })}
          </div>
          <button
            disabled={sectors.length === 0}
            onClick={() => setStep("profile")}
            className="gold-surface mt-10 flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold disabled:opacity-40 disabled:shadow-none"
          >
            Continue
          </button>
        </div>
      )}

      {step === "profile" && (
        <div className="animate-rise mt-6">
          <p className="font-display text-lg font-bold">Enter your nickname</p>
          <p className="text-muted-foreground">This is your Social Profile display name.</p>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 30))}
            className="mt-4 h-14 w-full rounded-2xl bg-muted px-5 outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">{30 - nickname.length}</p>

          <p className="mt-4 font-display text-lg font-bold">Select an avatar</p>
          <div className="mt-4 grid grid-cols-4 gap-4">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={
                  a === avatar
                    ? "grid aspect-square place-items-center rounded-full text-3xl gold-surface shadow-gold"
                    : "grid aspect-square place-items-center rounded-full border border-border bg-card text-3xl"
                }
              >
                {a}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep("pin")}
            className="gold-surface mt-10 flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold"
          >
            Continue
          </button>
        </div>
      )}

      {step === "pin" && (
        <div className="animate-rise mt-6">
          <p className="font-display text-lg font-bold">
            {pinStage === "create" ? "Create a 6-digit PIN" : "Confirm your PIN"}
          </p>
          <p className="text-muted-foreground">
            {pinStage === "create"
              ? "You'll use this to quickly unlock the app — separate from your password."
              : "Enter it once more to confirm."}
          </p>
          <div className="mt-8">
            <PinPad
              value={pinStage === "create" ? createPin : confirmPin}
              onChange={pinStage === "create" ? submitPinDigit : onConfirmPinChange}
              warnIfWeak={pinStage === "create"}
              error={pinError}
            />
          </div>
          {pinStage === "create" && (
            <button
              disabled={createPin.length !== 6}
              onClick={() => setPinStage("confirm")}
              className="gold-surface mt-10 flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold disabled:opacity-40 disabled:shadow-none"
            >
              Continue
            </button>
          )}
          {pinBusy && (
            <p className="mt-4 text-center text-sm text-muted-foreground">Saving your PIN…</p>
          )}
        </div>
      )}
    </div>
  );
}

function Consent({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <p className="flex-1 text-sm text-muted-foreground">{children}</p>
      <button
        onClick={() => onChange(!checked)}
        aria-label="Toggle consent"
        className={
          checked
            ? "grid size-7 shrink-0 place-items-center rounded-md gold-surface"
            : "size-7 shrink-0 rounded-md border border-border"
        }
      >
        {checked && <Check className="size-4" strokeWidth={3} />}
      </button>
    </div>
  );
}

function SecretKey() {
  const key = "CGHK-4T7Q-9ZLM-2XPD";
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
      <span className="font-display font-bold tracking-wider">{key}</span>
      <button
        aria-label="Copy setup key"
        onClick={() => {
          navigator.clipboard?.writeText(key);
          toast.success("Setup key copied");
        }}
        className="text-primary"
      >
        <Copy className="size-5" />
      </button>
    </div>
  );
}
