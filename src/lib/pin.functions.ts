import { createServerFn } from "@tanstack/react-start";

const PIN_RE = /^\d{6}$/;

async function requireUser(accessToken: string) {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["SUPABASE_URL"]!;
  const anonKey = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const asCaller = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data, error } = await asCaller.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Not signed in");
  return data.user.id;
}

/** Whether the signed-in member already has an app-unlock PIN set. */
export const hasPin = createServerFn({ method: "GET" })
  .validator((d: { accessToken: string }) => d)
  .handler(async ({ data }) => {
    const userId = await requireUser(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("profiles")
      .select("pin_hash")
      .eq("id", userId)
      .maybeSingle();
    return { hasPin: Boolean(row?.pin_hash) };
  });

/** Creates or replaces the member's 6-digit app-unlock PIN. */
export const setPin = createServerFn({ method: "POST" })
  .validator((d: { accessToken: string; pin: string }) => d)
  .handler(async ({ data }) => {
    if (!PIN_RE.test(data.pin)) throw new Error("PIN must be exactly 6 digits");
    const userId = await requireUser(data.accessToken);
    const { createPinHash } = await import("@/lib/pin.server");
    const { hash, salt } = await createPinHash(data.pin);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("profiles")
      .update({
        pin_hash: hash,
        pin_salt: salt,
        pin_set_at: new Date().toISOString(),
        pin_fail_count: 0,
        pin_locked_until: null,
      })
      .eq("id", userId);
    return { ok: true };
  });

/** Verifies an entered PIN, with lockout after repeated failed attempts. */
export const verifyPin = createServerFn({ method: "POST" })
  .validator((d: { accessToken: string; pin: string }) => d)
  .handler(async ({ data }) => {
    const userId = await requireUser(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { pinMatches, isLocked, MAX_FAILS, LOCK_MINUTES } = await import("@/lib/pin.server");

    const { data: row } = await supabaseAdmin
      .from("profiles")
      .select("pin_hash, pin_salt, pin_fail_count, pin_locked_until")
      .eq("id", userId)
      .maybeSingle();

    if (!row?.pin_hash || !row.pin_salt) return { ok: false, reason: "no-pin" as const };

    if (isLocked(row.pin_locked_until)) {
      return { ok: false, reason: "locked" as const, lockedUntil: row.pin_locked_until };
    }

    const match = await pinMatches(data.pin, row.pin_hash, row.pin_salt);
    if (match) {
      await supabaseAdmin
        .from("profiles")
        .update({ pin_fail_count: 0, pin_locked_until: null })
        .eq("id", userId);
      return { ok: true };
    }

    const fails = (row.pin_fail_count ?? 0) + 1;
    const lockedUntil =
      fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null;
    await supabaseAdmin
      .from("profiles")
      .update({ pin_fail_count: fails, pin_locked_until: lockedUntil })
      .eq("id", userId);

    return {
      ok: false,
      reason: lockedUntil ? ("locked" as const) : ("wrong" as const),
      attemptsLeft: Math.max(0, MAX_FAILS - fails),
      lockedUntil,
    };
  });
