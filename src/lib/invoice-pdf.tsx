import "server-only";
// pdfkit loads its built-in fonts through a package "imports" alias that Vercel's file tracer misses.
// Requiring them here by their public path makes sure the files ship with the server function.
import "pdfkit/standard-fonts/Helvetica";
import "pdfkit/standard-fonts/HelveticaBold";
import { Document, Page, StyleSheet, Text, View, Image, renderToBuffer } from "@react-pdf/renderer";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import QRCode from "qrcode";
import { company, SITE_URL } from "./site";
import { paymentLines, type PaymentInfo } from "./payment-info";

const INK = "#1a1a1a";
const MUTED = "#555555";
const GOLD = "#b8932a";
const BAND = "#151517";

const st = StyleSheet.create({
  page: { fontSize: 10, fontFamily: "Helvetica", color: INK, paddingBottom: 48 },
  band: { backgroundColor: BAND, paddingHorizontal: 36, paddingVertical: 22, flexDirection: "row", alignItems: "center" },
  bandText: { color: "#e6e6e6" },
  bandGold: { color: "#d4af37" },
  body: { paddingHorizontal: 36 },
  label: { fontSize: 8, fontFamily: "Helvetica-Bold", color: MUTED, letterSpacing: 0.6, marginBottom: 2 },
  row: { flexDirection: "row" },
  right: { textAlign: "right" },
  th: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 8.5, paddingVertical: 7, paddingHorizontal: 8 },
  td: { paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: "#d9d9d9" },
});

const money = (n: number | string) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n ?? 0));
const d = (v: string | null) => (v ? new Date(v + "T12:00:00").toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "");

