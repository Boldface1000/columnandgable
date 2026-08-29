import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

/** Sequences / repeats / obvious pins we warn users away from at creation time. */
const WEAK_PINS = new Set([
  "000000", "111111", "222222", "333333", "444444", "555555",
  "666666", "777777", "888888", "999999",
  "123456", "654321", "012345", "543210", "121212", "112233",
]);

export function isWeakPin(pin: string): boolean {
  if (WEAK_PINS.has(pin)) return true;
  // Any run of 3+ identical digits, or a straight ascending/descending run.
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

async function hashPin(pin: string, salt: string): Promise<string> {
  const key = (await scrypt(pin, salt, 64)) as Buffer;
  return key.toString("hex");
}

export async function createPinHash(pin: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16).toString("hex");
  const hash = await hashPin(pin, salt);
  return { hash, salt };
}

export async function pinMatches(pin: string, hash: string, salt: string): Promise<boolean> {
  const candidate = await hashPin(pin, salt);
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isLocked(lockedUntil: string | null): boolean {
  return Boolean(lockedUntil && new Date(lockedUntil).getTime() > Date.now());
}

export { MAX_FAILS, LOCK_MINUTES };
