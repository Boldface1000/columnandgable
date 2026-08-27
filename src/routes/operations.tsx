import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  HandCoins,
  PiggyBank,
  Newspaper,
  UserCog,
  X,
  LogOut,
  Copy,
  CreditCard,
  Pencil,
  MessageCircle,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  History as HistoryIcon,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AvatarEditor } from "@/components/AvatarEditor";
import {
  useAccount,
  useIsAdmin,
  isImageAvatar,
  fetchBlogPosts,
  signedBlogUrl,
  fetchLoanApplications,
  fetchSavingsPlans,
  fetchThreads,
  fetchAllActivities,
  directionOf,
  DIRECTION_LABEL,
  useThread,
  useUnreadCount,
  sendMessage,
  type Activity,
  type ActivityDirection,
  type BlogPost,
  type Card,
  type LoanApplication,
  type Payment,
  type SavingsPlan,
  type ThreadSummary,
} from "@/lib/app-state";

export const Route = createFileRoute("/operations")({
  head: () => ({
    meta: [
      { title: "Operations Console — Column & Gable" },
      {
        name: "description",
        content:
          "Operator console for Column & Gable: member balances, loan applications, savings plans, the market blog and the support desk.",
      },
      { property: "og:title", content: "Operations Console — Column & Gable" },
      {
        property: "og:description",
        content: "Members, loans, savings, blog and support in one console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Operations,
});

type Member = {
  id: string;
  email: string;
  nickname: string;
  avatar: string;
  account_id: string;
  balance: number;
  savings: number;
  loan_balance: number;
  retirement_balance: number;
  monthly_gain: number;
  interest_rate: number;
};

const MEMBER_FIELDS =
  "id, email, nickname, avatar, account_id, balance, savings, loan_balance, retirement_balance, monthly_gain, interest_rate";

type TabKey = "users" | "loan" | "savings" | "history" | "blog" | "profile";

const TABS: { key: TabKey; label: string; Icon: typeof Users }[] = [
  { key: "users", label: "Users", Icon: Users },
  { key: "loan", label: "Loan", Icon: HandCoins },
  { key: "savings", label: "Savings", Icon: PiggyBank },
  { key: "history", label: "History", Icon: HistoryIcon },
  { key: "blog", label: "Blog", Icon: Newspaper },
  { key: "profile", label: "Profile", Icon: UserCog },
];

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

async function loadMembers() {
  const { data } = await supabase
    .from("profiles")
    .select(MEMBER_FIELDS)
    .order("created_at", { ascending: false });
  return (data ?? []) as Member[];
}

function Operations() {
  const navigate = useNavigate();
  const { isAdmin, checked: ready } = useIsAdmin();
  const [tab, setTab] = useState<TabKey>("users");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const unread = useUnreadCount("admin");

  const openChat = useCallback((userId?: string) => {
    setChatUserId(userId ?? null);
    setChatOpen(true);
  }, []);

  useEffect(() => {
    if (ready && !isAdmin) navigate({ to: "/discover", replace: true });
  }, [ready, isAdmin, navigate]);

  if (!ready || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-1 w-40 rounded-full shimmer" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 pb-32 pt-12">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Operator</p>
          <h1 className="font-display text-3xl font-extrabold">Operations console</h1>
        </div>
        <button
          onClick={() => openChat()}
          aria-label="Support messages"
          className="relative grid size-11 place-items-center rounded-full border border-border bg-card"
        >
          <MessageCircle className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-destructive ring-2 ring-background" />
          )}
        </button>
      </header>

      {tab === "users" && <UsersTab />}
      {tab === "loan" && <LoanTab />}
      {tab === "savings" && <SavingsTab />}
      {tab === "history" && <HistoryTab onOpenChat={openChat} />}
      {tab === "blog" && <BlogTab />}
      {tab === "profile" && <OperatorProfile />}

      <AdminChat
        open={chatOpen}
        initialUserId={chatUserId}
        onClose={() => {
          setChatOpen(false);
          setChatUserId(null);
        }}
      />

      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-5">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-card/90 p-1.5 shadow-float backdrop-blur-xl">
          {TABS.map(({ key, label, Icon }) => {
            const active = key === tab;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-label={label}
                className={
                  active
                    ? "gold-surface flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-gold"
                    : "flex items-center rounded-full px-3 py-2.5 text-muted-foreground"
                }
              >
                <Icon className="size-5 shrink-0" strokeWidth={active ? 2.4 : 2} />
                {active && <span className="whitespace-nowrap">{label}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* ------------------------------- History ------------------------------- */

type HistoryFilter = "all" | ActivityDirection;

function HistoryTab({ onOpenChat }: { onOpenChat: (userId?: string) => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [m, a] = await Promise.all([loadMembers(), fetchAllActivities()]);
      setMembers(m);
      setActivities(a);
      setLoading(false);
    })();
  }, []);

  const memberById = useMemo(() => {
    const map = new Map<string, Member>();
    for (const m of members) map.set(m.id, m);
    return map;
  }, [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activities.filter((a) => {
      if (filter !== "all" && directionOf(a.kind) !== filter) return false;
      if (!q) return true;
      const m = memberById.get(a.user_id);
      return (
        m?.email.toLowerCase().includes(q) ||
        m?.account_id.toLowerCase().includes(q) ||
        m?.nickname.toLowerCase().includes(q) ||
        a.kind.toLowerCase().includes(q) ||
        a.reference.toLowerCase().includes(q)
      );
    });
  }, [activities, filter, query, memberById]);

  return (
    <>
      <section className="onyx-surface rounded-3xl p-5 shadow-float">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Transaction history</p>
        <p className="mt-1 font-display text-3xl font-black">{activities.length}</p>
        <p className="mt-1 text-sm text-white/60">total transactions across every member</p>
      </section>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by member, email, kind or reference"
          aria-label="Search transaction history"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-3 flex gap-2 rounded-full border border-border bg-card p-1.5">
        {(
          [
            { key: "all", label: "All" },
            { key: "received", label: "Received" },
            { key: "sent", label: "Sent" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={
              filter === key
                ? "gold-surface flex-1 rounded-full py-2.5 text-sm font-bold shadow-gold"
                : "flex-1 rounded-full py-2.5 text-sm font-medium text-muted-foreground"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No transactions match.</p>
        )}
        {!loading &&
          filtered.map((a) => {
            const direction = directionOf(a.kind);
            const received = direction === "received";
            const m = memberById.get(a.user_id);
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <span
                  className={
                    received
                      ? "grid size-11 shrink-0 place-items-center rounded-full bg-success/15 text-success"
                      : "grid size-11 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive"
                  }
                >
                  {received ? (
                    <ArrowDownLeft className="size-5" />
                  ) : (
                    <ArrowUpRight className="size-5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold capitalize">{a.kind}</span>
                    <span
                      className={
                        received
                          ? "rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-success"
                          : "rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-destructive"
                      }
                    >
                      {DIRECTION_LABEL[direction]}
                    </span>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {m ? `${m.account_id} · ${m.email}` : a.user_id}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {a.method ? `${a.method} · ` : ""}
                    {new Date(a.created_at).toLocaleString()} · {a.status}
                  </span>
                </span>
                <span
                  className={
                    received
                      ? "font-display font-bold text-success"
                      : "font-display font-bold text-destructive"
                  }
                >
                  {received ? "+" : "-"}
                  {money(Number(a.amount))}
                </span>
              </div>
            );
          })}
      </div>

      <MessagesSection members={members} onOpenChat={onOpenChat} />
    </>
  );
}

/* ------------------------------ Messages ------------------------------ */

/** Per-member message inbox, shown right below transaction history so the operator
 * can see and reply to every member's thread from one place. */
function MessagesSection({
  members,
  onOpenChat,
}: {
  members: Member[];
  onOpenChat: (userId?: string) => void;
}) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setThreads(await fetchThreads());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Messages</h2>
        <button onClick={() => onOpenChat()} className="text-xs font-semibold text-primary">
          Open inbox
        </button>
      </div>

      <div className="space-y-2.5">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && threads.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            No member messages yet.
          </div>
        )}
        {!loading &&
          threads.map((t) => {
            const m = byId.get(t.userId);
            return (
              <button
                key={t.userId}
                onClick={() => onOpenChat(t.userId)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left"
              >
                <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-lg">
                  {isImageAvatar(m?.avatar) ? (
                    <img src={m.avatar} alt="" className="size-11 rounded-full object-cover" />
                  ) : (
                    (m?.avatar ?? "🦅")
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">{m?.account_id ?? "Member"}</span>
                    {t.unread > 0 && (
                      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                        {t.unread} new
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {m?.email ?? t.userId}
                  </span>
                  <span className="mt-0.5 block truncate text-sm">
                    {t.last.sender_role === "admin" ? "You: " : ""}
                    {t.last.body}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(t.last.created_at).toLocaleDateString()}
                </span>
              </button>
            );
          })}
      </div>
    </section>
  );
}

/* ------------------------------- Users ------------------------------- */

function UsersTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [flow, setFlow] = useState<"deposit" | "withdrawal">("deposit");
  const [active, setActive] = useState<Member | null>(null);
  const [balance, setBalance] = useState("");
  const [rate, setRate] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [m, a, p, c] = await Promise.all([
      loadMembers(),
      supabase
        .from("activities")
        .select("id, user_id, kind, amount, method, reference, status, created_at")
        .in("kind", ["deposit", "withdrawal", "card"])
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("payments")
        .select("id, user_id, card_id, amount, method, brand, last4, holder, status, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("user_cards")
        .select(
          "id, user_id, brand, holder, last4, exp_month, exp_year, billing_address, billing_city, billing_state, postal_code",
        )
        .order("created_at", { ascending: false }),
    ]);
    setMembers(m);
    setActivities((a.data ?? []) as Activity[]);
    setPayments((p.data ?? []) as Payment[]);
    setCards((c.data ?? []) as unknown as Card[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cardsByUser = useMemo(() => {
    const map = new Map<string, Card>();
    for (const c of cards as (Card & { user_id?: string })[])
      if (c.user_id && !map.has(c.user_id)) map.set(c.user_id, c);
    return map;
  }, [cards]);

  const latestFor = (userId: string) => {
    const kinds = flow === "deposit" ? ["deposit", "card"] : ["withdrawal"];
    return activities.find((a) => a.user_id === userId && kinds.includes(a.kind)) ?? null;
  };

  const open = (m: Member) => {
    setActive(m);
    setBalance(String(m.balance ?? 0));
    setRate(String(m.interest_rate ?? 15));
  };

  const save = async () => {
    if (!active) return;
    const b = Number(balance);
    const r = Number(rate);
    if (!Number.isFinite(b) || b < 0 || !Number.isFinite(r) || r < 0 || r > 100) {
      toast.error("Enter a valid balance and interest rate");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ balance: b, interest_rate: r } as never)
      .eq("id", active.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account balance updated");
    setActive(null);
    void load();
  };

  const activeCard = active ? cardsByUser.get(active.id) : undefined;
  const activePayments = active ? payments.filter((p) => p.user_id === active.id) : [];

  return (
    <>
      <section className="onyx-surface rounded-3xl p-5 shadow-float">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">
          Total balance across book
        </p>
        <p className="mt-1 font-display text-3xl font-black">
          {money(members.reduce((s, m) => s + Number(m.balance ?? 0), 0))}
        </p>
        <p className="mt-1 text-sm text-white/60">{members.length} members</p>
      </section>

      <div className="mt-5 flex gap-2 rounded-full border border-border bg-card p-1.5">
        {(
          [
            { key: "deposit", label: "Add money", Icon: ArrowDownLeft },
            { key: "withdrawal", label: "Withdraw money", Icon: ArrowUpRight },
          ] as const
        ).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setFlow(key)}
            className={
              flow === key
                ? "gold-surface flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold shadow-gold"
                : "flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium text-muted-foreground"
            }
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {members.map((m) => {
          const last = latestFor(m.id);
          const card = cardsByUser.get(m.id);
          return (
            <div key={m.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display font-bold tracking-wider">{m.account_id}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
                <button
                  onClick={() => open(m)}
                  aria-label={`Edit ${m.account_id}`}
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-primary"
                >
                  <Pencil className="size-4" />
                </button>
              </div>

              <button
                onClick={() => open(m)}
                className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl bg-muted px-4 py-3 text-left"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <CreditCard
                    className={
                      card
                        ? "size-5 shrink-0 text-primary"
                        : "size-5 shrink-0 text-muted-foreground"
                    }
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {card ? `${card.brand.toUpperCase()} •••• ${card.last4}` : "Card not added"}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {last
                        ? `${last.method || last.kind} · ${new Date(last.created_at).toLocaleDateString()}`
                        : "No transfer yet"}
                    </span>
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-display font-bold">
                    {money(Number(last?.amount ?? 0))}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Balance {money(m.balance)}
                  </span>
                </span>
              </button>
            </div>
          );
        })}
        {members.length === 0 && <p className="text-sm text-muted-foreground">No members yet.</p>}
      </div>

      <Sheet open={!!active} onClose={() => setActive(null)} title={active?.account_id ?? ""}>
        <p className="text-sm text-muted-foreground">{active?.email}</p>

        <label className="mt-5 block text-sm font-medium">Account balance (USD)</label>
        <input
          value={balance}
          onChange={(e) => setBalance(e.target.value.replace(/[^\d.]/g, ""))}
          inputMode="decimal"
          aria-label="Account balance"
          className="mt-2 h-14 w-full rounded-2xl bg-muted px-5 font-display text-xl font-bold outline-none focus:ring-2 focus:ring-ring"
        />

        <label className="mt-4 block text-sm font-medium">Interest rate (% weekly)</label>
        <input
          value={rate}
          onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ""))}
          inputMode="decimal"
          aria-label="Interest rate"
          className="mt-2 h-14 w-full rounded-2xl bg-muted px-5 font-display text-xl font-bold outline-none focus:ring-2 focus:ring-ring"
        />

        <button
          disabled={busy || balance === ""}
          onClick={() => void save()}
          className="gold-surface mt-5 flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold disabled:opacity-40"
        >
          Save changes
        </button>

        <h3 className="mt-7 font-display text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Card on file
        </h3>
        {activeCard ? (
          <div className="mt-2 rounded-2xl border border-border bg-muted p-3 text-sm">
            <p className="font-semibold">
              {activeCard.brand.toUpperCase()} •••• {activeCard.last4} ·{" "}
              {String(activeCard.exp_month).padStart(2, "0")}/
              {String(activeCard.exp_year).slice(-2)}
            </p>
            <p className="text-xs text-muted-foreground">{activeCard.holder}</p>
            <p className="text-xs text-muted-foreground">
              {[
                activeCard.billing_address,
                activeCard.billing_city,
                activeCard.billing_state,
                activeCard.postal_code,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Card not added.</p>
        )}

        <h3 className="mt-7 font-display text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Card payments received
        </h3>
        <div className="mt-2 space-y-2">
          {activePayments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm"
            >
              <span className="min-w-0">
                <span className="block font-semibold">
                  {p.method} · {p.brand.toUpperCase()} •••• {p.last4}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {p.holder} · {new Date(p.created_at).toLocaleString()} · {p.status}
                </span>
              </span>
              <span className="font-display font-bold">{money(Number(p.amount))}</span>
            </div>
          ))}
          {activePayments.length === 0 && (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          )}
        </div>

        <h3 className="mt-7 font-display text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Transfers
        </h3>
        <div className="mt-2 space-y-2">
          {activities
            .filter((a) => a.user_id === active?.id)
            .map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="block font-semibold capitalize">
                    {a.kind}
                    {a.method ? ` · ${a.method}` : ""}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()} · {a.status}
                  </span>
                </span>
                <span className="font-display font-bold">{money(Number(a.amount))}</span>
              </div>
            ))}
        </div>
      </Sheet>
    </>
  );
}

/* -------------------------------- Loan -------------------------------- */

function LoanTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [apps, setApps] = useState<LoanApplication[]>([]);
  const [active, setActive] = useState<{ member: Member; app: LoanApplication } | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [m, a] = await Promise.all([loadMembers(), fetchLoanApplications()]);
    setMembers(m);
    setApps(a);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const save = async () => {
    if (!active) return;
    if (Number(active.member.balance ?? 0) <= 0) {
      toast.error("Member has no funded main balance — a loan cannot be added");
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setBusy(true);
    const [{ error }] = await Promise.all([
      supabase
        .from("profiles")
        .update({ loan_balance: value } as never)
        .eq("id", active.member.id),
      supabase
        .from("loan_applications")
        .update({ status: "approved" } as never)
        .eq("id", active.app.id),
    ]);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Loan balance updated");
    setActive(null);
    void load();
  };

  return (
    <>
      <section className="onyx-surface rounded-3xl p-5 shadow-float">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Loan book</p>
        <p className="mt-1 font-display text-3xl font-black">
          {money(members.reduce((s, m) => s + Number(m.loan_balance ?? 0), 0))}
        </p>
        <p className="mt-1 text-sm text-white/60">{apps.length} applications</p>
      </section>

      <div className="mt-5 space-y-3">
        {apps.map((app) => {
          const m = byId.get(app.user_id);
          if (!m) return null;
          const blocked = Number(m.balance ?? 0) <= 0;
          return (
            <div key={app.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display font-bold tracking-wider">{m.account_id}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
                <button
                  onClick={() => {
                    setActive({ member: m, app });
                    setAmount(String(m.loan_balance ?? 0));
                  }}
                  aria-label={`Edit loan for ${m.account_id}`}
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-primary"
                >
                  <Pencil className="size-4" />
                </button>
              </div>

              <div className="mt-3 rounded-2xl bg-muted p-4 text-sm">
                <Row label="Applied for" value={money(Number(app.amount))} />
                <Row label="Valid ID" value={`${app.id_type || "—"} · ${app.id_number || "—"}`} />
                <Row label="SSN (last 4)" value={app.ssn_last4 ? `•••-••-${app.ssn_last4}` : "—"} />
                <Row label="Current loan balance" value={money(Number(m.loan_balance ?? 0))} />
                <Row label="Status" value={app.status} />
              </div>

              {blocked && (
                <p className="mt-2 text-xs text-destructive">
                  Main account balance is empty — fund it before approving a loan.
                </p>
              )}
            </div>
          );
        })}
        {apps.length === 0 && (
          <p className="text-sm text-muted-foreground">No loan applications yet.</p>
        )}
      </div>

      <Sheet
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.member.account_id ?? ""}
      >
        <p className="text-sm text-muted-foreground">
          Applied for {money(Number(active?.app.amount ?? 0))} · main balance{" "}
          {money(Number(active?.member.balance ?? 0))}
        </p>
        <label className="mt-5 block text-sm font-medium">Total available loan balance</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          inputMode="decimal"
          aria-label="Loan balance"
          className="mt-2 h-14 w-full rounded-2xl bg-muted px-5 font-display text-xl font-bold outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          disabled={busy || amount === "" || Number(active?.member.balance ?? 0) <= 0}
          onClick={() => void save()}
          className="gold-surface mt-5 flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold disabled:opacity-40"
        >
          Save changes
        </button>
        {Number(active?.member.balance ?? 0) <= 0 && (
          <p className="mt-3 text-xs text-destructive">
            This member's main account is empty, so no loan can be issued.
          </p>
        )}
      </Sheet>
    </>
  );
}

/* ------------------------------ Savings ------------------------------ */

function SavingsTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<SavingsPlan[]>([]);
  const [active, setActive] = useState<{ member: Member; plan: SavingsPlan } | null>(null);
  const [amount, setAmount] = useState("");
  const [gain, setGain] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [m, p] = await Promise.all([loadMembers(), fetchSavingsPlans()]);
    setMembers(m);
    setPlans(p);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const save = async () => {
    if (!active) return;
    if (Number(active.member.balance ?? 0) <= 0) {
      toast.error("Member has no funded main balance — savings cannot be added");
      return;
    }
    const value = Number(amount);
    const profit = Number(gain);
    if (!Number.isFinite(value) || value < 0 || !Number.isFinite(profit)) {
      toast.error("Enter a valid amount");
      return;
    }
    setBusy(true);
    const [{ error }] = await Promise.all([
      supabase
        .from("profiles")
        .update({ savings: value, monthly_gain: profit } as never)
        .eq("id", active.member.id),
      supabase
        .from("savings_plans")
        .update({ status: "active" } as never)
        .eq("id", active.plan.id),
    ]);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Savings balance updated");
    setActive(null);
    void load();
  };

  return (
    <>
      <section className="onyx-surface rounded-3xl p-5 shadow-float">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Savings under management</p>
        <p className="mt-1 font-display text-3xl font-black">
          {money(members.reduce((s, m) => s + Number(m.savings ?? 0), 0))}
        </p>
        <p className="mt-1 text-sm text-white/60">{plans.length} plans</p>
      </section>

      <div className="mt-5 space-y-3">
        {plans.map((plan) => {
          const m = byId.get(plan.user_id);
          if (!m) return null;
          const blocked = Number(m.balance ?? 0) <= 0;
          return (
            <div key={plan.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display font-bold tracking-wider">{m.account_id}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
                <button
                  onClick={() => {
                    setActive({ member: m, plan });
                    setAmount(String(m.savings ?? 0));
                    setGain(String(m.monthly_gain ?? 0));
                  }}
                  aria-label={`Edit savings for ${m.account_id}`}
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-primary"
                >
                  <Pencil className="size-4" />
                </button>
              </div>

              <div className="mt-3 rounded-2xl bg-muted p-4 text-sm">
                <Row label="Purposed amount" value={money(Number(plan.purposed_amount))} />
                <Row label="Current savings" value={money(Number(m.savings ?? 0))} />
                <Row label="Profit this month" value={money(Number(m.monthly_gain ?? 0))} />
                <Row label="Status" value={plan.status} />
              </div>

              {blocked && (
                <p className="mt-2 text-xs text-destructive">
                  Main account balance is empty — fund it before crediting savings.
                </p>
              )}
            </div>
          );
        })}
        {plans.length === 0 && (
          <p className="text-sm text-muted-foreground">No savings plans yet.</p>
        )}
      </div>

      <Sheet
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.member.account_id ?? ""}
      >
        <p className="text-sm text-muted-foreground">
          Purposed {money(Number(active?.plan.purposed_amount ?? 0))} · main balance{" "}
          {money(Number(active?.member.balance ?? 0))}
        </p>
        <label className="mt-5 block text-sm font-medium">Total available savings balance</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          inputMode="decimal"
          aria-label="Savings balance"
          className="mt-2 h-14 w-full rounded-2xl bg-muted px-5 font-display text-xl font-bold outline-none focus:ring-2 focus:ring-ring"
        />
        <label className="mt-4 block text-sm font-medium">Gained this month (profit)</label>
        <input
          value={gain}
          onChange={(e) => setGain(e.target.value.replace(/[^\d.]/g, ""))}
          inputMode="decimal"
          aria-label="Gained this month"
          className="mt-2 h-14 w-full rounded-2xl bg-muted px-5 font-display text-xl font-bold outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          disabled={busy || amount === "" || Number(active?.member.balance ?? 0) <= 0}
          onClick={() => void save()}
          className="gold-surface mt-5 flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold disabled:opacity-40"
        >
          Save changes
        </button>
        {Number(active?.member.balance ?? 0) <= 0 && (
          <p className="mt-3 text-xs text-destructive">
            This member's main account is empty, so savings cannot be credited.
          </p>
        )}
      </Sheet>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold capitalize">{value}</span>
    </div>
  );
}

/* -------------------------------- Blog -------------------------------- */

function BlogTab() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [active, setActive] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => setPosts(await fetchBlogPosts()), []);

  useEffect(() => {
    void load();
  }, [load]);

  const open = (p: BlogPost) => {
    setActive(p);
    setTitle(p.title);
    setBody(p.body);
    setExcerpt(p.excerpt);
    setFile(null);
  };

  const save = async () => {
    if (!active) return;
    setBusy(true);
    let imagePath = active.image_url;
    if (file) {
      const path = `${active.id}-${Date.now()}`;
      const { error: upErr } = await supabase.storage
        .from("blog")
        .upload(path, file, { upsert: true });
      if (upErr) {
        setBusy(false);
        toast.error(upErr.message);
        return;
      }
      imagePath = path;
    }
    const { error } = await supabase
      .from("blog_posts")
      .update({ title, body, excerpt, image_url: imagePath } as never)
      .eq("id", active.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Article updated");
    setActive(null);
    void load();
  };

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Six fixed articles power the member Discover feed. Edits publish instantly.
      </p>
      <div className="mt-5 space-y-3">
        {posts.map((p) => (
          <article key={p.id} className="rounded-2xl border border-border bg-card p-4">
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
              {p.tag}
            </span>
            <h3 className="mt-2 font-display font-bold">{p.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>
            <button
              onClick={() => open(p)}
              className="mt-3 h-10 rounded-full border border-border px-5 text-sm font-semibold"
            >
              Edit
            </button>
          </article>
        ))}
      </div>

      <Sheet open={!!active} onClose={() => setActive(null)} title="Edit article">
        <label className="block text-sm font-medium">Cover image</label>
        <input
          type="file"
          accept="image/*"
          aria-label="Cover image"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-2 w-full rounded-2xl bg-muted p-4 text-sm"
        />
        <label className="mt-4 block text-sm font-medium">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 120))}
          aria-label="Title"
          className="mt-2 h-13 w-full rounded-2xl bg-muted px-5 py-3 outline-none focus:ring-2 focus:ring-ring"
        />
        <label className="mt-4 block text-sm font-medium">Excerpt</label>
        <input
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value.slice(0, 220))}
          aria-label="Excerpt"
          className="mt-2 h-13 w-full rounded-2xl bg-muted px-5 py-3 outline-none focus:ring-2 focus:ring-ring"
        />
        <label className="mt-4 block text-sm font-medium">Article</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          aria-label="Article"
          className="mt-2 w-full rounded-2xl bg-muted p-5 outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          disabled={busy || !title.trim()}
          onClick={() => void save()}
          className="gold-surface mt-5 flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold disabled:opacity-40"
        >
          Publish changes
        </button>
      </Sheet>
    </>
  );
}

