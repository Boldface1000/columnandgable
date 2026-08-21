CREATE TABLE public.user_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand text NOT NULL DEFAULT 'visa',
  holder text NOT NULL,
  last4 text NOT NULL,
  exp_month int NOT NULL,
  exp_year int NOT NULL,
  billing_address text NOT NULL DEFAULT '',
  billing_city text NOT NULL DEFAULT '',
  billing_state text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_cards TO authenticated;
GRANT ALL ON public.user_cards TO service_role;

ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cards" ON public.user_cards
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_cards_touch BEFORE UPDATE ON public.user_cards
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();