export const money = (n: number | string | null | undefined) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n ?? 0));

export const num = (n: number | string | null | undefined, digits = 0) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(Number(n ?? 0));

export const date = (d: string | Date | null | undefined) => {
  if (!d) return "";
  const v = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + "T12:00:00") : new Date(d);
  return v.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const dateTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";

export const daysUntil = (d: string) => Math.ceil((new Date(d + "T12:00:00").getTime() - Date.now()) / 86_400_000);

export const LOAD_STATUS: Record<string, string> = {
  draft: "Draft", booked: "Booked", assigned: "Assigned", in_progress: "In progress", delivered: "Delivered",
  run_sheet_submitted: "Run sheet submitted", invoiced: "Invoiced", paid: "Paid", cancelled: "Cancelled",
};
export const LOAD_FLOW = ["draft", "booked", "assigned", "in_progress", "delivered", "run_sheet_submitted", "invoiced", "paid", "cancelled"];

export const DRIVER_STATUS: Record<string, string> = {
  needs_load: "Needs a load", on_load: "On a load", vacation: "On vacation", other: "Other",
};

export const POSITIONS: Record<string, string> = {
  lead: "Lead", chase: "Chase", high_pole: "High pole", steer: "Steer", route_survey: "Route survey", third_car: "3rd car",
};

export const INVOICE_STATUS: Record<string, string> = {
  draft: "Draft", sent: "Sent", delivered: "Delivered", viewed: "Viewed", failed: "Failed", partial: "Partial",
  paid: "Paid", overdue: "Overdue", void: "Void",
};

export const PARTY: Record<string, string> = { broker: "Broker", direct: "Direct company", other: "Other", not_set: "Not set" };

export const PAY_METHOD: Record<string, string> = {
  ach: "ACH", zelle: "Zelle", cashapp: "CashApp", check: "Check", stripe: "Card/bank (Stripe)", direct_deposit: "Direct deposit", other: "Other",
};

export function tone(status: string): "ok" | "bad" | "warn" | "neutral" | "active" {
  if (["paid", "approved", "delivered", "needs_load"].includes(status)) return "ok";
  if (["failed", "overdue", "cancelled", "void"].includes(status)) return "bad";
  if (["submitted", "run_sheet_submitted", "partial", "sent", "viewed", "invoiced"].includes(status)) return "warn";
  if (["assigned", "in_progress", "on_load", "booked"].includes(status)) return "active";
  return "neutral";
}

export function csv(rows: (string | number | null | undefined)[][]) {
  return rows
    .map((r) => r.map((c) => {
      const s = c == null ? "" : String(c);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(","))
    .join("\r\n");
}
