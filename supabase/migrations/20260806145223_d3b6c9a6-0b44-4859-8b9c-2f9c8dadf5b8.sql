
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  nickname text NOT NULL DEFAULT 'Investor',
  avatar text NOT NULL DEFAULT '🦅',
  account_id text NOT NULL DEFAULT lpad((floor(random()*1000000000000))::bigint::text, 12, '0'),
  balance numeric NOT NULL DEFAULT 0,
  savings numeric NOT NULL DEFAULT 0,
  loan_balance numeric NOT NULL DEFAULT 0,
  invested numeric NOT NULL DEFAULT 0,
  sectors text[] NOT NULL DEFAULT '{}',
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete profiles" ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Read own roles or admin reads all" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname)
  VALUES (NEW.id, COALESCE(NEW.email, ''), COALESCE(split_part(NEW.email, '@', 1), 'Investor'))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.promote_to_admin(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_count int;
BEGIN
  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  IF admin_count > 0 AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only an admin can promote another member';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.promote_to_admin(uuid) TO authenticated;

CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position int NOT NULL UNIQUE,
  title text NOT NULL,
  tag text NOT NULL DEFAULT 'Markets',
  read_time text NOT NULL DEFAULT '4 min',
  excerpt text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  image_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read articles" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "Admins manage articles" ON public.blog_posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER blog_posts_touch BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.blog_posts (position, title, tag, read_time, excerpt, body) VALUES
(1, 'Why weekly compounding beats annual yield', 'Strategy', '4 min', 'A 20% weekly cycle reinvested is the fastest legal ladder out of paycheck dependence.', 'Compounding weekly rather than annually changes the shape of the curve entirely. A member reinvesting a 20% weekly settlement is not chasing a bigger number, they are shortening the time between cycles. This is the single mechanic behind every early-retirement story on the leaderboard.'),
(2, 'Gold, treasuries and the new safe haven mix', 'Markets', '6 min', 'Institutional desks rebalanced into hard assets this quarter. Here is what retail should copy.', 'Sovereign buyers added to bullion for the eleventh straight quarter while duration risk repriced. The retail version of this trade is simple: a hard-asset sleeve, a short-duration sleeve, and a cash buffer you never touch.'),
(3, 'The 401(k) most employees never open', 'Retirement', '3 min', 'Legacy is built in the accounts you forget about. Set it once, let the decades work.', 'Most employees pick a default fund on day one and never look again. Rolling an old plan into a lower-fee vehicle can add years of retirement income without adding a single dollar of contribution.'),
(4, 'Reading a risk profile without the jargon', 'Education', '5 min', 'Conservative, balanced, aggressive — what each actually does to your money in a bad month.', 'Risk profiles describe drawdown tolerance, not ambition. A conservative mix will lag in a rally and protect you in a drawdown. Choose the profile you can hold through a bad month, because the mix you abandon early is the mix that loses money.'),
(5, 'Borrowing against your position, responsibly', 'Loans', '4 min', 'A member loan at 70% LTV is leverage. Treat it like a tool, not a windfall.', 'Borrowing against holdings keeps your position compounding while freeing cash. The discipline is coverage: keep the loan under 70% of collateral and service it from settlement income, never from principal.'),
(6, 'What status actually costs the wealthy', 'Culture', '3 min', 'Rich people do not buy things. They buy the removal of obligations.', 'The most expensive purchase in any portfolio is optionality — the ability to say no. Members who reach that line describe the same feeling: the calendar becomes theirs again.');
