import type { Metadata, Viewport } from "next";
import "./globals.css";
import { barlow, barlowCondensed } from "./fonts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CallBar from "@/components/CallBar";
import CookieBanner from "@/components/CookieBanner";
import { themeInitScript } from "@/components/ThemeToggle";
import { JsonLd, localBusinessLd } from "@/components/JsonLd";
import { SITE_URL, company } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${company.name} | Pilot Car and Oversize Load Escorts`,
    template: `%s | ${company.name}`,
  },
  description:
    "Pilot car and oversize load escort service based in Jackson, MS. Lead and chase escorts across all 48 contiguous states, dispatch 24/7.",
  applicationName: company.name,
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
    { media: "(prefers-color-scheme: light)", color: "#faf8f3" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <JsonLd data={localBusinessLd} />
      </head>
      <body>
        <a href="#main" className="skip-link">Skip to main content</a>
        <Header />
        <main id="main" tabIndex={-1} className="focus:outline-none">
          {children}
        </main>
        <Footer />
        <CallBar />
        <CookieBanner />
      </body>
    </html>
  );
}
