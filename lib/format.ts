import { format } from "date-fns";

export function formatSlot(iso: string): string {
  const d = new Date(iso);
  return format(d, "EEE d MMM · h:mm a");
}

export function formatLongSlot(iso: string): string {
  const d = new Date(iso);
  return format(d, "EEEE, d MMMM · h:mm a");
}

const currencySymbols: Record<string, string> = {
  INR: "₹",
  GBP: "£",
  USD: "$",
  AUD: "A$",
  NZD: "NZ$",
};

export function formatAmount(amount: number, currency: string): string {
  const symbol = currencySymbols[currency] ?? "";
  return `${symbol}${amount.toLocaleString()}`;
}
