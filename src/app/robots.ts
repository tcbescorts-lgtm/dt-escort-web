import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Preview deployments (VERCEL_ENV=preview) are kept out of search results.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/login", "/portal", "/driver", "/account", "/api", "/i/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
