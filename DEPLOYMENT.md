# Column & Gable — Go-Live Notes

The app is live-wired to Lovable Cloud for accounts, balances, roles and the blog.
The following surfaces are still **seeded demo data** and must be swapped to real
endpoints before public deployment.

## 1. Market data — ✅ LIVE
Quotes now come from Finnhub via the `getQuotes` server function in
`src/lib/market.functions.ts` (key stored as the `FINNHUB_API_KEY` backend
secret), polled every 20s by `useLiveQuotes()` on Discover and `/stocks`.
Free-tier Finnhub rate limits apply (60 calls/min); add server-side caching or
a websocket feed if member traffic grows.

## 2. Social leaderboard (`buildLeaderboard()`)
Deterministically generated names/returns rotating every 12 hours.
Replace with a `leaderboard` table (or materialised view) computed from real
positions, refreshed by a scheduled job, and ranked by realised % gain.

## 3. Portfolio performance
Savings P&L, 401(k) projections and auto-invest returns are computed from the
stored `savings`/`invested` figures using the marketing rate. Replace with a
`positions` + `transactions` ledger and derive performance from executed trades.

## 4. Money movement (`/add-money`, `/withdraw`)
Card/bank inputs are captured but not charged. Wire to a payment/ACH provider
(Stripe, Plaid) via a server route; never store raw card or routing data in the
database.

## 5. Two-factor enrolment (`/signup` → Authenticator step)
The displayed secret key is a placeholder. Replace with Supabase Auth MFA
(`supabase.auth.mfa.enroll` / `challenge` / `verify`) and require a verified
factor before granting access.

## 6. Loans
Loan balances are operator-set. Introduce an application record, underwriting
status, repayment schedule and interest accrual job.

## Operator access
Admins are rows in `user_roles` with the `admin` role. Promote an existing user
by UUID with the database function:

```sql
select public.promote_to_admin('<user-uuid>');
```

Admins sign in through the same `/login` screen and are routed to `/operations`.
