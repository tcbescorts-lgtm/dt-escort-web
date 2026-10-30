import { PARTY, date, money } from "@/lib/format";

export type RunRow = {
  run_sheet_id: string; run_date: string; positions: string; location: string; load_total: number; driver_pay: number;
  gas: number; qp_fee: number; client_type: string | null; company: string | null; invoice_no: string | null; split_pct: number; load_no: string;
};

/** Mirrors the business's driver tracking sheet columns. */
export default function RunsTable({ rows, selectable, advances = 0, caption }: { rows: RunRow[]; selectable?: boolean; advances?: number; caption: string }) {
  const sum = (k: keyof RunRow) => rows.reduce((a, r) => a + Number(r[k] ?? 0), 0);
  const profit = (r: RunRow) => Number(r.load_total) - Number(r.driver_pay) - Number(r.gas) - Number(r.qp_fee);
  const subtotal = sum("driver_pay");
  return (
    <div className="overflow-x-auto rounded-md border border-rule">
      <table className="w-full min-w-[980px] text-left text-[0.95rem]">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-2">
          <tr>
            {selectable && <th scope="col" className="px-3 py-2"><span className="sr-only">Include</span></th>}
            {["Date", "Position", "Location", "Load total", "Paid to driver", "Gas", "QP fee", "Profit", "Client type", "Company", "Inv no."].map((h) => (
              <th key={h} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:border-t [&_td]:border-rule [&_td]:px-3 [&_td]:py-2">
          {rows.map((r) => (
            <tr key={r.run_sheet_id}>
              {selectable && <td><input type="checkbox" name="run_sheet_id" value={r.run_sheet_id} defaultChecked aria-label={`Include ${r.load_no}`} className="h-5 w-5 accent-[var(--gold-fill)]" /></td>}
              <td className="whitespace-nowrap">{date(r.run_date)}</td>
              <td className="capitalize">{r.positions?.replace(/_/g, " ")}</td>
              <td>{r.location}<span className="block text-sm text-muted">{r.load_no}</span></td>
              <td className="tabular-nums">{money(r.load_total)}</td>
              <td className="tabular-nums font-semibold">{money(r.driver_pay)}<span className="block text-sm font-normal text-muted">{r.split_pct}%</span></td>
              <td className="tabular-nums">{money(r.gas)}</td>
              <td className="tabular-nums">{money(r.qp_fee)}</td>
              <td className="tabular-nums">{money(profit(r))}</td>
              <td>{r.client_type ? PARTY[r.client_type] : ""}</td>
              <td>{r.company}</td>
              <td>{r.invoice_no}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-field font-semibold">
          <tr>
            {selectable && <td />}
            <th scope="row" colSpan={3} className="px-3 py-2 text-left">Total</th>
            <td className="px-3 tabular-nums">{money(sum("load_total"))}</td>
            <td className="px-3 tabular-nums">{money(subtotal)}</td>
            <td className="px-3 tabular-nums">{money(sum("gas"))}</td>
            <td className="px-3 tabular-nums">{money(sum("qp_fee"))}</td>
            <td className="px-3 tabular-nums">{money(rows.reduce((a, r) => a + profit(r), 0))}</td>
            <td colSpan={3} />
          </tr>
          <tr><td colSpan={selectable ? 5 : 4} /><th scope="row" className="px-3 py-1 text-left font-normal">Subtotal</th><td className="px-3 tabular-nums">{money(subtotal)}</td><td colSpan={5} /></tr>
          <tr><td colSpan={selectable ? 5 : 4} /><th scope="row" className="px-3 py-1 text-left font-normal">Cash advances</th><td className="px-3 tabular-nums">−{money(advances)}</td><td colSpan={5} /></tr>
          <tr><td colSpan={selectable ? 5 : 4} /><th scope="row" className="px-3 py-2 text-left">Due to driver</th><td className="px-3 text-lg tabular-nums">{money(subtotal - advances)}</td><td colSpan={5} /></tr>
        </tfoot>
      </table>
    </div>
  );
}
