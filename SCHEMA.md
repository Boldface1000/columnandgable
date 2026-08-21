# Column & Gable — Database Schema & Implementation Notes

All tables live in the `public` schema with RLS enabled. Money columns are `numeric`,
timestamps are `timestamptz`, and `updated_at` is maintained by the `touch_updated_at` trigger.

## profiles — one row per member (created by the `handle_new_user` trigger)

| Column | Purpose |
| --- | --- |
| `id` | matches the auth user id |
| `email`, `nickname`, `avatar` | profile identity shown across the app |
| `account_id` | 12-digit wire reference, copied on Add money / Bank transfer |
| `crypto_wallet` | deterministic BTC-style address shown on Add money & Digital assets |
| `balance` | available balance (Discover hero, admin **Users** tab) |
| `monthly_gain` | "gained this month" on Discover **and** savings Profit in Finance — one admin field drives both |
| `savings` | savings vault balance (admin **Savings** tab) |
| `retirement_balance` | 401(k) balance (admin **Users** tab, secondary field) |
| `loan_balance` | outstanding member loan (admin **Loan** tab) |
| `invested`, `sectors`, `onboarded` | onboarding + auto-invest state |

Access: a member reads/updates only their own row; admins (via `has_role`) read and update all rows.
Every balance a member sees is written by an operator in `/operations` — nothing is computed client-side.

## user_roles + app_role enum

Roles are never stored on `profiles`. `has_role(uuid, app_role)` is `SECURITY DEFINER` so RLS
policies can call it without recursion. `promote_to_admin(uuid)` promotes an existing member by
UUID; the first admin bootstraps automatically for the seeded operator email.

## user_cards — stored cards

Brand, holder, last4, expiry and billing address only (no PAN, no CVV). Members manage their own
rows; admins read them in the **Users** and **Loan** tabs when reviewing a member.

## activities — money-movement ledger

`kind` is one of `deposit | withdrawal | savings | retirement | loan | card | investment`, plus
`amount`, `method` (bank-transfer, card, crypto:btc …), `reference`, `status`.
Written by `logActivity()` from Add money, Bank transfer, Digital assets and Withdraw.
Read back per member, filtered by `kind`, in the matching operations tab:

| Operations tab | Fields edited | Data fetched per member |
| --- | --- | --- |
| Users | `balance`, `retirement_balance` | cards + deposit / withdrawal / 401(k) / card activity |
| Loan | `loan_balance` | cards + loan activity |
| Savings | `savings`, `monthly_gain` | savings + investment activity |
| Blog | article title, excerpt, body, cover image | the six fixed `blog_posts` rows |

## blog_posts

Exactly six rows to keep database usage flat. Public read; admin write. Cover images are either
bundled asset URLs or objects in the private `blog` storage bucket, resolved with a signed URL.

## Implementation notes

- Member pages call `useAuthGuard()`; signed-out visitors are redirected to `/login`.
- `/operations` additionally requires the `admin` role via `useIsAdmin()`.
- All inputs are validated with the Zod schemas in `src/lib/validators.ts` (Luhn card check,
  9-digit routing, account-number length, minimum deposit, withdrawal capped at balance,
  wallet-address format).
- Funding screens render custody details from `src/lib/treasury.ts` so bank, card and crypto
  flows can never disagree.

## payments — card checkout ledger

Written when a member pays from a stored card on `/add-card`. Stores the amount, method
(`card:visa` …), brand, last4, holder and status, plus a link to the `user_cards` row.
Read in the operations **Users** tab so an operator sees the payment method, price and the card
details behind every payment. Members insert their own rows; only admins change status.

## loan_applications

`amount`, `id_type`, `id_number`, `ssn_last4`, `status`. Submitted from the Finance → Loan tab and
listed in the operations **Loan** tab. Approving writes `profiles.loan_balance` and flips the
application to `approved`. A loan cannot be issued while the member's main `balance` is zero.

## savings_plans

`purposed_amount`, `status`. Submitted from Finance → Savings and listed in the operations
**Savings** tab. Approving writes `profiles.savings` and `profiles.monthly_gain`, and requires a
funded main balance.

## messages — member ↔ operator chat

One thread per member (`user_id`), each row carrying `sender_id`, `sender_role`, `body` and the
`read_by_user` / `read_by_admin` flags that drive the red unread blip on both dashboards. Realtime
is enabled on the table, so `/support` (member) and the operations chat sheet update live.

## profiles additions

`interest_rate` — weekly rate an operator sets per member in the operations **Users** tab.

## Fixed settlement details

`src/lib/treasury.ts` holds the constant Bitcoin settlement address used on Bank transfer (never
generated), the three transfer steps, and the endorsed bank / crypto / DeFi partner lists.
