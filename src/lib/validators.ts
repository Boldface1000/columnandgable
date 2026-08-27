import { z } from "zod";

/** Shared field validators for every form in the app. */

export const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "Email is required" })
  .email({ message: "Enter a valid email address" })
  .max(255, { message: "Email must be under 255 characters" });

export const passwordSchema = z
  .string()
  .min(6, { message: "Password must be at least 6 characters" })
  .max(72, { message: "Password must be under 72 characters" });

export const nicknameSchema = z
  .string()
  .trim()
  .min(2, { message: "Nickname must be at least 2 characters" })
  .max(40, { message: "Nickname must be under 40 characters" });

export const amountSchema = (min = 1) =>
  z
    .number({ invalid_type_error: "Enter an amount" })
    .positive({ message: "Amount must be greater than zero" })
    .min(min, { message: `Minimum is $${min}` })
    .max(1_000_000, { message: "Amount is too large" });

export const routingSchema = z
  .string()
  .regex(/^\d{9}$/, { message: "Routing number must be exactly 9 digits" });

export const accountNumberSchema = z
  .string()
  .regex(/^\d{6,17}$/, { message: "Account number must be 6–17 digits" });

/** Luhn check so obviously fake card numbers never reach the processor. */
export function luhn(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export const cardSchema = z.object({
  holder: z
    .string()
    .trim()
    .min(2, { message: "Cardholder name is required" })
    .max(80, { message: "Name is too long" }),
  number: z.string().refine(luhn, { message: "Card number failed verification" }),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: "Use MM/YY" })
    .refine((v) => {
      const [m, y] = v.split("/");
      const exp = new Date(2000 + Number(y), Number(m), 0, 23, 59, 59);
      return exp.getTime() > Date.now();
    }, { message: "Card has expired" }),
  cvc: z.string().regex(/^\d{3,4}$/, { message: "CVC must be 3 or 4 digits" }),
  brand: z.enum(["visa", "mastercard", "amex", "discover"], {
    errorMap: () => ({ message: "Select a card type" }),
  }),
  billing_address: z.string().trim().min(4, { message: "Billing address is required" }).max(160),
  billing_city: z.string().trim().min(2, { message: "City is required" }).max(60),
  billing_state: z.string().trim().min(2, { message: "State is required" }).max(40),
  postal_code: z.string().regex(/^\d{5}(-\d{4})?$/, { message: "Enter a valid ZIP code" }),
});

export type CardInput = z.infer<typeof cardSchema>;

export const bankTransferSchema = z.object({
  bankName: z.string().trim().min(2, { message: "Bank name is required" }).max(80),
  holder: z.string().trim().min(2, { message: "Account holder is required" }).max(80),
  routing: routingSchema,
  account: accountNumberSchema,
  amount: amountSchema(100),
});

export const withdrawSchema = (max: number) =>
  z.object({
    routing: routingSchema,
    recipient: accountNumberSchema,
    amount: amountSchema(10).max(max, { message: "Amount exceeds your available balance" }),
  });

/** Loose validation for BTC / ETH / TRON style deposit references. */
export const walletAddressSchema = z
  .string()
  .trim()
  .min(26, { message: "Enter the full wallet address" })
  .max(64, { message: "Wallet address is too long" })
  .regex(/^[a-zA-Z0-9]+$/, { message: "Wallet addresses are letters and numbers only" });

export const cryptoDepositSchema = z.object({
  asset: z.enum(["btc", "eth", "usdt"], {
    errorMap: () => ({ message: "Choose an asset" }),
  }),
  from: walletAddressSchema,
  amount: amountSchema(100),
});

/** Withdrawal payout to a member-supplied wallet — "other" requires a free-text asset name. */
export const withdrawCryptoSchema = (max: number) =>
  z
    .object({
      asset: z.enum(["usdt", "btc", "eth", "other"], {
        errorMap: () => ({ message: "Choose an asset" }),
      }),
      assetName: z.string().trim().max(40, { message: "Asset name is too long" }).optional(),
      address: walletAddressSchema,
      amount: amountSchema(10).max(max, { message: "Amount exceeds your available balance" }),
    })
    .refine((v) => v.asset !== "other" || (v.assetName?.trim().length ?? 0) >= 2, {
      message: "Enter the asset name",
      path: ["assetName"],
    });


/** Runs a zod schema and returns a field → message map for inline errors. */
export function collectErrors(schema: z.ZodTypeAny, value: unknown): Record<string, string> {
  const result = schema.safeParse(value);
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
