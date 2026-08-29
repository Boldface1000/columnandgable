export type Quote = { ticker: string; name: string; price: number; change: number };

type Entry = { ticker: string; name: string; symbol: string };

/** Top 100 US-listed companies by market capitalisation, plus the major digital assets. */
export const SYMBOLS: Entry[] = [
  { ticker: "NVDA", name: "NVIDIA", symbol: "NVDA" },
  { ticker: "AAPL", name: "Apple", symbol: "AAPL" },
  { ticker: "MSFT", name: "Microsoft", symbol: "MSFT" },
  { ticker: "GOOGL", name: "Alphabet", symbol: "GOOGL" },
  { ticker: "AMZN", name: "Amazon", symbol: "AMZN" },
  { ticker: "META", name: "Meta Platforms", symbol: "META" },
  { ticker: "AVGO", name: "Broadcom", symbol: "AVGO" },
  { ticker: "TSLA", name: "Tesla", symbol: "TSLA" },
  { ticker: "BRK.B", name: "Berkshire Hathaway", symbol: "BRK.B" },
  { ticker: "LLY", name: "Eli Lilly", symbol: "LLY" },
  { ticker: "JPM", name: "JPMorgan Chase", symbol: "JPM" },
  { ticker: "WMT", name: "Walmart", symbol: "WMT" },
  { ticker: "V", name: "Visa", symbol: "V" },
  { ticker: "XOM", name: "Exxon Mobil", symbol: "XOM" },
  { ticker: "UNH", name: "UnitedHealth", symbol: "UNH" },
  { ticker: "ORCL", name: "Oracle", symbol: "ORCL" },
  { ticker: "MA", name: "Mastercard", symbol: "MA" },
  { ticker: "COST", name: "Costco", symbol: "COST" },
  { ticker: "HD", name: "Home Depot", symbol: "HD" },
  { ticker: "PG", name: "Procter & Gamble", symbol: "PG" },
  { ticker: "NFLX", name: "Netflix", symbol: "NFLX" },
  { ticker: "JNJ", name: "Johnson & Johnson", symbol: "JNJ" },
  { ticker: "ABBV", name: "AbbVie", symbol: "ABBV" },
  { ticker: "BAC", name: "Bank of America", symbol: "BAC" },
  { ticker: "CRM", name: "Salesforce", symbol: "CRM" },
  { ticker: "CVX", name: "Chevron", symbol: "CVX" },
  { ticker: "KO", name: "Coca-Cola", symbol: "KO" },
  { ticker: "AMD", name: "Advanced Micro Devices", symbol: "AMD" },
  { ticker: "MRK", name: "Merck", symbol: "MRK" },
  { ticker: "PEP", name: "PepsiCo", symbol: "PEP" },
  { ticker: "TMO", name: "Thermo Fisher", symbol: "TMO" },
  { ticker: "WFC", name: "Wells Fargo", symbol: "WFC" },
  { ticker: "LIN", name: "Linde", symbol: "LIN" },
  { ticker: "CSCO", name: "Cisco", symbol: "CSCO" },
  { ticker: "ADBE", name: "Adobe", symbol: "ADBE" },
  { ticker: "ACN", name: "Accenture", symbol: "ACN" },
  { ticker: "MCD", name: "McDonald's", symbol: "MCD" },
  { ticker: "ABT", name: "Abbott", symbol: "ABT" },
  { ticker: "GE", name: "GE Aerospace", symbol: "GE" },
  { ticker: "NOW", name: "ServiceNow", symbol: "NOW" },
  { ticker: "IBM", name: "IBM", symbol: "IBM" },
  { ticker: "TXN", name: "Texas Instruments", symbol: "TXN" },
  { ticker: "DIS", name: "Walt Disney", symbol: "DIS" },
  { ticker: "PM", name: "Philip Morris", symbol: "PM" },
  { ticker: "QCOM", name: "Qualcomm", symbol: "QCOM" },
  { ticker: "CAT", name: "Caterpillar", symbol: "CAT" },
  { ticker: "INTU", name: "Intuit", symbol: "INTU" },
  { ticker: "GS", name: "Goldman Sachs", symbol: "GS" },
  { ticker: "VZ", name: "Verizon", symbol: "VZ" },
  { ticker: "DHR", name: "Danaher", symbol: "DHR" },
  { ticker: "AXP", name: "American Express", symbol: "AXP" },
  { ticker: "MS", name: "Morgan Stanley", symbol: "MS" },
  { ticker: "T", name: "AT&T", symbol: "T" },
  { ticker: "AMGN", name: "Amgen", symbol: "AMGN" },
  { ticker: "PFE", name: "Pfizer", symbol: "PFE" },
  { ticker: "RTX", name: "RTX", symbol: "RTX" },
  { ticker: "NEE", name: "NextEra Energy", symbol: "NEE" },
  { ticker: "SPGI", name: "S&P Global", symbol: "SPGI" },
  { ticker: "UBER", name: "Uber", symbol: "UBER" },
  { ticker: "LOW", name: "Lowe's", symbol: "LOW" },
  { ticker: "BKNG", name: "Booking Holdings", symbol: "BKNG" },
  { ticker: "HON", name: "Honeywell", symbol: "HON" },
  { ticker: "UNP", name: "Union Pacific", symbol: "UNP" },
  { ticker: "BLK", name: "BlackRock", symbol: "BLK" },
  { ticker: "PGR", name: "Progressive", symbol: "PGR" },
  { ticker: "COP", name: "ConocoPhillips", symbol: "COP" },
  { ticker: "ETN", name: "Eaton", symbol: "ETN" },
  { ticker: "SCHW", name: "Charles Schwab", symbol: "SCHW" },
  { ticker: "TJX", name: "TJX Companies", symbol: "TJX" },
  { ticker: "SYK", name: "Stryker", symbol: "SYK" },
  { ticker: "C", name: "Citigroup", symbol: "C" },
  { ticker: "BSX", name: "Boston Scientific", symbol: "BSX" },
  { ticker: "ADP", name: "ADP", symbol: "ADP" },
  { ticker: "PLTR", name: "Palantir", symbol: "PLTR" },
  { ticker: "VRTX", name: "Vertex Pharmaceuticals", symbol: "VRTX" },
  { ticker: "MU", name: "Micron Technology", symbol: "MU" },
  { ticker: "PANW", name: "Palo Alto Networks", symbol: "PANW" },
  { ticker: "FI", name: "Fiserv", symbol: "FI" },
  { ticker: "GILD", name: "Gilead Sciences", symbol: "GILD" },
  { ticker: "ADI", name: "Analog Devices", symbol: "ADI" },
  { ticker: "MDT", name: "Medtronic", symbol: "MDT" },
  { ticker: "LMT", name: "Lockheed Martin", symbol: "LMT" },
  { ticker: "DE", name: "Deere & Company", symbol: "DE" },
  { ticker: "BX", name: "Blackstone", symbol: "BX" },
  { ticker: "MMC", name: "Marsh & McLennan", symbol: "MMC" },
  { ticker: "CB", name: "Chubb", symbol: "CB" },
  { ticker: "SBUX", name: "Starbucks", symbol: "SBUX" },
  { ticker: "AMAT", name: "Applied Materials", symbol: "AMAT" },
  { ticker: "ANET", name: "Arista Networks", symbol: "ANET" },
  { ticker: "KKR", name: "KKR", symbol: "KKR" },
  { ticker: "PLD", name: "Prologis", symbol: "PLD" },
  { ticker: "INTC", name: "Intel", symbol: "INTC" },
  { ticker: "ELV", name: "Elevance Health", symbol: "ELV" },
  { ticker: "SO", name: "Southern Company", symbol: "SO" },
  { ticker: "CI", name: "Cigna", symbol: "CI" },
  { ticker: "NKE", name: "Nike", symbol: "NKE" },
  { ticker: "MDLZ", name: "Mondelez", symbol: "MDLZ" },
  { ticker: "DUK", name: "Duke Energy", symbol: "DUK" },
  { ticker: "UPS", name: "United Parcel Service", symbol: "UPS" },
  { ticker: "SHW", name: "Sherwin-Williams", symbol: "SHW" },
  { ticker: "NOC", name: "Northrop Grumman", symbol: "NOC" },
  { ticker: "TGT", name: "Target", symbol: "TGT" },
  { ticker: "MO", name: "Altria Group", symbol: "MO" },
  { ticker: "ITW", name: "Illinois Tool Works", symbol: "ITW" },
  { ticker: "APH", name: "Amphenol", symbol: "APH" },
  { ticker: "CMG", name: "Chipotle Mexican Grill", symbol: "CMG" },
  { ticker: "MMM", name: "3M", symbol: "MMM" },
  { ticker: "FDX", name: "FedEx", symbol: "FDX" },
  { ticker: "CME", name: "CME Group", symbol: "CME" },
  { ticker: "ICE", name: "Intercontinental Exchange", symbol: "ICE" },
  { ticker: "SNPS", name: "Synopsys", symbol: "SNPS" },
  { ticker: "CDNS", name: "Cadence Design Systems", symbol: "CDNS" },
  { ticker: "APD", name: "Air Products", symbol: "APD" },
  { ticker: "REGN", name: "Regeneron Pharmaceuticals", symbol: "REGN" },
  { ticker: "EQIX", name: "Equinix", symbol: "EQIX" },
  { ticker: "WM", name: "Waste Management", symbol: "WM" },
  { ticker: "CTAS", name: "Cintas", symbol: "CTAS" },
  { ticker: "AON", name: "Aon", symbol: "AON" },
  { ticker: "MCK", name: "McKesson", symbol: "MCK" },
  { ticker: "ROP", name: "Roper Technologies", symbol: "ROP" },
  { ticker: "PSA", name: "Public Storage", symbol: "PSA" },
  { ticker: "TT", name: "Trane Technologies", symbol: "TT" },
  { ticker: "MSI", name: "Motorola Solutions", symbol: "MSI" },
  { ticker: "COF", name: "Capital One", symbol: "COF" },
  { ticker: "AJG", name: "Arthur J. Gallagher", symbol: "AJG" },
  { ticker: "NSC", name: "Norfolk Southern", symbol: "NSC" },
  { ticker: "CL", name: "Colgate-Palmolive", symbol: "CL" },
  { ticker: "USB", name: "U.S. Bancorp", symbol: "USB" },
  { ticker: "EOG", name: "EOG Resources", symbol: "EOG" },
  { ticker: "ORLY", name: "O'Reilly Automotive", symbol: "ORLY" },
  { ticker: "MAR", name: "Marriott International", symbol: "MAR" },
  { ticker: "PYPL", name: "PayPal", symbol: "PYPL" },
  { ticker: "ABNB", name: "Airbnb", symbol: "ABNB" },
  { ticker: "SQ", name: "Block", symbol: "SQ" },
  { ticker: "SNOW", name: "Snowflake", symbol: "SNOW" },
  { ticker: "SHOP", name: "Shopify", symbol: "SHOP" },
  { ticker: "COIN", name: "Coinbase", symbol: "COIN" },
  { ticker: "DDOG", name: "Datadog", symbol: "DDOG" },
  { ticker: "CRWD", name: "CrowdStrike", symbol: "CRWD" },
  { ticker: "ZS", name: "Zscaler", symbol: "ZS" },
  { ticker: "MRNA", name: "Moderna", symbol: "MRNA" },
  { ticker: "F", name: "Ford Motor", symbol: "F" },
  { ticker: "GM", name: "General Motors", symbol: "GM" },
  { ticker: "DAL", name: "Delta Air Lines", symbol: "DAL" },
  { ticker: "BTC", name: "Bitcoin", symbol: "BINANCE:BTCUSDT" },
  { ticker: "ETH", name: "Ethereum", symbol: "BINANCE:ETHUSDT" },
  { ticker: "SOL", name: "Solana", symbol: "BINANCE:SOLUSDT" },
  { ticker: "XRP", name: "Ripple", symbol: "BINANCE:XRPUSDT" },
  { ticker: "ADA", name: "Cardano", symbol: "BINANCE:ADAUSDT" },
  { ticker: "DOGE", name: "Dogecoin", symbol: "BINANCE:DOGEUSDT" },
];

