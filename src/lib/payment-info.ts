export type PaymentInfo = {
  zelle: string; cashapp: string; check_payable: string; check_mail: string;
  ach_bank: string; ach_routing: string; ach_account: string; ach_name: string;
  online_fee_note: string; other: string;
};

export const EMPTY_PAYMENT_INFO: PaymentInfo = {
  zelle: "", cashapp: "", check_payable: "D & T Escort Service LLC", check_mail: "3897 I-55 S, Jackson, MS 39212",
  ach_bank: "", ach_routing: "", ach_account: "", ach_name: "D & T Escort Service LLC", online_fee_note: "", other: "",
};

/** Payment methods as label/value pairs, skipping anything not filled in. */
export function paymentLines(p: Partial<PaymentInfo> | null | undefined): { label: string; lines: string[] }[] {
  const v = { ...EMPTY_PAYMENT_INFO, ...(p ?? {}) };
  const out: { label: string; lines: string[] }[] = [];
  if (v.zelle) out.push({ label: "Zelle", lines: [v.zelle] });
  if (v.cashapp) out.push({ label: "Cash App", lines: [v.cashapp] });
  if (v.ach_bank || v.ach_routing || v.ach_account)
    out.push({ label: "ACH / bank transfer", lines: [v.ach_name && `Account name: ${v.ach_name}`, v.ach_bank && `Bank: ${v.ach_bank}`, v.ach_routing && `Routing number: ${v.ach_routing}`, v.ach_account && `Account number: ${v.ach_account}`].filter(Boolean) as string[] });
  if (v.check_payable) out.push({ label: "By check", lines: [`Payable to ${v.check_payable}`, v.check_mail && `Mail to ${v.check_mail}`].filter(Boolean) as string[] });
  if (v.other) out.push({ label: "Other", lines: v.other.split(/\r?\n/).filter(Boolean) });
  return out;
}

/** Customer-facing service line, e.g. "Pilot Car Service (Chase)". */
export function serviceLabel(positions: string[] | null | undefined) {
  const names: Record<string, string> = { lead: "Lead", chase: "Chase", high_pole: "High Pole", steer: "Steer", route_survey: "Route Survey", third_car: "3rd Car" };
  const p = (positions ?? []).map((x) => names[x] ?? x).join(", ");
  return `Pilot Car Service${p ? ` (${p})` : ""}`;
}
