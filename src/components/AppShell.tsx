import { type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { BubbleNav } from "./BubbleNav";
import { FloatingMessageButton } from "./FloatingMessageButton";
import { useTheme } from "@/lib/theme";

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

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="animate-rise">
        {title && (
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/85 px-5 py-4 backdrop-blur-xl">
            <h1 className="font-display text-2xl font-extrabold">{title}</h1>
            <div className="flex items-center gap-2">
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
      <FloatingMessageButton />
    </div>
  );
}
