import "server-only";
import { Document, Page, StyleSheet, Text, View, Image, renderToBuffer } from "@react-pdf/renderer";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { company, fullAddress, SITE_URL } from "./site";

const st = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  row: { flexDirection: "row" },
  h1: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  muted: { color: "#4a4a4a" },
  th: { fontFamily: "Helvetica-Bold", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  td: { paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: "#cfc8b8" },
  right: { textAlign: "right" },
  box: { borderWidth: 1, borderColor: "#cfc8b8", padding: 10, marginTop: 16 },
});

const money = (n: number | string) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n ?? 0));
const d = (v: string | null) => (v ? new Date(v + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

export async function invoicePdf(inv: any, items: any[], load: any | null, paymentText: string) {
  let logo: Buffer | null = null;
  try {
    logo = await readFile(join(process.cwd(), "public/brand/dt-logo-graygold.png"));
  } catch {}
  const balance = Number(inv.total) - Number(inv.amount_paid);
  const doc = (
    <Document title={`Invoice ${inv.number}`} author={company.legalName}>
      <Page size="LETTER" style={st.page}>
        <View style={[st.row, { justifyContent: "space-between", alignItems: "flex-start" }]}>
          <View style={st.row}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
            {logo && <Image src={logo} style={{ width: 64, height: 64, marginRight: 12 }} />}
            <View>
              <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold" }}>{company.legalName}</Text>
              <Text style={st.muted}>{fullAddress}</Text>
              <Text style={st.muted}>{company.phoneDisplay} · {company.email}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={st.h1}>INVOICE</Text>
            <Text>{inv.number}</Text>
            <Text style={st.muted}>Issued {d(inv.issue_date)}</Text>
            {inv.due_date && <Text style={st.muted}>Due {d(inv.due_date)}</Text>}
          </View>
        </View>

        <View style={[st.row, { marginTop: 24, justifyContent: "space-between" }]}>
          <View style={{ width: "48%" }}>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>Bill to</Text>
            <Text>{inv.bill_to_name}</Text>
            {inv.bill_to_email && <Text style={st.muted}>{inv.bill_to_email}</Text>}
          </View>
          {load && (
            <View style={{ width: "48%" }}>
              <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>Load</Text>
              <Text>{load.load_no}{load.order_no ? ` · Order ${load.order_no}` : ""}</Text>
              <Text style={st.muted}>{load.pickup} to {load.dropoff}</Text>
              <Text style={st.muted}>{[load.trucking_company, load.truck_number && `Truck ${load.truck_number}`].filter(Boolean).join(" · ")}</Text>
            </View>
          )}
        </View>

        <View style={{ marginTop: 20 }}>
          <View style={st.row}>
            <Text style={[st.th, { width: "50%" }]}>Description</Text>
            <Text style={[st.th, st.right, { width: "15%" }]}>Qty</Text>
            <Text style={[st.th, st.right, { width: "15%" }]}>Rate</Text>
            <Text style={[st.th, st.right, { width: "20%" }]}>Amount</Text>
          </View>
          {items.map((it, i) => (
            <View key={i} style={st.row} wrap={false}>
              <Text style={[st.td, { width: "50%" }]}>{it.description}</Text>
              <Text style={[st.td, st.right, { width: "15%" }]}>{Number(it.qty)}</Text>
              <Text style={[st.td, st.right, { width: "15%" }]}>{money(it.rate)}</Text>
              <Text style={[st.td, st.right, { width: "20%" }]}>{money(it.amount)}</Text>
            </View>
          ))}
          <View style={[st.row, { justifyContent: "flex-end", marginTop: 8 }]}>
            <View style={{ width: "40%" }}>
              <View style={[st.row, { justifyContent: "space-between", paddingVertical: 2 }]}><Text>Total</Text><Text style={{ fontFamily: "Helvetica-Bold" }}>{money(inv.total)}</Text></View>
              {Number(inv.amount_paid) > 0 && <View style={[st.row, { justifyContent: "space-between", paddingVertical: 2 }]}><Text>Paid</Text><Text>{money(inv.amount_paid)}</Text></View>}
              <View style={[st.row, { justifyContent: "space-between", paddingVertical: 4, borderTopWidth: 1, borderTopColor: "#1a1a1a", marginTop: 4 }]}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Balance due</Text><Text style={{ fontFamily: "Helvetica-Bold" }}>{money(balance)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={st.box}>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>How to pay</Text>
          <Text>{paymentText}</Text>
          {inv.stripe_payment_link_url && <Text style={{ marginTop: 4 }}>Pay online by card or bank: {inv.stripe_payment_link_url}</Text>}
          <Text style={{ marginTop: 4 }}>View this invoice online: {SITE_URL}/i/{inv.public_token}</Text>
        </View>
        {inv.notes && <Text style={{ marginTop: 12 }}>{inv.notes}</Text>}
        <Text style={[st.muted, { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, textAlign: "center" }]}>
          {company.legalName} · {fullAddress} · Thank you for your business.
        </Text>
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
