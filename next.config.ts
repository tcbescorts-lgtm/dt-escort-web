import type { NextConfig } from "next";

const pdfFiles = ["./node_modules/pdfkit/js/standard-fonts/**/*", "./node_modules/pdfkit/js/data/**/*", "./public/brand/dt-logo-graygold.png"];

const nextConfig: NextConfig = {
  // react-pdf (pdfkit) loads its built-in fonts at runtime; ship them with every function that renders a PDF.
  outputFileTracingIncludes: {
    "/**": pdfFiles,
    "/portal/invoices/[id]/pdf": pdfFiles,
    "/portal/invoices/[id]": pdfFiles,
    "/i/[token]/pdf": pdfFiles,
  },
};

export default nextConfig;
