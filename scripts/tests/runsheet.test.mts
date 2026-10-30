import { computeRunSheet, driverPay } from "../../src/lib/runsheet.ts";
import assert from "node:assert/strict";
// Brief's example: 3 days x $800, 5 nights x $125, 2 no-go x $250, gas excluded => $3,525
const legs = [
  { charged_as: "day_rate", overnight: true, miles: 0 },
  { charged_as: "day_rate", overnight: true, miles: 0 },
  { charged_as: "day_rate", overnight: true, miles: 0 },
  { charged_as: "no_go", overnight: true, miles: 0 },
  { charged_as: "no_go", overnight: true, miles: 0 },
] as const;
const r = computeRunSheet(legs as any, { day: 800, overnight: 125, no_go: 250 }, 180, false);
assert.equal(r.lines.day.amount, 2400); assert.equal(r.lines.overnight.amount, 625); assert.equal(r.lines.no_go.amount, 500);
assert.equal(r.lines.gas.amount, 0); assert.equal(r.total, 3525);
const r2 = computeRunSheet([{ charged_as: "miles", overnight: false, miles: 312.5 }, { charged_as: "miles", overnight: false, miles: "100" }], { per_mile: 1.85 }, 75.5, true);
assert.equal(r2.miles, 412.5); assert.equal(r2.lines.mileage.amount, 763.13); assert.equal(r2.total, 838.63);
// Sheet: total 1000, QP 5%, gas 100, split 40% => qp 50, pay (1000-50-100)*.4 = 340, profit 510
assert.deepEqual(driverPay(1000, 5, true, 100, 40), { qp: 50, pay: 340, profit: 510 });
assert.deepEqual(driverPay(1000, 5, false, 0, 50), { qp: 0, pay: 500, profit: 500 });
console.log("RUN SHEET TESTS PASSED");
