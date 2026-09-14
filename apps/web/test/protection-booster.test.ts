import assert from "node:assert/strict";
import test from "node:test";
import { getProtectionBooster } from "../lib/protection-booster.ts";

test("returns one bounded booster for the first supported tactic", () => {
  const booster = getProtectionBooster(["urgency_time_pressure", "authority_impersonation"]);
  assert.ok(booster);
  assert.equal(booster.title, "Acil karar baskısına diren");
  assert.match(booster.action, /doğrulama/);
});

test("returns no booster when there is no supported tactic", () => {
  assert.equal(getProtectionBooster([]), null);
  assert.equal(getProtectionBooster(["unknown"]), null);
  assert.equal(getProtectionBooster(undefined), null);
});
