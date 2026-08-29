import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Plus,
  ArrowUpRight,
  PiggyBank,
  Landmark,
  Flame,
  ChevronRight,
  CreditCard,
  Copy,
  Gift,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { AppShell } from "@/components/AppShell";
import {
  useAccount,
  useCards,
  useLiveGrowth,
  buildLeaderboard,
  useLiveQuotes,
  fetchBlogPosts,
  signedBlogUrl,
  referralLink,
  REFERRAL_REWARD,
  type BlogPost,
  type Quote,
} from "@/lib/app-state";
import { useAuthGuard } from "@/lib/auth-guard";


export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover — Column & Gable" },
      {
        name: "description",
        content: "Your balance, market updates, trending stocks, live feeds and the member leaderboard in one place.",
      },
      { property: "og:title", content: "Discover — Column & Gable" },
      { property: "og:description", content: "Balance, market updates, trending stocks and leaderboards." },
    ],
  }),
  component: Discover,
});

const FEEDS = [
  { who: "Ava Vale", text: "Third weekly settlement cleared. Quit the second job today.", when: "12m" },
  { who: "Marcus Okoye", text: "Rolled my old 401(k) in. Fees dropped by 80%.", when: "1h" },
  { who: "Sana Bello", text: "Balanced portfolio holding 21.4% this week. Steady.", when: "3h" },
];

/* --------------------------- Display currency --------------------------- */
/** All balances are stored/computed in USD. These are display-only
 * conversion rates for rendering the portfolio in another currency.
 * TODO: wire this up to a live FX/BTC price feed — these are static
 * placeholders and will drift from real market rates over time. */
const CURRENCY_OPTIONS = [
  { key: "usd", label: "USD", symbol: "$", rate: 1, decimals: 2 },
  { key: "gbp", label: "GBP", symbol: "£", rate: 0.79, decimals: 2 },
  { key: "btc", label: "BTC", symbol: "₿", rate: 1 / 64000, decimals: 6 },
] as const;

type CurrencyKey = (typeof CURRENCY_OPTIONS)[number]["key"];

const CURRENCY_STORAGE_KEY = "cg.displayCurrency";

function loadStoredCurrency(): CurrencyKey {
  if (typeof window === "undefined") return "usd";
  const raw = localStorage.getItem(CURRENCY_STORAGE_KEY);
  return CURRENCY_OPTIONS.some((c) => c.key === raw) ? (raw as CurrencyKey) : "usd";
}

function formatInCurrency(amountUsd: number, currency: CurrencyKey) {
  const opt = CURRENCY_OPTIONS.find((c) => c.key === currency) ?? CURRENCY_OPTIONS[0];
  const converted = (amountUsd || 0) * opt.rate;
  return `${opt.symbol}${converted.toLocaleString(undefined, {
    minimumFractionDigits: opt.decimals,
    maximumFractionDigits: opt.decimals,
  })}`;
}

/** Rolling in-memory price history per ticker, built up client-side from
 * each poll of useLiveQuotes (Finnhub's free tier doesn't expose intraday
 * candles, so this is the only source of a "live" line for the chart). */
function useQuoteHistory(quotes: Quote[], maxPoints = 30) {
  const [history, setHistory] = useState<Record<string, { t: number; price: number }[]>>({});

  useEffect(() => {
    if (!quotes.length) return;
    setHistory((prev) => {
      const next = { ...prev };
      const t = Date.now();
      for (const q of quotes) {
        const arr = next[q.ticker] ? [...next[q.ticker]!] : [];
        const last = arr[arr.length - 1];
        if (!last || last.price !== q.price) arr.push({ t, price: q.price });
        next[q.ticker] = arr.slice(-maxPoints);
      }
      return next;
    });
  }, [quotes, maxPoints]);

  return history;
}

