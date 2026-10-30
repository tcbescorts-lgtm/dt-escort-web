/** Run sheet pay math, shared by the driver form, admin review and the server. */
export type Leg = { charged_as: "miles" | "day_rate" | "mini" | "no_go"; overnight: boolean; miles: number | string };
export type Rates = { per_mile?: number | string | null; day?: number | string | null; mini?: number | string | null; overnight?: number | string | null; no_go?: number | string | null };

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const r2 = (v: number) => Math.round(v * 100) / 100;

export function computeRunSheet(legs: Leg[], rates: Rates, gas: number | string, includeGas: boolean) {
  const miles = legs.filter((l) => l.charged_as === "miles").reduce((a, l) => a + n(l.miles), 0);
  const days = legs.filter((l) => l.charged_as === "day_rate").length;
  const minis = legs.filter((l) => l.charged_as === "mini").length;
  const nogos = legs.filter((l) => l.charged_as === "no_go").length;
  const nights = legs.filter((l) => l.overnight).length;
  const lines = {
    mileage: { qty: r2(miles), rate: n(rates.per_mile), amount: r2(miles * n(rates.per_mile)) },
    day: { qty: days, rate: n(rates.day), amount: r2(days * n(rates.day)) },
    mini: { qty: minis, rate: n(rates.mini), amount: r2(minis * n(rates.mini)) },
    overnight: { qty: nights, rate: n(rates.overnight), amount: r2(nights * n(rates.overnight)) },
    no_go: { qty: nogos, rate: n(rates.no_go), amount: r2(nogos * n(rates.no_go)) },
    gas: { qty: 1, rate: n(gas), amount: includeGas ? r2(n(gas)) : 0 },
  };
  const total = r2(Object.values(lines).reduce((a, l) => a + l.amount, 0));
  return { miles: r2(miles), days, minis, nogos, nights, lines, total };
}

/** Driver-runs math from the business's tracking sheet. */
export function driverPay(loadTotal: number, qpPct: number | null, quickPay: boolean, gas: number, splitPct: number) {
  const qp = quickPay ? r2((loadTotal * (qpPct ?? 0)) / 100) : 0;
  const pay = r2(((loadTotal - qp - gas) * splitPct) / 100);
  return { qp, pay, profit: r2(loadTotal - pay - gas - qp) };
}