/* ------------------------------- Profile ------------------------------ */

function OperatorProfile() {
  const navigate = useNavigate();
  const { account, update } = useAccount();
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    void fetchBlogPosts().then(async (p) =>
      setPreview(await signedBlogUrl(p[0]?.image_url ?? null)),
    );
  }, []);

  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-4">
        <AvatarEditor avatar={account?.avatar} onUploaded={(url) => update({ avatar: url })} />
        <div className="min-w-0">
          <p className="font-display text-xl font-bold">{account?.nickname ?? "Operator"}</p>
          <p className="truncate text-sm text-muted-foreground">{account?.email}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Operator ID</p>
          <p className="font-display font-bold tracking-wider">
            {account?.accountId ?? "————————————"}
          </p>
        </div>
        <button
          aria-label="Copy operator ID"
          onClick={() => {
            navigator.clipboard?.writeText(account?.accountId ?? "");
            toast.success("Operator ID copied");
          }}
          className="text-primary"
        >
          <Copy className="size-5" />
        </button>
      </div>

      {preview && (
        <img
          src={preview}
          alt="Latest article cover"
          className="mt-4 h-32 w-full rounded-2xl object-cover"
        />
      )}

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          toast.success("Signed out");
          navigate({ to: "/login", replace: true });
        }}
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full border border-destructive/40 font-semibold text-destructive"
      >
        <LogOut className="size-5" /> Log out
      </button>
    </section>
  );
}

