import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, TrendingUp, HandCoins, ChevronRight, Landmark } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Why Column & Gable — Certified, Compounding, Credit" },
      {
        name: "description",
        content:
          "Three global certifications, 15–25% weekly compounding and instant member loans. See why members trust Column & Gable.",
      },
      { property: "og:title", content: "Why Column & Gable" },
      {
        property: "og:description",
        content: "Certified custody, weekly compounding and member loans in one app.",
      },
    ],
  }),
  component: Onboarding,
});

const SLIDES = [
  {
    key: "trust",
    kicker: "Certified",
    title: "Backed by three of the world's strictest regulators",
    body: "Independent custody, audited books and segregated client funds. Your capital never touches our balance sheet.",
    Icon: ShieldCheck,
    items: [
      { name: "SEC Registered Investment Adviser", body: "Securities & Exchange Commission — asset management and dealing." },
      { name: "FinCEN MSB Registration", body: "US Treasury registered money services & digital asset custody." },
      { name: "ISO/IEC 27001 + SOC 2 Type II", body: "Bank-grade information security, audited annually." },
    ],
  },
  {
    key: "partners",
    kicker: "Top 10 exchange partnerships",
    title: "In collaboration with the institutions that steer US GDP",
    body: "Column & Gable clears, custodies and settles alongside the largest monetary commission and the largest bank in the United States — the same rails that move the American economy.",
    Icon: Landmark,
    items: [
      {
        name: "U.S. Securities & Exchange Commission",
        body: "The biggest monetary commission in the world — our mandates are structured to SEC reporting standards.",
      },
      {
        name: "JPMorgan Chase",
        body: "America's largest bank by assets, controlling a decisive share of US GDP flows — our settlement partner.",
      },
      {
        name: "NYSE & Nasdaq access",
        body: "Direct routing into two of the world's top 10 financial exchanges.",
      },
    ],
  },
  {
    key: "growth",
    kicker: "Compounding",
    title: "15% – 25% compounded every single week",
    body: "Our managed strategies settle weekly. Every settlement is reinvested automatically unless you withdraw.",
    Icon: TrendingUp,
    items: [
      { name: "Conservative", body: "15% weekly target · capital-preservation first." },
      { name: "Balanced", body: "20% weekly target · the member favourite." },
      { name: "Aggressive", body: "25% weekly target · higher volatility, higher ceiling." },
    ],
  },
  {
    key: "loan",
    kicker: "Credit",
    title: "Borrow against your position, not your paycheck",
    body: "Members can draw a loan the moment their portfolio clears its first settlement. No employer letters, no credit bureau drama.",
    Icon: HandCoins,
    items: [
      { name: "Up to 70% LTV", body: "Borrow against invested balance." },
      { name: "Same-day release", body: "Approved to bank in under 4 hours." },
      { name: "No early-repayment fee", body: "Clear it whenever the wins land." },
    ],
  },
] as const;

function Onboarding() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const slide = SLIDES[i]!;
  const last = i === SLIDES.length - 1;
  const choice = picked[slide.key];

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pb-10 pt-14">
      <div key={slide.key} className="animate-rise flex-1">
        <div className="gold-surface mb-6 grid size-14 place-items-center rounded-2xl shadow-gold">
          <slide.Icon className="size-7" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{slide.kicker}</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight">{slide.title}</h1>
        <p className="mt-3 text-muted-foreground">{slide.body}</p>

        <ul className="mt-7 space-y-3">
          {slide.items.map((item) => {
            const active = choice === item.name;
            return (
              <li key={item.name}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPicked((p) => ({ ...p, [slide.key]: item.name }))}
                  className={
                    active
                      ? "w-full rounded-2xl border-2 border-primary bg-card p-4 text-left shadow-gold"
                      : "w-full rounded-2xl border border-border bg-card p-4 text-left"
                  }
                >
                  <p className="font-display font-bold">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                </button>
              </li>
            );
          })}
        </ul>
        {!choice && (
          <p className="mt-4 text-center text-xs text-muted-foreground">Select one option to continue.</p>
        )}
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex justify-center gap-2">
          {SLIDES.map((s, idx) => (
            <span
              key={s.key}
              className={
                idx === i ? "h-2 w-6 rounded-full bg-primary" : "h-2 w-2 rounded-full bg-border"
              }
            />
          ))}
        </div>
        {!choice ? null : last ? (
          <Link
            to="/signup"
            className="gold-surface flex h-14 w-full items-center justify-center rounded-full font-bold shadow-gold"
          >
            Create my account
          </Link>
        ) : (
          <button
            onClick={() => setI(i + 1)}
            className="gold-surface flex h-14 w-full items-center justify-center gap-1 rounded-full font-bold shadow-gold"
          >
            Continue <ChevronRight className="size-5" />
          </button>
        )}
        <Link to="/login" className="block text-center text-sm text-muted-foreground">
          I already have an account
        </Link>
      </div>
    </div>
  );
}
