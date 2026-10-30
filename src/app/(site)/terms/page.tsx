import Link from "next/link";
import { Confirm, LegalPage } from "@/components/Legal";
import { company, fullAddress } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Terms of Service",
  description: "Terms for using the D & T Escort Service LLC website and booking escort services.",
  path: "/terms",
});

export default function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms cover your use of this website and the pilot car escort services provided by{" "}
        {company.legalName} (&quot;D &amp; T&quot;, &quot;we&quot;). By using the site or booking a
        job, you agree to them.
      </p>

      <h2>Our services</h2>
      <p>
        We provide pilot car and escort vehicle services for oversize and overweight loads: lead,
        chase, high pole, steer, 3rd car and route survey. We do not obtain permits, haul freight,
        or act as a carrier or broker.
      </p>

      <h2>Quotes and bookings</h2>
      <ul>
        <li>A quote is an estimate based on what you tell us. It becomes a booking when we confirm it with you by phone, text or email.</li>
        <li>Rates (per mile, day rate, overnight, no-go, mini run or flat rate) are agreed before the run and shown on the invoice.</li>
        <li>If the route, dimensions, dates or number of positions change, the price may change. We&apos;ll tell you before it does.</li>
      </ul>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Give us accurate load dimensions, weight, route and dates.</li>
        <li>Have valid permits for every state on the route and share their escort requirements with us.</li>
        <li>Make sure the truck and load are ready at the agreed time and place.</li>
        <li>Give us a working contact for the truck driver.</li>
      </ul>

      <h2>Safety decisions</h2>
      <p>
        Our escorts may stop or delay a move when weather, road conditions, traffic, or a problem with
        the load or permit makes it unsafe or unlawful to continue. Time lost for those reasons may be
        billed at the agreed day or overnight rate.
      </p>

      <h2>Payment</h2>
      <ul>
        <li>Invoices are due on the terms agreed for the job (for example, at drop-off, in two weeks, or other agreed terms).</li>
        <li>We accept ACH, Zelle and CashApp, and card or bank payment online through Stripe when a payment link is included.</li>
        <li>If you choose quick pay, the agreed quick pay fee is deducted from the invoice total.</li>
        <li>Late invoices may be subject to <Confirm>a late fee of 1.5% per month or the maximum allowed by law, whichever is less</Confirm>.</li>
      </ul>
      <p>Cancellations and no-go charges are covered in the <Link href="/refund-policy">Refund Policy</Link>.</p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent the law allows, we aren&apos;t liable for indirect or consequential losses, such
        as lost profits or delays to other shipments. Our total liability for any job is limited to{" "}
        <Confirm>the amount paid for that job</Confirm>, except where our insurance or the law provides otherwise.
        Escort vehicles do not take responsibility for the operation of the truck or the securement of the load.
      </p>

      <h2>Website use</h2>
      <p>
        Content on this site is general information about our services, not legal advice about state
        escort rules. Don&apos;t misuse the site or its forms, try to break its security, or submit
        false information.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the State of Mississippi. Any dispute will be handled
        in the state or federal courts located in <Confirm>Hinds County, Mississippi</Confirm>.
      </p>

      <h2>Contact</h2>
      <p>
        {company.legalName}, {fullAddress}.{" "}
        <a href={`mailto:${company.email}`}>{company.email}</a>, <a href={company.telHref}>{company.phoneDisplay}</a>.
      </p>
    </LegalPage>
  );
}
