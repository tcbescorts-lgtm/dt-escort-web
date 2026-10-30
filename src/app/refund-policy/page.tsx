import { Confirm, LegalPage } from "@/components/Legal";
import { company } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Refund and Cancellation Policy",
  description: "Cancellations, no-go charges, billing disputes and refunds for D & T Escort Service LLC escort jobs.",
  path: "/refund-policy",
});

export default function Refund() {
  return (
    <LegalPage title="Refund and Cancellation Policy">
      <p>
        Escort work is a service performed on the road, so most charges are for time and miles already
        driven. This page explains when you&apos;re charged if plans change, and how billing problems
        are fixed.
      </p>

      <h2>Deposits</h2>
      <p><Confirm>We don&apos;t require a deposit for standard escort jobs.</Confirm></p>

      <h2>Cancelling a job</h2>
      <ul>
        <li>
          <strong>Before the escort leaves for the job:</strong> no charge if you cancel at least{" "}
          <Confirm>12 hours</Confirm> before the scheduled meet time.
        </li>
        <li>
          <strong>After the escort has left, or with less notice:</strong> a no-go charge at the rate agreed
          for the job, plus <Confirm>deadhead miles at the agreed per-mile rate</Confirm>.
        </li>
        <li>
          <strong>After the escort arrives:</strong> if the move doesn&apos;t happen (for example, the load
          isn&apos;t ready or the permit is wrong), the agreed no-go rate applies. If the escort has to stay
          overnight waiting, the overnight rate applies too.
        </li>
      </ul>

      <h2>Delays and stops for safety</h2>
      <p>
        If a move is delayed or stopped for weather, road conditions, or a problem with the truck, load or
        permit, time spent waiting is billed at the agreed day or overnight rate.
      </p>

      <h2>Billing errors and disputes</h2>
      <p>
        If something on an invoice looks wrong, email <a href={`mailto:${company.email}`}>{company.email}</a>{" "}
        within <Confirm>14 days</Confirm> of the invoice date with the invoice number and what you think is
        wrong. We&apos;ll check the run sheet and reply within <Confirm>5 business days</Confirm>. If we
        made a mistake, we&apos;ll issue a corrected invoice or refund the difference.
      </p>

      <h2>Refunds</h2>
      <ul>
        <li>Completed escort services aren&apos;t refundable, except to correct a billing error.</li>
        <li>Overpayments and duplicate payments are refunded in full.</li>
        <li>Refunds go back by the same method you paid with (ACH, Zelle, CashApp, or your card or bank through Stripe), usually within <Confirm>10 business days</Confirm>.</li>
        <li>Quick pay fees are not refunded once a quick pay invoice has been paid.</li>
      </ul>
    </LegalPage>
  );
}
