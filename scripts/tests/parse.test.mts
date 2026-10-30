import { parseBookingNotes } from "../../src/lib/parseNotes.ts";
import assert from "node:assert/strict";

const a = parseBookingNotes(`Company: Sample Heavy Haul LLC
Contact: Pat Example 601-555-0100 pat@example.com
Route: Jackson, MS to Houston, TX
Miles: 430
Date: 11/5/2026
Position: Chase and high pole
Quick pay: yes 5%
Rate: $2.00/mile, day rate $800, overnight 125, no-go 250
Payment terms: 2 weeks
Paid by: Zelle
Truck driver: Sam Driver (601) 555-0111
Truck #: 42
Order #: PO-7781
Dims: 14'6 x 16' x 120'
Weight: 180,000 lbs`);
const f = a.fields;
assert.equal(f.company, "Sample Heavy Haul LLC");
assert.equal(f.contact_name, "Pat Example");
assert.equal(f.contact_phone, "601-555-0100");
assert.equal(f.contact_email, "pat@example.com");
assert.equal(f.pickup, "Jackson, MS"); assert.equal(f.dropoff, "Houston, TX");
assert.equal(f.est_miles, "430"); assert.equal(f.load_date, "2026-11-05");
assert.deepEqual(f.positions, ["chase", "high_pole"]);
assert.equal(f.quick_pay, "yes"); assert.equal(f.qp_fee_pct, "5");
assert.equal(f.rate_per_mile, "2.00"); assert.equal(f.rate_day, "800"); assert.equal(f.rate_overnight, "125"); assert.equal(f.rate_no_go, "250");
assert.equal(f.payment_terms, "2_weeks"); assert.equal(f.paid_by, "zelle");
assert.equal(f.truck_driver_name, "Sam Driver"); assert.equal(f.truck_driver_phone, "(601) 555-0111");
assert.equal(f.truck_number, "42"); assert.equal(f.order_no, "PO-7781");
assert.equal(f.height, "14'6"); assert.equal(f.width, "16'"); assert.equal(f.length, "120'");
assert.match(String(f.weight), /180,000/);

// Free-form note
const b = parseBookingNotes("ABC broker called, need lead car Mobile, AL to Dallas, TX 11/12, 560 miles, $1.85 per mile, no-go $300, QP 3%. contact jo@abc.co 251-555-0199");
assert.equal(b.fields.pickup, "Mobile, AL"); assert.equal(b.fields.dropoff, "Dallas, TX");
assert.deepEqual(b.fields.positions, ["lead"]);
assert.equal(b.fields.est_miles, "560"); assert.equal(b.fields.rate_per_mile, "1.85"); assert.equal(b.fields.rate_no_go, "300");
assert.equal(b.fields.contact_email, "jo@abc.co"); assert.equal(b.fields.qp_fee_pct, "3"); assert.equal(b.fields.quick_pay, "yes");
console.log("free-form pickup:", b.fields.pickup, "| dropoff:", b.fields.dropoff, "| date:", b.fields.load_date);
console.log("PARSER TESTS PASSED");
