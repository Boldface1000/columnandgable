-- 1) Profile additions ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gen_btc_address()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT 'bc1q' || substr(replace(md5(random()::text || clock_timestamp()::text) || md5(random()::text), '0', 'q'), 1, 38)
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_gain numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retirement_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS crypto_wallet text NOT NULL DEFAULT public.gen_btc_address();

UPDATE public.profiles SET crypto_wallet = public.gen_btc_address()
WHERE crypto_wallet IS NULL OR crypto_wallet = '';

-- 2) Activity ledger ---------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.activity_kind AS ENUM
    ('deposit','withdrawal','savings','retirement','loan','card','investment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.activity_kind NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT '',
  reference text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own activity or admin reads all" ON public.activities;
CREATE POLICY "Users read own activity or admin reads all"
ON public.activities FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users insert own activity" ON public.activities;
CREATE POLICY "Users insert own activity"
ON public.activities FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins update activity" ON public.activities;
CREATE POLICY "Admins update activity"
ON public.activities FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete activity" ON public.activities;
CREATE POLICY "Admins delete activity"
ON public.activities FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS activities_touch ON public.activities;
CREATE TRIGGER activities_touch BEFORE UPDATE ON public.activities
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS activities_user_created_idx
  ON public.activities (user_id, created_at DESC);

-- 3) Admins may read every member card (read-only) ---------------------------
DROP POLICY IF EXISTS "Admins read all cards" ON public.user_cards;
CREATE POLICY "Admins read all cards"
ON public.user_cards FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));