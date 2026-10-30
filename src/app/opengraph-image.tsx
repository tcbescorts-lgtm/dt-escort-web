import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "D & T Escort Service: pilot car escorts for oversize loads in all 48 states. Dispatch 24/7.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const [font, logo] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/barlow-condensed-latin-800-normal.woff")),
    readFile(join(process.cwd(), "public/brand/dt-logo-nophone.png")),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "#0b0b0c", padding: 64, gap: 56, fontFamily: "Barlow Condensed" }}>
        <img src={logoSrc} width={380} height={380} alt="" />
        <div style={{ display: "flex", flexDirection: "column", color: "#f5f1e6" }}>
          <div style={{ fontSize: 84, lineHeight: 0.95 }}>Pilot car escorts for oversize loads</div>
          <div style={{ fontSize: 44, color: "#d4af37", marginTop: 28 }}>All 48 states · Dispatch 24/7</div>
          <div style={{ fontSize: 40, color: "#b9b4a6", marginTop: 16 }}>(601) 706-3404</div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Barlow Condensed", data: font, weight: 800, style: "normal" }] },
  );
}