/* ------------------------------ Support ------------------------------- */

function AdminChat({
  open,
  onClose,
  initialUserId = null,
}: {
  open: boolean;
  onClose: () => void;
  initialUserId?: string | null;
}) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const { messages } = useThread(activeId, "admin");

  const load = useCallback(async () => {
    const [t, m] = await Promise.all([fetchThreads(), loadMembers()]);
    setThreads(t);
    setMembers(m);
  }, []);

  useEffect(() => {
    if (open) {
      void load();
      setActiveId(initialUserId);
    }
  }, [open, load, initialUserId]);

  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !activeId) return;
    setDraft("");
    const { error } = await sendMessage(activeId, body, "admin");
    if (error) toast.error(error);
    else void load();
  };

  return (
    <Sheet
      open={open}
      onClose={() => {
        setActiveId(null);
        onClose();
      }}
      title={activeId ? (byId.get(activeId)?.account_id ?? "Conversation") : "Support desk"}
    >
      {!activeId ? (
        <div className="space-y-2">
          {threads.map((t) => (
            <button
              key={t.userId}
              onClick={() => setActiveId(t.userId)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left"
            >
              <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-lg">
                {isImageAvatar(byId.get(t.userId)?.avatar) ? (
                  <img
                    src={byId.get(t.userId)?.avatar}
                    alt=""
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  (byId.get(t.userId)?.avatar ?? "🦅")
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {byId.get(t.userId)?.account_id ?? "Member"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{t.last.body}</span>
              </span>
              {t.unread > 0 && <span className="size-3 shrink-0 rounded-full bg-destructive" />}
            </button>
          ))}
          {threads.length === 0 && (
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
          )}
        </div>
      ) : (
        <>
          <button onClick={() => setActiveId(null)} className="text-sm font-semibold text-primary">
            ← All conversations
          </button>
          <div className="mt-4 max-h-[45vh] space-y-3 overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className={m.sender_role === "admin" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.sender_role === "admin"
                      ? "gold-surface max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm font-medium"
                      : "max-w-[80%] rounded-2xl rounded-bl-md border border-border bg-muted px-4 py-2.5 text-sm"
                  }
                >
                  {m.body}
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
              aria-label="Reply"
              placeholder="Reply to member…"
              className="h-13 w-full rounded-full bg-muted px-5 py-3 outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => void send()}
              disabled={!draft.trim()}
              aria-label="Send reply"
              className="gold-surface grid shrink-0 place-items-center rounded-full p-3.5 shadow-gold disabled:opacity-40"
            >
              <Send className="size-5" />
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}

function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/60" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-rise max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-card p-6 pb-10"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="text-muted-foreground">
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
