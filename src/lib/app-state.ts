import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getQuotes, type Quote } from "@/lib/market.functions";

export type { Quote };

export type Account = {
  id: string;
  email: string;
  nickname: string;
  avatar: string;
  accountId: string;
  balance: number;
  savings: number;
  invested: number;
  loanBalance: number;
  monthlyGain: number;
  retirementBalance: number;
  cryptoWallet: string;
  sectors: string[];
  onboarded: boolean;
};

export const AVATARS = ["🦅", "🐺", "🦁", "🐧", "🦉", "🐢", "🦊", "🐬", "🦋", "🐝", "🦒", "🐳"];

export type ProfileRow = {
  id: string;
  email: string;
  nickname: string;
  avatar: string;
  account_id: string;
  balance: number;
  savings: number;
  invested: number;
  loan_balance: number;
  monthly_gain: number;
  retirement_balance: number;
  crypto_wallet: string;
  sectors: string[] | null;
  onboarded: boolean;
};

export function toAccount(row: ProfileRow): Account {
  return {
    id: row.id,
    email: row.email,
    nickname: row.nickname,
    avatar: row.avatar,
    accountId: row.account_id,
    balance: Number(row.balance),
    savings: Number(row.savings),
    invested: Number(row.invested),
    loanBalance: Number(row.loan_balance),
    monthlyGain: Number(row.monthly_gain ?? 0),
    retirementBalance: Number(row.retirement_balance ?? 0),
    cryptoWallet: row.crypto_wallet ?? "",
    sectors: row.sectors ?? [],
    onboarded: row.onboarded,
  };
}

const COLUMN_MAP: Record<string, string> = {
  nickname: "nickname",
  avatar: "avatar",
  balance: "balance",
  savings: "savings",
  invested: "invested",
  loanBalance: "loan_balance",
  monthlyGain: "monthly_gain",
  retirementBalance: "retirement_balance",
  sectors: "sectors",
  onboarded: "onboarded",
  email: "email",
};


export function useAccount() {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setAccount(null);
      setReady(true);
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
    setAccount(data ? toAccount(data as unknown as ProfileRow) : null);
    setReady(true);
  }, []);

  useEffect(() => {
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void load();
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const update = useCallback(
    async (patch: Partial<Account>) => {
      if (!account) return;
      const next = { ...account, ...patch };
      setAccount(next);
      const row: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(patch)) {
        const column = COLUMN_MAP[key];
        if (column) row[column] = value;
      }
      if (Object.keys(row).length)
        await supabase
          .from("profiles")
          .update(row as never)
          .eq("id", account.id);
    },
    [account],
  );

  return { account, ready, update, reload: load };
}

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        if (alive) {
          setIsAdmin(false);
          setChecked(true);
        }
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", auth.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (alive) {
        setIsAdmin(Boolean(data));
        setChecked(true);
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, []);

  return { isAdmin, checked };
}

export async function isAdminUser(userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(data);
}

export async function signOutAccount() {
  await supabase.auth.signOut();
}

/** Deterministic leaderboard that rotates every 12 hours. */
export function leaderboardSeed() {
  return Math.floor(Date.now() / (12 * 60 * 60 * 1000));
}

const FIRST = [
  "Ava", "Marcus", "Zico", "Dele", "Noor", "Kai", "Ines", "Tobi", "Lena", "Ray",
  "Sana", "Owen", "Bilal", "Mira", "Kojo", "Elle", "Yuki", "Femi", "Rosa", "Dmitri",
];
const LAST = ["Vale", "Okoye", "Lin", "Grant", "Abara", "Stone", "Reyes", "Kwan", "Bello", "Frost"];
const TICKERS = ["NVDA", "AAPL", "TSLA", "MSFT", "BTC", "ETH", "AMZN", "META", "GOOG", "AVGO", "SOL", "JPM"];

export function buildLeaderboard(count = 50) {
  const seed = leaderboardSeed();
  const rand = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    name: `${FIRST[Math.floor(rand(i * 3) * FIRST.length)]!} ${LAST[Math.floor(rand(i * 5 + 1) * LAST.length)]!}`,
    avatar: AVATARS[Math.floor(rand(i * 7 + 2) * AVATARS.length)]!,
    ticker: TICKERS[Math.floor(rand(i * 11 + 3) * TICKERS.length)]!,
    gain: +(28 - i * 0.38 + rand(i * 13 + 4) * 3).toFixed(1),
  }));
}

/** Live market quotes from Finnhub, refreshed every 20 seconds. */
export function useLiveQuotes(pollMs = 20000) {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const data = await getQuotes();
        if (!alive) return;
        if (data.length) setQuotes(data);
      } catch (e) {
        console.error("useLiveQuotes failed:", e);
      }
    };
    void run();
    const t = setInterval(() => void run(), pollMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [pollMs]);

  return { quotes, loading: false };
}

export type BlogPost = {
  id: string;
  position: number;
  title: string;
  tag: string;
  read_time: string;
  excerpt: string;
  body: string;
  image_url: string | null;
};

