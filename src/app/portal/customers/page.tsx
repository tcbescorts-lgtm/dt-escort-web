import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Empty, PageHead, Table } from "@/components/portal/ui";
import { PARTY, money } from "@/lib/format";

export const metadata = { title: "Customers" };

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff();
  const { q } = await searchParams;
  const sb = await supabaseServer();
  let query = sb.from("customers").select("id, company, contact_name, phone, email, type, payment_terms, quick_pay, qp_fee_pct, avg_days_to_pay, customer_rate_cards(per_mile, day_rate)").order("company");
  if (q) query = query.ilike("company", `%${q}%`);
  const { data } = await query;
  return (
    <>
      <PageHead title="Customers" sub="Saved companies and their rate cards. Rate cards fill in loads and run sheets." actions={<Link href="/portal/customers/new" className="btn btn-gold">Add customer</Link>} />
      <form role="search" className="mb-4 flex max-w-lg gap-2"><label htmlFor="cq" className="sr-only">Search customers</label><input id="cq" name="q" defaultValue={q} className="input" placeholder="Search by company" /><button className="btn btn-line">Search</button></form>
      {(data ?? []).length === 0 ? <Empty action={<Link href="/portal/customers/new" className="btn btn-gold">Add customer</Link>}>No customers yet. They&apos;re also created when you book a load.</Empty> : (
        <Table caption="Customers" head={["Company", "Type", "Contact", "Terms", "Quick pay", "Rates", "Avg. days to pay"]}>
          {(data ?? []).map((c: any) => (
            <tr key={c.id}>
              <td><Link href={`/portal/customers/${c.id}`} className="link font-semibold">{c.company}</Link></td>
              <td>{PARTY[c.type]}</td>
              <td>{[c.contact_name, c.phone].filter(Boolean).join(" · ")}<span className="block text-sm text-muted">{c.email}</span></td>
              <td>{c.payment_terms}</td>
              <td>{c.quick_pay === "yes" ? `Yes${c.qp_fee_pct ? ` (${c.qp_fee_pct}%)` : ""}` : c.quick_pay === "no" ? "No" : ""}</td>
              <td>{[c.customer_rate_cards?.per_mile && `${money(c.customer_rate_cards.per_mile)}/mi`, c.customer_rate_cards?.day_rate && `${money(c.customer_rate_cards.day_rate)}/day`].filter(Boolean).join(" · ")}</td>
              <td>{c.avg_days_to_pay ?? ""}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
