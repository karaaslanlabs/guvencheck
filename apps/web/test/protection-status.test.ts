import assert from "node:assert/strict";
import test from "node:test";
import { getProtectionTiming, isProtectionActionDue } from "../lib/protection-status.ts";

const now = new Date("2026-09-14T12:00:00Z");

test("classifies today, soon, future and overdue deadlines", () => {
  assert.equal(getProtectionTiming("2026-09-14", now).state, "today");
  assert.equal(getProtectionTiming("2026-09-15", now).label, "Kritik tarih yarın");
  assert.equal(getProtectionTiming("2026-09-18", now).state, "soon");
  assert.equal(getProtectionTiming("2026-10-01", now).state, "future");
  assert.equal(getProtectionTiming("2026-09-10", now).state, "overdue");
});

test("invalid dates do not create a countdown", () => {
  const result = getProtectionTiming("2026-02-31", now);
  assert.equal(result.state, "none");
  assert.equal(result.daysUntil, undefined);
});

test("identifies actionable protection timing states", () => {
  assert.equal(isProtectionActionDue(getProtectionTiming("2026-09-14", now)), true);
  assert.equal(isProtectionActionDue(getProtectionTiming("2026-09-18", now)), true);
  assert.equal(isProtectionActionDue(getProtectionTiming("2026-10-01", now)), false);
  assert.equal(isProtectionActionDue(getProtectionTiming("", now)), false);
});
