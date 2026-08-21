/**
 * Custody and settlement details shown on every funding screen.
 * Single source of truth so bank transfer, add money and digital assets agree.
 */
export const COMPANY_ACCOUNT = {
  beneficiary: "Column & Gable Custody LLC",
  bank: "State Street Bank & Trust",
  routing: "011000028",
  account: "8830042117",
  swift: "SBOSUS33",
  address: "One Federal Street, Boston, MA 02110",
} as const;

/** Why funds route through the custody account before a balance moves. */
export const WHY_COMPANY_ACCOUNT = [
  "Client money rules require deposits to land in a segregated custody account in the firm's name before they can be credited to you.",
  "Your 12-digit account ID is the reference that ties the wire to your profile — without it the custodian cannot match the funds.",
  "Compliance screens the sender against sanctions and AML checks; your dashboard balance updates the moment that clearance passes.",
] as const;

export const CRYPTO_TREASURY = {
  btc: "bc1qc0lumnandgable7x9v2m4kq8drt5s6ha3ypz4nq",
  eth: "0xC01A9bE7f3D2648e5aB0F91d7cE44b2a9F0D3E77",
  usdt: "TGa8vQyC0lumnGab1eR7xK9mP2sYdW4uNz",
} as const;

/** Exchange partners underwriting digital-asset settlement. */
export const EXCHANGE_PARTNERS = [
  { name: "Binance", role: "Liquidity & settlement partner" },
  { name: "Coinbase", role: "Qualified custody sponsor" },
  { name: "OKX", role: "Institutional market-making partner" },
] as const;

/**
 * Fixed settlement wallet used on the Bank transfer screen.
 * Deliberately a constant — never generated per session — so a member can
 * save it, reuse it and reconcile it against the custodian's statement.
 */
export const BTC_SETTLEMENT = {
  address: "bc1q7f4m2ke83qwv6h0ztd9r5xay2ncpj1lu4g8sd3",
  network: "Bitcoin · BTC (native SegWit)",
  name: "COLUMN & GABLE CUSTODY LLC",
  memo: "Your 12-digit account ID",
} as const;

/** Three simple steps, shown verbatim on the transfer screen. */
export const TRANSFER_STEPS = [
  "Copy the settlement address above — it is the only wallet Column & Gable credits deposits from.",
  "Open the bank, broker or exchange app you are funding from and paste it as the payout destination.",
  "Send the amount, then keep the transaction hash; your balance updates once the custodian confirms it.",
] as const;

/** Banking systems that clear Column & Gable settlements. */
export const BANK_PARTNERS = [
  { name: "JPMorgan Chase", domain: "chase.com" },
  { name: "Bank of America", domain: "bankofamerica.com" },
  { name: "Citibank", domain: "citi.com" },
  { name: "Wells Fargo", domain: "wellsfargo.com" },
  { name: "Goldman Sachs", domain: "goldmansachs.com" },
  { name: "Morgan Stanley", domain: "morganstanley.com" },
  { name: "HSBC", domain: "hsbc.com" },
  { name: "Barclays", domain: "barclays.co.uk" },
  { name: "BNP Paribas", domain: "bnpparibas.com" },
  { name: "State Street", domain: "statestreet.com" },
] as const;

/** Endorsed partners — custody wallets and DeFi venues. */
export const ENDORSED_PARTNERS = [
  { name: "Binance", domain: "binance.com", role: "Exchange" },
  { name: "Coinbase", domain: "coinbase.com", role: "Custody" },
  { name: "OKX", domain: "okx.com", role: "Exchange" },
  { name: "Kraken", domain: "kraken.com", role: "Exchange" },
  { name: "Ledger", domain: "ledger.com", role: "Wallet" },
  { name: "MetaMask", domain: "metamask.io", role: "Wallet" },
  { name: "Trust Wallet", domain: "trustwallet.com", role: "Wallet" },
  { name: "Uniswap", domain: "uniswap.org", role: "DeFi" },
  { name: "Aave", domain: "aave.com", role: "DeFi" },
  { name: "Curve", domain: "curve.fi", role: "DeFi" },
] as const;

export const logoUrl = (domain: string) => `https://logo.clearbit.com/${domain}`;
