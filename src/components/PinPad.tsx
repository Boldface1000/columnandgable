import { useState } from "react";
import { Delete } from "lucide-react";

const WEAK_PINS = new Set([
  "000000", "111111", "222222", "333333", "444444", "555555",
  "666666", "777777", "888888", "999999",
  "123456", "654321", "012345", "543210", "121212", "112233",
]);

/** Client-side heuristic mirror of the server check — used only to warn
 * as the user types, never as the source of truth (the server re-checks). */
export function looksWeak(pin: string): boolean {
  if (pin.length < 6) return false;
  if (WEAK_PINS.has(pin)) return true;
  const digits = pin.split("").map(Number);
  const allSame = digits.every((d) => d === digits[0]);
  if (allSame) return true;
  let ascending = true;
  let descending = true;
  for (let i = 1; i < digits.length; i++) {
    if (digits[i] !== digits[i - 1]! + 1) ascending = false;
    if (digits[i] !== digits[i - 1]! - 1) descending = false;
  }
  return ascending || descending;
}

export function PinPad({
  value,
  onChange,
  error,
  warnIfWeak = false,
}: {
  value: string;
  onChange: (next: string) => void;
  error?: string | null;
  /** Show a red "pick something memorable" warning once 6 weak digits are entered (create-pin flow only). */
  warnIfWeak?: boolean;
}) {
  const weak = warnIfWeak && looksWeak(value);

  const press = (d: string) => {
    if (value.length >= 6) return;
    onChange(value + d);
  };
  const backspace = () => onChange(value.slice(0, -1));

  return (
    <div className="mx-auto w-full max-w-xs">
      <div className="flex justify-center gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            className={
              "size-3.5 rounded-full border-2 " +
              (i < value.length
                ? weak
                  ? "border-destructive bg-destructive"
                  : "border-primary bg-primary"
                : "border-border bg-transparent")
            }
          />
        ))}
      </div>

      {weak && (
        <p className="mt-3 text-center text-xs font-semibold text-destructive">
          That PIN is easy to guess — pick a sequence only you would remember, not a
          repeat or a straight run of digits.
        </p>
      )}
      {!weak && error && (
        <p className="mt-3 text-center text-xs font-semibold text-destructive">{error}</p>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => press(d)}
            className="rounded-2xl border border-border bg-card py-4 font-display text-xl font-bold active:scale-95"
          >
            {d}
          </button>
        ))}
        <span />
        <button
          type="button"
          onClick={() => press("0")}
          className="rounded-2xl border border-border bg-card py-4 font-display text-xl font-bold active:scale-95"
        >
          0
        </button>
        <button
          type="button"
          aria-label="Backspace"
          onClick={backspace}
          className="grid place-items-center rounded-2xl border border-border bg-card py-4 active:scale-95"
        >
          <Delete className="size-5" />
        </button>
      </div>
    </div>
  );
}

/** Local (non-hook) helper so callers can reset input state easily. */
export function usePinInput() {
  const [pin, setPin] = useState("");
  return { pin, setPin, reset: () => setPin("") };
}
