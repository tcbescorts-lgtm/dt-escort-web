import Link from "next/link";
import { Confirm, LegalPage } from "@/components/Legal";
import { LEGAL, company, fullAddress } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Privacy Policy",
  description: "How D & T Escort Service LLC collects, uses, shares and deletes personal information.",
  path: "/privacy",
});

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains what personal information {company.legalName} (&quot;D &amp; T&quot;,
        &quot;we&quot;, &quot;us&quot;) collects through this website and our customer and driver
        portal, why we collect it, who we share it with, and how you can have it deleted.
      </p>

      <h2>Who we are</h2>
      <p>
        {company.legalName}, {fullAddress}. Email{" "}
        <a href={`mailto:${company.email}`}>{company.email}</a>, phone{" "}
        <a href={company.telHref}>{company.phoneDisplay}</a>.
      </p>

      <h2>What we collect and why</h2>
      <table>
        <thead>
          <tr><th scope="col">Where</th><th scope="col">What</th><th scope="col">Why</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Quote request form</td>
            <td>Name, phone, email, pickup, drop-off, date, and notes about the load</td>
            <td>To price the job, contact you about it, and arrange escorts if you book</td>
          </tr>
          <tr>
            <td>Careers form</td>
            <td>Name, phone, email, home state, certifications, notes</td>
            <td>To contact you about driving work</td>
          </tr>
          <tr>
            <td>Data deletion form</td>
            <td>Name, email, what to delete, details</td>
            <td>To verify and carry out your request</td>
          </tr>
          <tr>
            <td>Booked loads and invoices (customers)</td>
            <td>Company and contact names, phone, email, billing details, load and route details, truck driver contact</td>
            <td>To dispatch escorts, invoice, and collect payment</td>
          </tr>
          <tr>
            <td>Driver portal (our operators)</td>
            <td>Contact details, certifications, license and vehicle details, insurance, and the documents states and customers require; run sheets and pay records</td>
            <td>To meet state escort rules, assign loads, and pay drivers</td>
          </tr>
          <tr>
            <td>Phone calls and email</td>
            <td>Whatever you choose to tell us</td>
            <td>To answer you and handle the job</td>
          </tr>
        </tbody>
      </table>
      <p>
        We never ask for Social Security numbers through the website, and we never store payment card
        numbers. Card payments, if you choose to pay online, are handled by Stripe.
      </p>
      <p>
        Our website does not use analytics, advertising or tracking tools.
      </p>

      <h2>Who we share it with</h2>
      <p>We don&apos;t sell or rent personal information. We share it only with:</p>
      <ul>
        <li>The people involved in your move, such as the truck driver, carrier or broker, when it&apos;s needed to run the job.</li>
        <li>Service providers that process it for us:</li>
      </ul>
      <table>
        <thead>
          <tr><th scope="col">Provider</th><th scope="col">What they do for us</th></tr>
        </thead>
        <tbody>
          <tr><td>Web3Forms</td><td>Delivers website form submissions to our email</td></tr>
          <tr><td>Vercel</td><td>Hosts the website and portal</td></tr>
          <tr><td>Supabase</td><td>Database, sign-in and private file storage for the portal</td></tr>
          <tr><td>Resend</td><td>Sends invoices and portal notification emails</td></tr>
          <tr><td>Stripe</td><td>Processes online invoice payments</td></tr>
          <tr><td>Google (Maps)</td><td>Shows maps and route links, only after you accept optional cookies on the public site</td></tr>
          <tr><td>Google (Gmail)</td><td>Our business email inbox</td></tr>
        </tbody>
      </table>
      <p>We may also disclose information when the law requires it, or to protect people&apos;s safety.</p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Quote requests that don&apos;t become jobs: up to <Confirm>2 years</Confirm>, then deleted.</li>
        <li>Careers forms: up to <Confirm>1 year</Confirm> unless you start working with us.</li>
        <li>Load, invoice and payment records: as long as tax and accounting law requires (generally <Confirm>7 years</Confirm>).</li>
        <li>Driver files: while you drive with us and as long as afterward as the law requires.</li>
      </ul>

      <h2>Cookies</h2>
      <p>
        The site stores only your color mode and cookie choice in your browser. Optional Google Maps
        content loads only if you accept. See the <Link href="/cookie-policy">Cookie Policy</Link>.
      </p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>Ask what we have about you, or ask us to correct it, by emailing {company.email}.</li>
        <li>
          Ask us to delete it using the <Link href="/data-deletion">data deletion request form</Link>.
          We verify the request by email and finish within {LEGAL.deletionResponseDays} days. Records the
          law requires us to keep (like invoices) are kept only for that purpose.
        </li>
        <li>Opt out of non-essential emails with the unsubscribe link in any such email.</li>
      </ul>

      <h2>Security</h2>
      <p>
        We use encrypted connections, private file storage, role-based access in our portal, and
        audit logs for sensitive driver records. No system is perfectly secure; if a breach affects
        your information, we&apos;ll notify you as the law requires.
      </p>

      <h2>Children</h2>
      <p>Our services are for businesses and adults. We don&apos;t knowingly collect information from anyone under 18.</p>

      <h2>Changes</h2>
      <p>We&apos;ll post any changes here and update the date at the top.</p>

      <h2>Governing law and contact</h2>
      <p>
        This policy is governed by the laws of the State of Mississippi. Questions go to{" "}
        <a href={`mailto:${company.email}`}>{company.email}</a> or {company.legalName}, {fullAddress}.
      </p>
    </LegalPage>
  );
}
