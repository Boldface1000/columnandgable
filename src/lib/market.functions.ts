import { createServerFn } from "@tanstack/react-start";

export type Quote = { ticker: string; name: string; price: number; change: number };

export const getQuotes = createServerFn({ method: "GET" }).handler(async (): Promise<Quote[]> => {
  const { fetchLiveQuotes } = await import("@/lib/market.server");
  return fetchLiveQuotes();
});