/** Selectable-ticker live chart, shown below the balance card. */
function LiveStockChart({ quotes }: { quotes: Quote[] }) {
  const history = useQuoteHistory(quotes);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!selected && quotes.length) setSelected(quotes[0]!.ticker);
  }, [quotes, selected]);

  const active = quotes.find((q) => q.ticker === selected);
  const series = selected ? (history[selected] ?? []) : [];
  const up = (active?.change ?? 0) >= 0;

  if (!quotes.length) {
    return (
      <section className="mt-4 onyx-surface rounded-3xl p-5 shadow-float">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Live chart</p>
        <p className="mt-3 text-sm text-white/60">Loading live prices…</p>
      </section>
    );
  }

  return (
    <section className="mt-4 onyx-surface rounded-3xl p-5 shadow-float">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Live chart</p>
        <span className="flex items-center gap-1.5 text-xs text-white/60">
          <span className="size-2 animate-pulse rounded-full bg-success" /> Live
        </span>
      </div>

      <div className="mt-3 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {quotes.map((q) => (
          <button
            key={q.ticker}
            onClick={() => setSelected(q.ticker)}
            className={
              q.ticker === selected
                ? "gold-surface shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold"
                : "shrink-0 rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white/70"
            }
          >
            {q.ticker}
          </button>
        ))}
      </div>

      {active && (
        <>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="font-display text-2xl font-black">
              ${active.price.toLocaleString()}
            </p>
            <p className={up ? "text-sm font-bold text-success" : "text-sm font-bold text-destructive"}>
              {up ? "+" : ""}
              {active.change}%
            </p>
            <span className="text-xs text-white/50">{active.name}</span>
          </div>

          <div className="mt-3 h-28">
            {series.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={up ? "var(--success)" : "var(--destructive)"}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="grid h-full place-items-center text-xs text-white/50">
                Gathering live ticks — the line fills in as new prices come through.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
function CurrencyToggle({
  value,
  onChange,
}: {
  value: CurrencyKey;
  onChange: (c: CurrencyKey) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Display currency"
      className="mt-3 inline-flex rounded-full bg-white/10 p-1"
    >
      {CURRENCY_OPTIONS.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.key)}
            className={
              active
                ? "gold-surface rounded-full px-3.5 py-1.5 text-xs font-bold"
                : "rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/70"
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Discover() {
  const { authed } = useAuthGuard();
  const { account } = useAccount();
  const { gained, balance } = useLiveGrowth(account);
  const { cards } = useCards();
  const [currency, setCurrency] = useState<CurrencyKey>(() => loadStoredCurrency());

  const handleCurrencyChange = (c: CurrencyKey) => {
    setCurrency(c);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, c);
    } catch {
      /* ignore storage failures */
    }
  };

  const leaders = buildLeaderboard(5);
  const { quotes } = useLiveQuotes();
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    void fetchBlogPosts()
      .then(setPosts)
      .catch((e) => console.error("Discover fetchBlogPosts failed:", e));
  }, []);

  const link = referralLink(account?.accountId);

  if (!authed) return <div className="min-h-screen bg-background" />;

  return (

    <AppShell variant="discover" title="Discover">
      <section className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Your cards
          </h2>
          <Link to="/add-card" className="text-sm font-semibold text-primary">
            Add card
          </Link>
        </div>
        {cards.length === 0 ? (
          <Link
            to="/add-card"
            className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-4"
          >
            <CreditCard className="size-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              No card on file — add one to fund instantly.
            </span>
          </Link>
        ) : (
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {cards.map((c) => (
              <div key={c.id} className="onyx-surface min-w-56 rounded-2xl p-4">
                <CreditCard className="size-5 text-primary" />
                <p className="mt-4 font-display text-lg font-bold tracking-widest">•••• {c.last4}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-white/70">
                  <span className="truncate">{c.holder}</span>
                  <span>
                    {String(c.exp_month).padStart(2, "0")}/{String(c.exp_year).slice(-2)}
                  </span>
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/50">{c.brand}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="onyx-surface rounded-3xl p-5 shadow-float">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Available balance</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="font-display text-4xl font-black">{formatInCurrency(balance, currency)}</p>
          <p className="font-display text-sm font-bold text-success">
            +{formatInCurrency(gained, currency)}
            <span className="ml-1 font-medium text-white/60">gained</span>
          </p>
        </div>
        <CurrencyToggle value={currency} onChange={handleCurrencyChange} />

        <div className="mt-5 space-y-2.5">
          <Link
            to="/add-money"
            className="gold-surface flex h-12 w-full items-center justify-center gap-2 rounded-full font-bold"
          >
            <Plus className="size-5" /> Add money
          </Link>
          <Link
            to="/withdraw"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/25 font-semibold text-white"
          >
            <ArrowUpRight className="size-5" /> Withdraw
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2.5">
          <Quick to="/retirement" icon={<Landmark className="size-5" />} label="401(k)" />
          <Quick to="/savings" icon={<PiggyBank className="size-5" />} label="Savings" />
          <Quick to="/stocks" icon={<Flame className="size-5" />} label="Stocks" />
          <Quick to="/history" icon={<History className="size-5" />} label="History" />
        </div>
      </section>

      <LiveStockChart quotes={quotes} />

      <section className="mt-4 rounded-3xl border border-primary/40 bg-accent/40 p-5">
        <div className="flex items-center gap-2">
          <Gift className="size-5 text-primary" />
          <p className="font-display font-bold">Refer and earn ${REFERRAL_REWARD}</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Every friend who funds their first ${100} deposit puts ${REFERRAL_REWARD} in your balance.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
          <span className="flex-1 truncate text-xs text-muted-foreground">{link}</span>
          <button
            aria-label="Copy referral link"
            onClick={() => {
              void navigator.clipboard.writeText(link);
              toast.success("Referral link copied");
            }}
            className="text-primary"
          >
            <Copy className="size-4" />
          </button>
        </div>
      </section>

      <Section
        title="Market updates"
        action={
          <Link to="/feeds" className="flex items-center text-sm text-primary">
            See more <ChevronRight className="size-4" />
          </Link>
        }
      >
        <div className="space-y-3">
          {posts.slice(0, 3).map((p) => (
            <ArticleCard key={p.id} post={p} />
          ))}
          {posts.length === 0 && (
            <p className="text-sm text-muted-foreground">No articles published yet.</p>
          )}
        </div>
      </Section>

      <Section title="Trending stocks" action={<Link to="/stocks" className="text-sm text-primary">See all</Link>}>
        <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
          {quotes.slice(0, 6).map((s) => (
            <div key={s.ticker} className="min-w-36 rounded-2xl border border-border bg-card p-4">
              <p className="font-display text-lg font-bold">{s.ticker}</p>
              <p className="text-xs text-muted-foreground">{s.name}</p>
              <p className="mt-3 font-semibold">${s.price.toLocaleString()}</p>
              <p className={s.change >= 0 ? "text-sm text-success" : "text-sm text-destructive"}>
                {s.change >= 0 ? "+" : ""}
                {s.change}%
              </p>
            </div>
          ))}
        </div>
      </Section>


      <Section title="Trending feeds">
        <div className="space-y-3">
          {FEEDS.map((f) => (
            <div key={f.who} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{f.who}</p>
                <span className="text-xs text-muted-foreground">{f.when}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Social leaderboard"
        action={
          <Link to="/social" className="flex items-center text-sm text-primary">
            Top 50 <ChevronRight className="size-4" />
          </Link>
        }
      >
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {leaders.map((l) => (
            <div key={l.rank} className="flex items-center gap-3 p-3.5">
              <span className="w-5 text-sm text-muted-foreground">{l.rank}</span>
              <span className="grid size-9 place-items-center rounded-full bg-muted text-lg">{l.avatar}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold">{l.name}</p>
                <p className="text-xs text-muted-foreground">{l.ticker}</p>
              </div>
              <span className="font-display font-bold text-success">+{l.gain}%</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Refreshes every 12 hours.</p>
      </Section>
    </AppShell>
  );
}

function Quick({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 py-3 text-xs font-semibold text-white"
    >
      <span className="text-primary">{icon}</span>
      {label}
    </Link>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ArticleCard({ post }: { post: BlogPost }) {
  const [img, setImg] = useState<string | null>(null);

  useEffect(() => {
    void signedBlogUrl(post.image_url).then(setImg);
  }, [post.image_url]);

  return (
    <Link
      to="/feeds/$id"
      params={{ id: post.id }}
      className="block overflow-hidden rounded-2xl border border-border bg-card"
    >
      {img && (
        <img
          src={img}
          alt={post.title}
          loading="lazy"
          width={1024}
          height={640}
          className="h-40 w-full object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">
            {post.tag}
          </span>
          <span className="text-muted-foreground">{post.read_time} read</span>
        </div>
        <h3 className="mt-2 font-display text-base font-bold">{post.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{post.excerpt}</p>
      </div>
    </Link>
  );
}
