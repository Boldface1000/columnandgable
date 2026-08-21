import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, LineChart, Users, Settings } from "lucide-react";

const TABS = [
  { to: "/discover", label: "Discover", Icon: Compass },
  { to: "/finance", label: "Finance", Icon: LineChart },
  { to: "/social", label: "Social", Icon: Users },
  { to: "/settings", label: "Settings", Icon: Settings },
] as const;

export function BubbleNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-5">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-card/90 p-1.5 shadow-float backdrop-blur-xl">
        {TABS.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className={
                active
                  ? "gold-surface flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-gold transition-all"
                  : "flex items-center rounded-full px-3.5 py-2.5 text-muted-foreground transition-all hover:text-foreground"
              }
            >
              <Icon className="size-5 shrink-0" strokeWidth={active ? 2.4 : 2} />
              {active && <span className="whitespace-nowrap">{label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
