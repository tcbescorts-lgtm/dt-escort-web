import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-pdf loads its built-in fonts (pdfkit standard fonts) at runtime; ship them with the server functions.
  serverExternalPackages: ["@react-pdf/renderer", "pdfkit"],
  outputFileTracingIncludes: {
    "/**": ["./node_modules/pdfkit/js/standard-fonts/**/*", "./node_modules/pdfkit/js/data/**/*", "./public/brand/dt-logo-graygold.png"],
  },
};

export default nextConfig;
