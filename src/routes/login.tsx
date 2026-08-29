import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/lib/app-state";
import { PinPad } from "@/components/PinPad";
import { hasPin, verifyPin, setPin as setPinRemote } from "@/lib/pin.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log In — Column & Gable" },
      {
        name: "description",
        content: "Log in to Column & Gable with your Google account or your authenticator app.",
      },
      { property: "og:title", content: "Log In — Column & Gable" },
      { property: "og:description", content: "Access your portfolio, savings and loans." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [codeStep, setCodeStep] = useState(false);
  const [code, setCode] = useState("");

  // App-unlock PIN step, shown after Google/authenticator identity is confirmed.
  const [pinStep, setPinStep] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pendingAdmin, setPendingAdmin] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [newPinStage, setNewPinStage] = useState<"create" | "confirm">("create");
  const [newPinConfirm, setNewPinConfirm] = useState("");

  const goIn = (admin: boolean) => {
    toast.success(admin ? "Welcome back, operator" : "Welcome back");
    navigate({ to: admin ? "/operations" : "/discover" });
  };

  // Central entry point: identity is already proven by Google/authenticator here.
  // If the member has an app PIN set, gate on it before entering; otherwise go straight in.
  const route = async (userId: string) => {
    const admin = await isAdminUser(userId);
    const { data: session } = await supabase.auth.getSession();
    const accessToken = session.session?.access_token;
    if (!accessToken) {
      goIn(admin);
      return;
    }
    const { hasPin: pinSet } = await hasPin({ data: { accessToken } });
    if (!pinSet) {
      goIn(admin);
      return;
    }
    setPendingAdmin(admin);
    setPinStep(true);
  };

  const submitPin = async (value: string) => {
    setPin(value);
    if (value.length !== 6) return;
    const { data: session } = await supabase.auth.getSession();
    const accessToken = session.session?.access_token;
    if (!accessToken) {
      toast.error("Session expired — sign in again");
      setPinStep(false);
      return;
    }
    const result = await verifyPin({ data: { accessToken, pin: value } });
    if (result.ok) {
      goIn(pendingAdmin);
      return;
    }
    setPin("");
    if (result.reason === "locked") {
      setPinError("Too many attempts — try again in 15 minutes, or reset your PIN below.");
    } else {
      setPinError(
        "attemptsLeft" in result
          ? `Wrong PIN — ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? "" : "s"} left.`
          : "Wrong PIN.",
      );
    }
  };

  const submitNewPin = async (value: string) => {
    setNewPinConfirm(value);
    if (value.length !== 6) return;
    if (value !== newPin) {
      toast.error("PINs don't match — try again.");
      setNewPin("");
      setNewPinConfirm("");
      setNewPinStage("create");
      return;
    }
    const { data: session } = await supabase.auth.getSession();
    const accessToken = session.session?.access_token;
    if (!accessToken) {
      toast.error("Session expired — sign in again");
      setPinStep(false);
      setResetMode(false);
      return;
    }
    await setPinRemote({ data: { accessToken, pin: value } });
    toast.success("PIN updated");
    setResetMode(false);
    setPin("");
    setPinError(null);
    goIn(pendingAdmin);
  };

  const google = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) {
      toast.error("Google sign-in failed");
      return;
    }
    // Supabase redirects the browser to Google; execution stops here.
    // On return, Supabase restores the session automatically.
  };

  const authenticator = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      toast.info("Verify your identity with Google first, then confirm with your authenticator code");
      await google();
      return;
    }
    setCodeStep(true);
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error("Enter the 6-digit code from your authenticator app");
      return;
    }
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      toast.error("Session expired — sign in again");
      setCodeStep(false);
      return;
    }
    await route(data.user.id);
  };

  return (
    <div className="min-h-screen bg-background px-6 pb-12 pt-16">
      {pinStep ? (
        <div className="animate-rise">
          <h1 className="font-display text-3xl font-extrabold">
            {resetMode
              ? newPinStage === "create"
                ? "Set a new PIN"
                : "Confirm your new PIN"
              : "Enter your PIN"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {resetMode
              ? "You're already verified — just pick a new 6-digit PIN."
              : "Quick unlock for Column & Gable."}
          </p>
          <div className="mt-10">
            {!resetMode && (
              <PinPad value={pin} onChange={(v) => void submitPin(v)} error={pinError} />
            )}
            {resetMode && newPinStage === "create" && (
              <PinPad value={newPin} onChange={setNewPin} warnIfWeak />
            )}
            {resetMode && newPinStage === "confirm" && (
              <PinPad value={newPinConfirm} onChange={(v) => void submitNewPin(v)} />
            )}
          </div>
          {resetMode && newPinStage === "create" && (
            <button
              disabled={newPin.length !== 6}
              onClick={() => setNewPinStage("confirm")}
              className="gold-surface mt-8 flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold disabled:opacity-40 disabled:shadow-none"
            >
              Continue
            </button>
          )}
          {!resetMode && (
            <button
              onClick={() => {
                setResetMode(true);
                setPinError(null);
                setPin("");
              }}
              className="mt-6 block w-full text-center text-sm text-muted-foreground underline"
            >
              Forgot your PIN?
            </button>
          )}
          <p className="mt-8 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            Still stuck? Reach us at columnandgable@gmail.com and we'll help you back in.
          </p>
        </div>
      ) : (
        <>
          <h1 className="font-display text-3xl font-extrabold">Log in</h1>
          <p className="mt-2 text-muted-foreground">Your position has been compounding without you.</p>

          <div className="mt-8 space-y-4">
            <button
              onClick={() => void google()}
              disabled={busy}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-border bg-card font-semibold disabled:opacity-50"
            >
              <span className="font-display text-lg font-black text-primary">G</span>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <button
              onClick={() => void authenticator()}
              className="gold-surface flex h-14 w-full items-center justify-center gap-3 rounded-full font-bold shadow-gold"
            >
              <KeyRound className="size-5" />
              Continue with Authenticator
            </button>

            {codeStep && (
              <div className="animate-rise rounded-2xl border border-border bg-card p-5">
                <p className="text-sm font-semibold">Enter your 6-digit code</p>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  aria-label="Authenticator code"
                  placeholder="000000"
                  className="mt-3 h-14 w-full rounded-2xl bg-muted px-5 text-center font-display text-2xl font-black tracking-[0.4em] outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={() => void verifyCode()}
                  disabled={code.length !== 6}
                  className="mt-4 flex h-13 w-full items-center justify-center rounded-full border border-border py-3 font-semibold disabled:opacity-40"
                >
                  Verify and continue
                </button>
              </div>
            )}

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              Column &amp; Gable never asks for a password. Access is granted by your Google identity and your
              authenticator device.
            </p>

            <Link to="/signup" className="block text-center text-sm text-muted-foreground">
              New here? Create an account
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
