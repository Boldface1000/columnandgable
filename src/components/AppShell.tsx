import { type ReactNode } from "react";
import { Moon, Sun, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BubbleNav } from "./BubbleNav";
import { useTheme } from "@/lib/theme";
import { useUnreadCount } from "@/lib/app-state";

type Variant = "discover" | "finance" | "social" | "settings" | "plain";

export function AppShell({
  title,
  children,
}: {
  variant: Variant;
  title?: ReactNode;
  children: ReactNode;
}) {
  const { dark, toggle } = useTheme();
  const unread = useUnreadCount("user");

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="animate-rise">
        {title && (
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/85 px-5 py-4 backdrop-blur-xl">
            <h1 className="font-display text-2xl font-extrabold">{title}</h1>
            <div className="flex items-center gap-2">
              <Link
                to="/support"
                aria-label="Message the operations desk"
                className="relative grid size-10 place-items-center rounded-full border border-border bg-card text-primary"
              >
                <MessageCircle className="size-5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-destructive ring-2 ring-background" />
                )}
              </Link>
              <button
                onClick={toggle}
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                className="grid size-10 place-items-center rounded-full border border-border bg-card text-primary"
              >
                {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </button>
            </div>
          </header>
        )}
        <div className="px-5 pt-5">{children}</div>
      </div>
      <BubbleNav />
    </div>
  );
}
