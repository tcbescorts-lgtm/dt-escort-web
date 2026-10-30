import { LegalPage } from "@/components/Legal";
import CookieSettingsLink from "@/components/CookieSettingsLink";
import { company } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Cookie Policy",
  description: "The cookies and browser storage the D & T Escort Service website uses, and how to change your choice.",
  path: "/cookie-policy",
});

export default function CookiePolicy() {
  return (
    <LegalPage title="Cookie Policy">
      <p>
        We keep this short because we use very little. There are no analytics, advertising or tracking
        tools on this site.
      </p>

      <h2>Always on (needed for the site to work)</h2>
      <table>
        <thead>
          <tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Purpose</th><th scope="col">Kept for</th></tr>
        </thead>
        <tbody>
          <tr><td>dt-theme</td><td>Browser storage</td><td>Remembers dark or light mode</td><td>Until you clear it</td></tr>
          <tr><td>dt-consent</td><td>Browser storage</td><td>Remembers your cookie choice</td><td>Until you clear it or we change this policy</td></tr>
          <tr><td>Portal sign-in cookies (sb-*)</td><td>Cookie</td><td>Keep staff, drivers and customers signed in to the portal. Set only when you sign in.</td><td>Your session</td></tr>
        </tbody>
      </table>

      <h2>Optional (only if you click Accept)</h2>
      <table>
        <thead>
          <tr><th scope="col">Provider</th><th scope="col">Where</th><th scope="col">Purpose</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Google Maps</td>
            <td>Map on the Contact page</td>
            <td>Shows our location. Google may set its own cookies; see Google&apos;s privacy policy.</td>
          </tr>
        </tbody>
      </table>
      <p>
        If you close the cookie notice with the X, that counts as declining: the optional items above
        never load, and you&apos;ll see a plain &quot;Open in Google Maps&quot; link instead.
      </p>

      <h2>Changing your choice</h2>
      <p>
        Use <CookieSettingsLink /> (also in the footer of every page) to accept or decline at any time.
        You can also clear site data in your browser.
      </p>

      <h2>Contact</h2>
      <p><a href={`mailto:${company.email}`}>{company.email}</a></p>
    </LegalPage>
  );
}
