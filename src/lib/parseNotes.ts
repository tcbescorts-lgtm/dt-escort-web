/**
 * Deterministic parser for pasted booking notes (phone call notes, broker
 * emails, texts). It never saves anything: the Book a Load form shows the
 * result for review first. Returns form field names -> values.
 */
export type Parsed = Record<string, string | string[]>;

const KEYS: [RegExp, string][] = [
  [/^(company|broker|customer|shipper|carrier co(mpany)?|posted by)$/, "company"],
  [/^(contact|poc|point of contact|name|dispatcher|agent)$/, "contact_name"],
  [/^(phone|cell|contact (number|phone)|tel|number|ph)$/, "contact_phone"],
  [/^(e-?mail|contact email)$/, "contact_email"],
  [/^(invoice to|bill to|billing( company)?)$/, "invoice_company"],
  [/^(invoice e-?mail|billing e-?mail|send invoice to|invoices? to e-?mail)$/, "invoice_email"],
  [/^(pick ?up|pu|origin|from|load(ing)? at)$/, "pickup"],
  [/^(drop ?off|do|delivery|deliver(y)? to|destination|to|del)$/, "dropoff"],
  [/^(route|lane)$/, "route"],
  [/^(miles|mileage|est\.? miles|loaded miles|distance)$/, "est_miles"],
  [/^(date|load date|pu date|pickup date|start date|when)$/, "load_date"],
  [/^(empty at|empty|start(s)? from|deadhead from)$/, "empty_at"],
  [/^(order|order ?#|order no|load ?#|load no|ref|reference|po)$/, "order_no"],
  [/^(position|positions|escort|escorts|need(ed)?|car|cars)$/, "positions"],
  [/^(quick ?pay|qp)$/, "quick_pay"],
  [/^(qp fee|quick ?pay fee|qp %)$/, "qp_fee_pct"],
  [/^(payment terms|terms|pay terms)$/, "payment_terms"],
  [/^(paid by|payment method|pay(ment)? via|pay by)$/, "paid_by"],
  [/^(rate|rates|pay|price)$/, "rates"],
  [/^(per mile|rate per mile|ppm|\$\/mile)$/, "rate_per_mile"],
  [/^(day rate|daily|per day)$/, "rate_day"],
  [/^(overnight|o\/n|layover)$/, "rate_overnight"],
  [/^(no ?go|no-go|cancel(lation)?)$/, "rate_no_go"],
  [/^(mini|mini run|minimum)$/, "rate_mini"],
  [/^(flat|flat rate|total)$/, "rate_flat"],
  [/^(truck driver|driver name|trucker|truck contact|driver)$/, "truck_driver_name"],
  [/^(truck driver phone|driver phone|driver #|driver number)$/, "truck_driver_phone"],
  [/^(trucking co(mpany)?|carrier|hauler)$/, "trucking_company"],
  [/^(truck ?#|truck no|truck number|unit)$/, "truck_number"],
  [/^(pilot|escort driver|our driver|assigned)$/, "pilot"],
  [/^(height|ht|h)$/, "height"],
  [/^(width|wd|w|wide)$/, "width"],
  [/^(length|lg|l|long)$/, "length"],
  [/^(weight|wt|gross)$/, "weight"],
  [/^(dims|dimensions|size)$/, "dims"],
  [/^(notes|remarks|comments)$/, "remarks"],
];

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const MONEY = /\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/;

function positionsFrom(s: string): string[] {
  const t = s.toLowerCase();
  const out = new Set<string>();
  if (/\b(lead|front)\b/.test(t)) out.add("lead");
  if (/\b(chase|rear|back)\b/.test(t)) out.add("chase");
  if (/high ?pole|height ?pole|\bpole\b/.test(t)) out.add("high_pole");
  if (/\bsteer/.test(t)) out.add("steer");
  if (/route ?survey|survey/.test(t)) out.add("route_survey");
  if (/3rd|third/.test(t)) out.add("third_car");
  return [...out];
}

function toDate(s: string): string {
  const t = s.trim();
  let m = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = t.match(/(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/);
  if (m) {
    const now = new Date();
    let y = m[3] ? Number(m[3]) : now.getFullYear();
    if (y < 100) y += 2000;
    return `${y}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  m = t.toLowerCase().match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:,?\s*(\d{4}))?/);
  if (m) {
    const y = m[3] ? Number(m[3]) : new Date().getFullYear();
    return `${y}-${String(months.indexOf(m[1]) + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  if (/tomorrow/i.test(t)) return new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (/today/i.test(t)) return new Date().toISOString().slice(0, 10);
  return "";
}

function amount(s: string): string {
  const m = s.replace(/,/g, "").match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  return m ? m[1] : "";
}

function parseRates(s: string, out: Parsed) {
  const t = s.toLowerCase();
  const grab = (re: RegExp, key: string) => {
    const m = t.match(re);
    if (m && !out[key]) out[key] = m[1].replace(/,/g, "");
  };
  grab(/\$?\s*(\d+(?:\.\d+)?)\s*(?:\/|per|a)\s*(?:mi|mile)/, "rate_per_mile");
  grab(/(?:day ?rate|per day|\/day|a day)\D{0,6}\$?\s*(\d[\d,]*(?:\.\d+)?)|\$?\s*(\d[\d,]*(?:\.\d+)?)\s*(?:\/|per|a)\s*day/, "rate_day");
  if (!out.rate_day) { const m = t.match(/\$?\s*(\d[\d,]*(?:\.\d+)?)\s*(?:\/|per|a)\s*day/); if (m) out.rate_day = m[1].replace(/,/g, ""); }
  grab(/(?:overnight|o\/n|layover)\D{0,6}\$?\s*(\d[\d,]*(?:\.\d+)?)/, "rate_overnight");
  grab(/(?:no ?-?go)\D{0,6}\$?\s*(\d[\d,]*(?:\.\d+)?)/, "rate_no_go");
  grab(/(?:mini(?: run)?)\D{0,6}\$?\s*(\d[\d,]*(?:\.\d+)?)/, "rate_mini");
  grab(/(?:flat(?: rate)?|total)\D{0,6}\$?\s*(\d[\d,]*(?:\.\d+)?)/, "rate_flat");
}

const CITY = "[A-Z][a-zA-Z.'-]*(?:\\s[A-Z][a-zA-Z.'-]*){0,3},\\s*[A-Z]{2}\\b";
const CITY_ROUTE = new RegExp(`(${CITY})\\s*(?:to|->|→|–|—|-)\\s*(${CITY})`);

function splitRoute(s: string): [string, string] | null {
  const c = s.match(CITY_ROUTE);
  if (c) return [c[1].trim(), c[2].trim()];
  const m = s.match(/(.+?)\s+(?:to|->|→|–|—|-)\s+(.+)/i);
  return m ? [m[1].trim().replace(/^from\s+/i, ""), m[2].trim()] : null;
}

function dims(s: string, out: Parsed) {
  const t = s.toLowerCase();
  const pick = (re: RegExp, key: string) => {
    const m = s.match(re);
    if (m && !out[key]) out[key] = m[1].trim();
  };
  pick(/(?:height|ht|tall)\s*[:=]?\s*([\d'"’”.\s-]+(?:ft|feet|in)?)/i, "height");
  pick(/(?:width|wd|wide)\s*[:=]?\s*([\d'"’”.\s-]+(?:ft|feet|in)?)/i, "width");
  pick(/(?:length|lg|long)\s*[:=]?\s*([\d'"’”.\s-]+(?:ft|feet|in)?)/i, "length");
  pick(/(?:weight|wt|gross)\s*[:=]?\s*([\d,]+\s*(?:lbs?|#|pounds|k)?)/i, "weight");
  // "14'6 x 16' x 120'" style: H x W x L
  if (!out.height && /x/.test(t)) {
    const m = s.match(/(\d+['’][\d"”]*)\s*(?:h)?\s*x\s*(\d+['’][\d"”]*)\s*(?:w)?\s*x\s*(\d+['’][\d"”]*)/i);
    if (m) { out.height = m[1]; out.width = m[2]; out.length = m[3]; }
  }
}

export function parseBookingNotes(text: string): { fields: Parsed; matched: string[] } {
  const out: Parsed = {};
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const kv = line.match(/^([A-Za-z#$/ .'\-]{1,30}?)\s*[:=\-–]\s*(.+)$/);
    if (!kv) continue;
    const key = kv[1].trim().toLowerCase().replace(/\s+/g, " ");
    const val = kv[2].trim();
    const hit = KEYS.find(([re]) => re.test(key));
    if (!hit) continue;
    const f = hit[1];
    switch (f) {
      case "positions": out.positions = positionsFrom(val); break;
      case "route": {
        const r = splitRoute(val);
        if (r) { out.pickup ??= r[0]; out.dropoff ??= r[1]; }
        break;
      }
      case "rates": parseRates(val, out); break;
      case "est_miles": out.est_miles = val.replace(/,/g, "").match(/\d+(\.\d+)?/)?.[0] ?? ""; break;
      case "load_date": out.load_date = toDate(val); break;
      case "quick_pay": {
        const v = val.toLowerCase();
        out.quick_pay = /^(y|yes|true)/.test(v) ? "yes" : /^(n|no|false)/.test(v) ? "no" : "not_set";
        const pct = v.match(/(\d+(?:\.\d+)?)\s*%/);
        if (pct) out.qp_fee_pct = pct[1];
        break;
      }
      case "qp_fee_pct": out.qp_fee_pct = val.match(/\d+(\.\d+)?/)?.[0] ?? ""; break;
      case "contact_phone": case "truck_driver_phone": out[f] = val.match(PHONE)?.[0] ?? val; break;
      case "contact_email": case "invoice_email": out[f] = val.match(EMAIL)?.[0] ?? val; break;
      case "rate_per_mile": case "rate_day": case "rate_overnight": case "rate_no_go": case "rate_mini": case "rate_flat":
        out[f] = amount(val); break;
      case "paid_by": {
        const v = val.toLowerCase();
        out.paid_by = /cash ?app/.test(v) ? "cashapp" : /zelle/.test(v) ? "zelle" : /ach|deposit|direct/.test(v) ? "ach" : /check/.test(v) ? "check" : "other";
        break;
      }
      case "payment_terms": {
        const v = val.toLowerCase();
        out.payment_terms = /drop|delivery|cod/.test(v) ? "pay_at_drop" : /2 ?w|two w|14/.test(v) ? "2_weeks" : "custom";
        if (out.payment_terms === "custom") out.payment_terms_custom = val;
        break;
      }
      case "dims": dims(val, out); break;
      case "truck_driver_name": {
        out.truck_driver_name = val.replace(PHONE, "").replace(/[,;-]\s*$/, "").trim();
        const p = val.match(PHONE)?.[0];
        if (p) out.truck_driver_phone ??= p;
        break;
      }
      case "contact_name": {
        out.contact_name = val.replace(PHONE, "").replace(EMAIL, "").replace(/[,;|-]\s*$/, "").replace(/\s{2,}/g, " ").trim();
        const p = val.match(PHONE)?.[0];
        const e = val.match(EMAIL)?.[0];
        if (p) out.contact_phone ??= p;
        if (e) out.contact_email ??= e;
        break;
      }
      default: out[f] = val;
    }
  }

  // Fallbacks over the whole text.
  const all = text;
  if (!out.contact_email) { const e = all.match(EMAIL)?.[0]; if (e) out.contact_email = e; }
  if (!out.contact_phone) { const p = all.match(PHONE)?.[0]; if (p && p !== out.truck_driver_phone) out.contact_phone = p; }
  if (!out.pickup || !out.dropoff) {
    const c = all.match(CITY_ROUTE);
    if (c) { out.pickup ??= c[1].trim(); out.dropoff ??= c[2].trim(); }
  }
  if (!out.pickup || !out.dropoff) {
    for (const l of lines) {
      if (/:/.test(l) && !/route|lane/i.test(l)) continue;
      const r = splitRoute(l.replace(/^(route|lane)\s*[:=-]\s*/i, ""));
      if (r && /,|\b[A-Z]{2}\b/.test(l)) { out.pickup ??= r[0]; out.dropoff ??= r[1]; break; }
    }
  }
  if (!out.positions) { const p = positionsFrom(all); if (p.length) out.positions = p; }
  if (!out.est_miles) { const m = all.replace(/,/g, "").match(/(\d{2,5})\s*(?:loaded\s*)?mi(?:les)?\b/i); if (m) out.est_miles = m[1]; }
  if (!out.load_date) { const d = all.match(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}\b|\btomorrow\b|\btoday\b/i); if (d) out.load_date = toDate(d[0]); }
  if (!out.quick_pay && /quick ?pay|\bqp\b/i.test(all)) {
    out.quick_pay = /no (quick ?pay|qp)/i.test(all) ? "no" : "yes";
    const pct = all.match(/(?:qp|quick ?pay)[^\n%]{0,15}?(\d+(?:\.\d+)?)\s*%/i);
    if (pct) out.qp_fee_pct ??= pct[1];
  }
  parseRates(all, out);
  dims(all, out);
  void MONEY;

  for (const k of Object.keys(out)) if (out[k] === "" || (Array.isArray(out[k]) && !(out[k] as string[]).length)) delete out[k];
  return { fields: out, matched: Object.keys(out) };
}