export async function invoicePdf(inv: any, items: any[], load: any | null, pay: Partial<PaymentInfo> | null, legacyText?: string) {
  let logo: Buffer | null = null;
  try {
    logo = await readFile(join(process.cwd(), "public/brand/dt-logo-graygold.png"));
  } catch {}
  const balance = Number(inv.total) - Number(inv.amount_paid);
  const payUrl = inv.stripe_payment_link_url || `${SITE_URL}/i/${inv.public_token}`;
  const qr = await QRCode.toDataURL(payUrl, { margin: 0, width: 220 });
  const methods = paymentLines(pay);

  const doc = (
    <Document title={`Invoice ${inv.number}`} author={company.legalName}>
      <Page size="LETTER" style={st.page}>
        <View style={st.band}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
          {logo && <Image src={logo} style={{ width: 78, height: 78, marginRight: 16 }} />}
          <View style={{ flexGrow: 1 }}>
            <Text style={[st.bandText, { fontSize: 16, fontFamily: "Helvetica-Bold" }]}>{company.legalName}</Text>
            <Text style={[st.bandText, { marginTop: 4 }]}>Business number {company.phoneDisplay}</Text>
            <Text style={st.bandText}>{company.email}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={st.bandText}>{company.street}</Text>
            <Text style={st.bandText}>{company.city}, {company.region} {company.postalCode}</Text>
            <Text style={[st.bandGold, { marginTop: 4 }]}>{SITE_URL.replace(/^https?:\/\//, "")}</Text>
          </View>
        </View>
        <View style={{ height: 3, backgroundColor: GOLD }} />

        <View style={[st.body, st.row, { marginTop: 22, justifyContent: "space-between" }]}>
          <View style={{ width: "55%" }}>
            <Text style={st.label}>BILL TO</Text>
            <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold" }}>{inv.bill_to_name}</Text>
            {inv.bill_to_email && <Text style={{ marginTop: 3, color: MUTED }}>{inv.bill_to_email}</Text>}
            {load && (
              <View style={{ marginTop: 14 }}>
                <Text style={st.label}>LOAD</Text>
                <Text>{[load.order_no ? `Load ${load.order_no}` : load.load_no, load.trucking_company, load.truck_number && `Truck ${load.truck_number}`].filter(Boolean).join(" · ")}</Text>
                <Text style={{ color: MUTED }}>{load.pickup} to {load.dropoff}</Text>
              </View>
            )}
          </View>
          <View style={{ width: "40%", alignItems: "flex-end" }}>
            {[["INVOICE", inv.number], ["DATE", d(inv.issue_date)], ["DUE DATE", d(inv.due_date) || "On receipt"], ["BALANCE DUE", `USD ${money(balance)}`]].map(([k, v]) => (
              <View key={k} style={{ alignItems: "flex-end", marginBottom: 8 }}>
                <Text style={st.label}>{k}</Text>
                <Text style={k === "BALANCE DUE" ? { fontSize: 12, fontFamily: "Helvetica-Bold" } : {}}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[st.body, { marginTop: 14 }]}>
          <View style={[st.row, { backgroundColor: BAND }]}>
            <Text style={[st.th, { width: "52%" }]}>DESCRIPTION</Text>
            <Text style={[st.th, st.right, { width: "16%" }]}>RATE</Text>
            <Text style={[st.th, st.right, { width: "14%" }]}>QTY</Text>
            <Text style={[st.th, st.right, { width: "18%" }]}>AMOUNT</Text>
          </View>
          {items.map((it, i) => (
            <View key={i} style={st.row} wrap={false}>
              <Text style={[st.td, { width: "52%" }]}>{it.description}</Text>
              <Text style={[st.td, st.right, { width: "16%" }]}>{money(it.rate)}</Text>
              <Text style={[st.td, st.right, { width: "14%" }]}>{Number(it.qty)}</Text>
              <Text style={[st.td, st.right, { width: "18%" }]}>{money(it.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={[st.body, st.row, { marginTop: 18, justifyContent: "space-between" }]} wrap={false}>
          <View style={{ width: "52%" }}>
            <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>Payment info</Text>
            <View style={[st.row, { alignItems: "flex-start" }]}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
              <Image src={qr} style={{ width: 74, height: 74, marginRight: 10 }} />
              <Text style={{ color: MUTED, width: 150 }}>
                Scan to {inv.stripe_payment_link_url ? "pay online by card or bank" : "view this invoice online"}.
              </Text>
            </View>
            {(pay as any)?.online_fee_note ? <Text style={{ marginTop: 6, color: MUTED }}>{(pay as any).online_fee_note}</Text> : null}
            <Text style={[st.label, { marginTop: 12 }]}>PAYMENT INSTRUCTIONS</Text>
            <Text style={{ color: MUTED }}>Please pay by one of the following methods unless discussed otherwise.</Text>
            {methods.length === 0 && legacyText ? <Text style={{ marginTop: 6 }}>{legacyText}</Text> : null}
            {methods.map((m) => (
              <View key={m.label} style={{ marginTop: 8 }}>
                <Text style={st.label}>{m.label.toUpperCase()}</Text>
                {m.lines.map((l) => <Text key={l}>{l}</Text>)}
              </View>
            ))}
          </View>
          <View style={{ width: "42%" }}>
            <View style={[st.row, { justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: "#d9d9d9" }]}>
              <Text style={st.label}>TOTAL</Text><Text>{money(inv.total)}</Text>
            </View>
            {Number(inv.amount_paid) > 0 && (
              <View style={[st.row, { justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: "#d9d9d9" }]}>
                <Text style={st.label}>PAID</Text><Text>{money(inv.amount_paid)}</Text>
              </View>
            )}
            <View style={[st.row, { justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 6, backgroundColor: "#f6f1e2", borderTopWidth: 1.5, borderTopColor: GOLD }]}>
              <Text style={[st.label, { color: INK }]}>BALANCE DUE</Text>
              <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold" }}>USD {money(balance)}</Text>
            </View>
          </View>
        </View>

        {inv.notes && <Text style={[st.body, { marginTop: 14 }]}>{inv.notes}</Text>}
        <Text fixed style={{ position: "absolute", bottom: 22, left: 36, right: 36, fontSize: 8, color: MUTED, textAlign: "center" }}>
          {company.legalName} · {company.phoneDisplay} · {company.email} · Thank you for your business.
        </Text>
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