type Cached = { quote: Quote; at: number };

const cache = new Map<string, Cached>();

/** Finnhub's free tier allows ~60 calls a minute. At the default 20s poll
 * interval, staying under that budget caps us at REFRESH_PER_POLL ≈ 18
 * (18 * 3 polls/min = 54 calls/min, leaving headroom). With ~150 symbols
 * that means a full refresh cycle takes ~3 minutes — STALE_MS is set to
 * match, so we don't re-request a quote before it could plausibly have
 * changed. If you need tighter freshness across all 150+ tickers,
 * upgrade the Finnhub plan (raises the calls/minute ceiling) rather than
 * raising REFRESH_PER_POLL, or this will start silently dropping quotes
 * once Finnhub starts rate-limiting the requests. */
const REFRESH_PER_POLL = 18;
const STALE_MS = 180_000;

async function quoteFor(entry: Entry, key: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(entry.symbol)}&token=${key}`,
    );
    const json = (await res.json()) as { c?: number; dp?: number };
    if (!json.c) return null;
    return {
      ticker: entry.ticker,
      name: entry.name,
      price: +json.c.toFixed(2),
      change: +(json.dp ?? 0).toFixed(2),
    };
  } catch {
    return null;
  }
}

/** Live quotes straight from Finnhub — no demo data on this path. */
export async function fetchLiveQuotes(): Promise<Quote[]> {
  const key = process.env["FINNHUB_API_KEY"];
  if (!key) return [];
  const now = Date.now();

  const stale = SYMBOLS.filter((s) => {
    const hit = cache.get(s.ticker);
    return !hit || now - hit.at > STALE_MS;
  })
    .sort((a, b) => (cache.get(a.ticker)?.at ?? 0) - (cache.get(b.ticker)?.at ?? 0))
    .slice(0, REFRESH_PER_POLL);

  const fresh = await Promise.all(stale.map((s) => quoteFor(s, key)));
  fresh.forEach((q, i) => {
    const entry = stale[i]!;
    if (q) cache.set(entry.ticker, { quote: q, at: Date.now() });
    else cache.set(entry.ticker, { quote: cache.get(entry.ticker)?.quote ?? { ...entry, price: 0, change: 0 }, at: Date.now() });
  });

  return SYMBOLS.map((s) => cache.get(s.ticker)?.quote).filter(
    (q): q is Quote => q !== undefined && q.price > 0,
  );
}
