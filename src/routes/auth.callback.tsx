import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/lib/app-state";

// Google (and any future OAuth provider) redirects here after the user
// grants consent. supabase-js's browser client auto-detects the ?code=
// param and exchanges it for a session (detectSessionInUrl is on by
// default), so we just need to wait for that session and then route.
export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Signing you in — Column & Gable" }],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    const finish = async (userId: string) => {
      const admin = await isAdminUser(userId);
      toast.success(admin ? "Welcome back, operator" : "Welcome back");
      navigate({ to: admin ? "/operations" : "/discover", replace: true });
    };

    // If the URL carries an OAuth error (e.g. user cancelled consent,
    // or provider misconfiguration), surface it instead of hanging.
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error_description") || params.get("error");
    if (oauthError) {
      toast.error(oauthError);
      navigate({ to: "/login", replace: true });
      return;
    }

    // The session may already be present (exchange finished before this
    // component mounted) or may arrive via the SIGNED_IN event a moment
    // later — handle both.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      if (event === "SIGNED_IN" && session?.user) {
        void finish(session.user.id);
      }
    });

    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      if (data.user) void finish(data.user.id);
    });

    // Safety net: if no session shows up, the code exchange failed.
    const timeout = setTimeout(() => {
      if (!alive) return;
      supabase.auth.getUser().then(({ data }) => {
        if (!alive) return;
        if (!data.user) {
          toast.error("Google sign-in failed — please try again");
          navigate({ to: "/login", replace: true });
        }
      });
    }, 6000);

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}
