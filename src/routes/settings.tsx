import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Moon, Sun, Mail, Info, LogOut, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { AvatarEditor } from "@/components/AvatarEditor";
import { useAccount } from "@/lib/app-state";
import { supabase } from "@/integrations/supabase/client";
import { useAuthGuard } from "@/lib/auth-guard";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Column & Gable" },
      {
        name: "description",
        content: "Manage your profile, account ID, appearance, support contacts and session on Column & Gable.",
      },
      { property: "og:title", content: "Settings — Column & Gable" },
      { property: "og:description", content: "Profile, appearance, support and logout." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { authed } = useAuthGuard();
  const navigate = useNavigate();
  const { account, update } = useAccount();
  const [dark, setDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("cg.theme", next ? "dark" : "light");
  };


  if (!authed) return <div className="min-h-screen bg-background" />;
  return (
    <AppShell variant="settings" title="Settings">
      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <AvatarEditor avatar={account?.avatar} onUploaded={(url) => update({ avatar: url })} />
          <div className="min-w-0">
            <p className="font-display text-xl font-bold">{account?.nickname ?? "Guest"}</p>
            <p className="truncate text-sm text-muted-foreground">{account?.email ?? "not signed in"}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Account ID</p>
            <p className="font-display font-bold tracking-wider">{account?.accountId ?? "————————————"}</p>
          </div>
          <button
            aria-label="Copy account ID"
            onClick={() => {
              navigator.clipboard?.writeText(account?.accountId ?? "");
              toast.success("Account ID copied");
            }}
            className="text-primary"
          >
            <Copy className="size-5" />
          </button>
        </div>
      </section>

      <section className="mt-5 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex items-center justify-between p-4">
          <span className="flex items-center gap-3 font-medium">
            {dark ? <Moon className="size-5 text-primary" /> : <Sun className="size-5 text-primary" />}
            {dark ? "Dark mode" : "Light mode"}
          </span>
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className={
              dark
                ? "h-7 w-12 rounded-full gold-surface p-1 text-left"
                : "h-7 w-12 rounded-full bg-muted p-1 text-left"
            }
          >
            <span
              className={
                dark
                  ? "block size-5 translate-x-5 rounded-full bg-background transition-transform"
                  : "block size-5 rounded-full bg-card transition-transform"
              }
            />
          </button>
        </div>

        <Row icon={<Mail className="size-5 text-primary" />} label="Contact us" to="/contact" />
        <Row icon={<Info className="size-5 text-primary" />} label="About" to="/about" />
      </section>

      <section className="mt-5 rounded-3xl border border-border bg-card p-5">
        <h2 className="font-display font-bold">Support desk</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" /> 1200 Wilshire Blvd, Los Angeles, CA 90017
          </li>
          <li className="flex items-center gap-2">
            <Phone className="size-4 text-primary" /> +1 (415) 555-0182
          </li>
          <li className="flex items-center gap-2">
            <Mail className="size-4 text-primary" /> support@columnandgable.com
          </li>
        </ul>
      </section>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          toast.success("Logged out");
          navigate({ to: "/login", replace: true });
        }}
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full border border-destructive/40 font-semibold text-destructive"
      >
        <LogOut className="size-5" /> Log out
      </button>
    </AppShell>
  );
}

function Row({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate({ to })} className="flex w-full items-center gap-3 p-4 text-left font-medium">
      {icon}
      {label}
    </button>
  );
}
