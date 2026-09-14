import assert from "node:assert/strict";
import test from "node:test";
import { MANIPULATION_TACTICS, sanitizeManipulationTactics } from "../lib/manipulation-lens.ts";

test("keeps only allowed unique tactics", () => {
  const first = MANIPULATION_TACTICS[0];
  const second = MANIPULATION_TACTICS[1];
  assert.deepEqual(
    sanitizeManipulationTactics([first, "unknown", first, second]),
    [first, second],
  );
});

test("returns an empty list for invalid input", () => {
  assert.deepEqual(sanitizeManipulationTactics(null), []);
  assert.deepEqual(sanitizeManipulationTactics("not-an-array"), []);
});