import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const paths: [string, number][] = [
  ["/", 1], ["/services", 0.9], ["/what-we-escort", 0.8], ["/coverage", 0.8], ["/quote", 0.9],
  ["/safety", 0.7], ["/how-it-works", 0.7], ["/about", 0.6], ["/faq", 0.6], ["/contact", 0.8],
  ["/careers", 0.5], ["/privacy", 0.3], ["/terms", 0.3], ["/refund-policy", 0.3],
  ["/cookie-policy", 0.3], ["/accessibility", 0.3], ["/data-deletion", 0.3],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-10-29");
  return paths.map(([p, priority]) => ({ url: `${SITE_URL}${p === "/" ? "" : p}`, lastModified, priority }));
}
