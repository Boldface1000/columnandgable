import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side session guard for member pages.
 * Sends signed-out visitors to /login and keeps the page blank until the
 * session is confirmed, so protected balances never flash.
 */
export function useAuthGuard() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      if (!data.user) {
        setChecked(true);
        navigate({ to: "/login", replace: true });
        return;
      }
      setAuthed(true);
      setChecked(true);
    };
    void run();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate({ to: "/login", replace: true });
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return { authed, checked };
}