const POST_FIELDS = "id, position, title, tag, read_time, excerpt, body, image_url";

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_FIELDS)
    .order("position", { ascending: true })
    .limit(24);
  if (error) {
    console.error("fetchBlogPosts failed:", error);
    return [];
  }
  return (data ?? []) as BlogPost[];
}

export async function fetchBlogPost(id: string): Promise<BlogPost | null> {
  const { data, error } = await supabase.from("blog_posts").select(POST_FIELDS).eq("id", id).maybeSingle();
  if (error) {
    console.error("fetchBlogPost failed:", error);
    return null;
  }
  return (data as BlogPost) ?? null;
}

/** Blog images: CDN assets pass through, private-bucket paths get a signed URL. */
export async function signedBlogUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("/")) return path;
  const { data, error } = await supabase.storage.from("blog").createSignedUrl(path, 60 * 60);
  if (error) {
    console.error("signedBlogUrl failed:", error);
    return null;
  }
  return data?.signedUrl ?? null;
}

export type Card = {
  id: string;
  brand: string;
  holder: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  postal_code: string;
};

export type NewCard = Omit<Card, "id">;

const CARD_FIELDS =
  "id, brand, holder, last4, exp_month, exp_year, billing_address, billing_city, billing_state, postal_code";

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);

  const load = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setCards([]);
        return;
      }
      const { data, error } = await supabase
        .from("user_cards")
        .select(CARD_FIELDS)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("useCards load failed:", error);
        setCards([]);
        return;
      }
      setCards((data ?? []) as Card[]);
    } catch (e) {
      console.error("useCards load threw:", e);
      setCards([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { cards, loading: false, reload: load };
}

export async function saveCard(card: NewCard) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in to save a card" };
  const { error } = await supabase.from("user_cards").insert({ ...card, user_id: auth.user.id } as never);
  return { error: error?.message ?? null };
}

export async function removeCard(id: string) {
  await supabase.from("user_cards").delete().eq("id", id);
}

/** Personal referral link — every funded invite pays the referrer $10. */
export const REFERRAL_REWARD = 10;

export function referralLink(accountId?: string | null) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://columnandgable.lovable.app";
  return `${origin}/?ref=${accountId ?? "member"}`;
}

/* ------------------------------------------------------------------ *
 * Activity ledger — every money movement a member makes is recorded
 * here so the operations console can review it per member, per tab.
 * ------------------------------------------------------------------ */

export type ActivityKind =
  | "deposit"
  | "withdrawal"
  | "savings"
  | "retirement"
  | "loan"
  | "card"
  | "investment";

export type Activity = {
  id: string;
  user_id: string;
  kind: ActivityKind;
  amount: number;
  method: string;
  reference: string;
  status: string;
  created_at: string;
};

const ACTIVITY_FIELDS = "id, user_id, kind, amount, method, reference, status, created_at";

export async function logActivity(entry: {
  kind: ActivityKind;
  amount: number;
  method?: string;
  reference?: string;
  status?: string;
}) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from("activities").insert({
    user_id: auth.user.id,
    kind: entry.kind,
    amount: entry.amount,
    method: entry.method ?? "",
    reference: entry.reference ?? "",
    status: entry.status ?? "pending",
  } as never);
}

/** Admin/self read of a member's activity ledger, optionally filtered by kind. */
export async function fetchActivities(userId: string, kinds?: ActivityKind[]) {
  let query = supabase
    .from("activities")
    .select(ACTIVITY_FIELDS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (kinds?.length) query = query.in("kind", kinds);
  const { data } = await query;
  return (data ?? []) as Activity[];
}

/** Admin read of the cards a specific member has stored. */
export async function fetchMemberCards(userId: string) {
  const { data } = await supabase
    .from("user_cards")
    .select(CARD_FIELDS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Card[];
}

/* ------------------------------------------------------------------ *
 * Card payments — a member pays with a stored card, the operations
 * console reviews the method, amount and card details behind it.
 * ------------------------------------------------------------------ */

export type Payment = {
  id: string;
  user_id: string;
  card_id: string | null;
  amount: number;
  method: string;
  brand: string;
  last4: string;
  holder: string;
  status: string;
  created_at: string;
};

const PAYMENT_FIELDS =
  "id, user_id, card_id, amount, method, brand, last4, holder, status, created_at";

export async function createPayment(input: {
  card: Card;
  amount: number;
  method?: string;
}) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in to pay" };
  const { error } = await supabase.from("payments").insert({
    user_id: auth.user.id,
    card_id: input.card.id,
    amount: input.amount,
    method: input.method ?? `card:${input.card.brand}`,
    brand: input.card.brand,
    last4: input.card.last4,
    holder: input.card.holder,
    status: "pending",
  } as never);
  if (!error)
    await logActivity({
      kind: "card",
      amount: input.amount,
      method: `card:${input.card.brand}`,
      reference: `•••• ${input.card.last4}`,
    });
  return { error: error?.message ?? null };
}

export async function fetchMemberPayments(userId: string) {
  const { data } = await supabase
    .from("payments")
    .select(PAYMENT_FIELDS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as Payment[];
}

/* ------------------------------------------------------------------ *
 * Loan applications & savings plans — member submits, operator approves.
 * ------------------------------------------------------------------ */

export type LoanApplication = {
  id: string;
  user_id: string;
  amount: number;
  id_type: string;
  id_number: string;
  ssn_last4: string;
  status: string;
  created_at: string;
};

const LOAN_FIELDS = "id, user_id, amount, id_type, id_number, ssn_last4, status, created_at";

export async function submitLoanApplication(input: {
  amount: number;
  id_type: string;
  id_number: string;
  ssn_last4: string;
}) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in to apply" };
  const { error } = await supabase
    .from("loan_applications")
    .insert({ ...input, user_id: auth.user.id } as never);
  if (!error)
    await logActivity({ kind: "loan", amount: input.amount, method: "application", reference: input.id_type });
  return { error: error?.message ?? null };
}

export async function fetchLoanApplications() {
  const { data } = await supabase
    .from("loan_applications")
    .select(LOAN_FIELDS)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as LoanApplication[];
}

export type SavingsPlan = {
  id: string;
  user_id: string;
  purposed_amount: number;
  status: string;
  created_at: string;
};

const SAVINGS_FIELDS = "id, user_id, purposed_amount, status, created_at";

export async function submitSavingsPlan(purposedAmount: number) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in to open a plan" };
  const { error } = await supabase
    .from("savings_plans")
    .insert({ user_id: auth.user.id, purposed_amount: purposedAmount } as never);
  if (!error)
    await logActivity({ kind: "savings", amount: purposedAmount, method: "plan", reference: "savings plan" });
  return { error: error?.message ?? null };
}

