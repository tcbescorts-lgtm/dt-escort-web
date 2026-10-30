import Link from "next/link";
import { Container } from "@/components/Blocks";
import { company } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <>
    <Header />
    <main id="main">
    <Container className="py-20 md:py-28">
      <p className="font-display text-7xl font-extrabold text-gold" aria-hidden="true">404</p>
      <h1 className="display-2 mt-2">This page isn&apos;t on the route</h1>
      <p className="lede mt-4">The link may be old or mistyped. Try one of these instead.</p>
      <ul className="mt-8 flex flex-wrap gap-3">
        <li><Link href="/" className="btn btn-line">Home</Link></li>
        <li><Link href="/services" className="btn btn-line">Services</Link></li>
        <li><Link href="/quote" className="btn btn-gold">Request a Quote</Link></li>
        <li><a href={company.telHref} className="btn btn-line">Call {company.phoneDisplay}</a></li>
      </ul>
    </Container>
    </main>
    <Footer />
    </>
  );
}
