import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CallBar from "@/components/CallBar";
import CookieBanner from "@/components/CookieBanner";
import { JsonLd, localBusinessLd } from "@/components/JsonLd";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={localBusinessLd} />
      <Header />
      <main id="main" tabIndex={-1} className="pb-16 focus:outline-none has-[>.flush-end:last-child]:pb-0">
        {children}
      </main>
      <Footer />
      <CallBar />
      <CookieBanner />
    </>
  );
}