export async function fetchSavingsPlans() {
  const { data } = await supabase
    .from("savings_plans")
    .select(SAVINGS_FIELDS)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as SavingsPlan[];
}

/* ------------------------------------------------------------------ *
 * Support chat — one thread per member, operators answer from
 * /operations. Read flags drive the red blip on both sides.
 * ------------------------------------------------------------------ */

export type Message = {
  id: string;
  user_id: string;
  sender_id: string;
  sender_role: "user" | "admin";
  body: string;
  read_by_user: boolean;
  read_by_admin: boolean;
  created_at: string;
};

const MESSAGE_FIELDS =
  "id, user_id, sender_id, sender_role, body, read_by_user, read_by_admin, created_at";

export async function fetchThread(userId: string) {
  const { data } = await supabase
    .from("messages")
    .select(MESSAGE_FIELDS)
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(200);
  return (data ?? []) as Message[];
}

export async function sendMessage(threadUserId: string, body: string, role: "user" | "admin") {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in to send a message" };
  const { error } = await supabase.from("messages").insert({
    user_id: threadUserId,
    sender_id: auth.user.id,
    sender_role: role,
    body: body.slice(0, 2000),
    read_by_user: role === "user",
    read_by_admin: role === "admin",
  } as never);
  return { error: error?.message ?? null };
}

export async function markThreadRead(threadUserId: string, role: "user" | "admin") {
  const column = role === "user" ? "read_by_user" : "read_by_admin";
  await supabase
    .from("messages")
    .update({ [column]: true } as never)
    .eq("user_id", threadUserId)
    .eq(column, false);
}

/** Live thread with realtime updates; marks incoming messages read on view. */
export function useThread(threadUserId: string | null, role: "user" | "admin") {
  const [messages, setMessages] = useState<Message[]>([]);

  const load = useCallback(async () => {
    if (!threadUserId) return;
    const rows = await fetchThread(threadUserId);
    setMessages(rows);
    await markThreadRead(threadUserId, role);
  }, [threadUserId, role]);

  useEffect(() => {
    void load();
    if (!threadUserId) return;
    const channel = supabase
      .channel(`thread-${threadUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `user_id=eq.${threadUserId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [threadUserId, load]);

  return { messages, reload: load };
}

/** Red-blip counter. Members count their own thread, operators count all. */
export function useUnreadCount(role: "user" | "admin") {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setCount(0);
      return;
    }
    let query = supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq(role === "user" ? "read_by_user" : "read_by_admin", false)
      .eq("sender_role", role === "user" ? "admin" : "user");
    if (role === "user") query = query.eq("user_id", auth.user.id);
    const { count: n } = await query;
    setCount(n ?? 0);
  }, [role]);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel(`unread-${role}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, role]);

  return count;
}

/** Operator inbox: every member thread with its last message and unread state. */
export type ThreadSummary = {
  userId: string;
  last: Message;
  unread: number;
};

export async function fetchThreads(): Promise<ThreadSummary[]> {
  const { data } = await supabase
    .from("messages")
    .select(MESSAGE_FIELDS)
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as Message[];
  const map = new Map<string, ThreadSummary>();
  for (const m of rows) {
    const entry = map.get(m.user_id);
    if (!entry) map.set(m.user_id, { userId: m.user_id, last: m, unread: 0 });
    const t = map.get(m.user_id)!;
    if (m.sender_role === "user" && !m.read_by_admin) t.unread += 1;
  }
  return [...map.values()];
}
