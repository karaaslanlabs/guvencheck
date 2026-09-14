import assert from "node:assert/strict";
import test from "node:test";
import { isTelemetryEvent, TELEMETRY_EVENTS } from "../lib/telemetry-events.ts";

test("accepts the protection eligibility denominator event", () => {
  assert.equal(isTelemetryEvent("protection_candidate_eligible"), true);
  assert.ok(TELEMETRY_EVENTS.includes("protection_candidate_eligible"));
});

test("rejects arbitrary telemetry event names", () => {
  assert.equal(isTelemetryEvent("raw_content"), false);
  assert.equal(isTelemetryEvent("protection_candidate_content"), false);
});
