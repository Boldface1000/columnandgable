-- App-unlock PIN: a 6-digit local unlock code, separate from the
-- account's email/password. Only a salted hash is ever stored — the
-- server functions in src/lib/pin.server.ts are the only code path
-- allowed to read or write these columns.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pin_hash text,
  ADD COLUMN IF NOT EXISTS pin_salt text,
  ADD COLUMN IF NOT EXISTS pin_set_at timestamptz,
  ADD COLUMN IF NOT EXISTS pin_fail_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until timestamptz;

-- Client reads/writes of the profiles row (RLS policy "Users update own
-- profile") should never touch the pin directly — only the service-role
-- server functions do. Revoking column-level access belt-and-braces
-- blocks any accidental select("*")/update() from the browser bundle.
REVOKE SELECT (pin_hash, pin_salt), UPDATE (pin_hash, pin_salt, pin_fail_count, pin_locked_until)
  ON public.profiles FROM authenticated;
