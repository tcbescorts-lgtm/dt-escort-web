import { Confirm, LegalPage } from "@/components/Legal";
import { company } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Accessibility Statement",
  description: "D & T Escort Service's commitment to an accessible website and how to report a problem.",
  path: "/accessibility",
});

export default function Accessibility() {
  return (
    <LegalPage title="Accessibility Statement">
      <p>
        We want everyone to be able to use this website and our portal, including people who use
        screen readers, keyboards, magnification or voice control.
      </p>

      <h2>Our target</h2>
      <p>We build to the Web Content Accessibility Guidelines (WCAG) 2.2, level AA.</p>

      <h2>What we&apos;ve done</h2>
      <ul>
        <li>Text and controls meet AA color contrast in both dark and light mode; we check every color pairing with a script.</li>
        <li>Everything works with a keyboard, focus is always visible, and a &quot;Skip to main content&quot; link is first on every page.</li>
        <li>Forms have visible labels, required fields are marked, and errors are listed at the top and next to each field.</li>
        <li>Buttons and links are at least 44 pixels tall for touch.</li>
        <li>Animation is minimal and turns off if your device asks for reduced motion.</li>
        <li>Pages use one main heading and a logical heading order.</li>
      </ul>

      <h2>Known limitations</h2>
      <ul>
        <li>Our logo is an image with small text. Its text alternative describes it.</li>
        <li>The Google map on the Contact page is third-party content; the address is always given as text too.</li>
      </ul>

      <h2>Report a problem</h2>
      <p>
        If something doesn&apos;t work for you, email <a href={`mailto:${company.email}`}>{company.email}</a> or
        call <a href={company.telHref}>{company.phoneDisplay}</a>. Tell us the page and what happened.
        We&apos;ll reply within <Confirm>5 business days</Confirm> and can give you the information in another way in
        the meantime.
      </p>
    </LegalPage>
  );
}
