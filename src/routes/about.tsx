import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
const tradingBot = "https://placehold.co/800x600?text=Trading+Bot";


export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Column & Gable" },
      {
        name: "description",
        content:
          "Column & Gable is a next-generation investment house pairing youthful momentum with institutional trust: certified custody, weekly compounding and member credit.",
      },
      { property: "og:title", content: "About Column & Gable" },
      { property: "og:description", content: "Youthful momentum, institutional trust." },
    ],
  }),
  component: About,
});

function About() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur-xl">
        <button aria-label="Back" onClick={() => navigate({ to: "/settings" })}>
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="font-display text-xl font-bold">About</h1>
      </header>

      <div className="space-y-5 px-6 pt-6">
        <h2 className="font-display text-3xl font-black leading-tight">
          Youthful momentum. <span className="gold-text">Institutional trust.</span>
        </h2>
        <p className="text-muted-foreground">
          A column carries the weight. A gable crowns the house. We built an investment platform that does
          both — the discipline of a century-old firm with the speed a new generation expects.
        </p>

        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-display font-bold">The 25% interest programme</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Eligible deposits are allocated across our managed strategies and settle weekly. Conservative
            targets 15%, Balanced 20%, Aggressive 25%. Settlements reinvest automatically unless you
            withdraw. Targets are not guarantees; capital is at risk and past performance does not predict
            future results.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <img
            src={tradingBot}
            alt="Gold robotic arm tracing a rising trading chart, representing the Column & Gable trading bots"
            loading="lazy"
            width={1024}
            height={640}
            className="h-40 w-full object-cover"
          />
          <div className="p-5">
            <p className="font-display font-bold">The trading desk and our bots</p>
            <p className="mt-2 text-sm text-muted-foreground">
              A trading bot is software that reads the order book directly, prices an opportunity in
              microseconds and executes without hesitation, fatigue or ego. Ours never sleep: they run the
              same discipline at 3am on a Tuesday as they do at the opening bell.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              We have spent over <span className="font-semibold text-foreground">$40 million</span> on the
              infrastructure behind them — a 24-hour front desk in Boston staffed by execution traders and
              risk officers, co-located matching engines beside the exchanges in Secaucus and Chicago,
              redundant dark-fibre lines, and a research cluster retraining the models nightly on more than
              a decade of tick data.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Why that matters to your return: our edge is not a bigger bet, it is a faster and cheaper one.
              Bots capture spread on thousands of small, hedged positions a day, so the strategy earns from
              market <em>activity</em> rather than market direction. Slippage is measured in fractions of a
              cent, execution costs fall to roughly a tenth of a human desk, and profit is settled and
              compounded into your balance every week instead of once a quarter. That combination —
              relentless frequency, near-zero friction and weekly compounding — is how the 15–25% weekly
              target is engineered rather than promised. Risk is capped per strategy and positions are
              force-flattened when volatility bands break; capital is still at risk.
            </p>
          </div>
        </div>


        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-display font-bold">Licences &amp; certifications</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>SFC Type 1 &amp; 9 Licence — dealing and asset management</li>
            <li>FinCEN MSB Registration — US money services &amp; digital asset custody</li>
            <li>ISO/IEC 27001 &amp; SOC 2 Type II — audited annually</li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">Column &amp; Gable · v1.0.0</p>
      </div>
    </div>
  );
}
