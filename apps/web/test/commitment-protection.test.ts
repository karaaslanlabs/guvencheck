import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeProtectionCandidate } from "../lib/commitment-protection.ts";

test("keeps bounded structured protection data", () => {
  const result = sanitizeProtectionCandidate({
    eligible: true,
    kind: "subscription",
    title: "  Yıllık üyelik  ",
    provider: " Örnek Sağlayıcı ",
    deadline: "2026-10-15",
    nextAction: " İptal koşulunu doğrula. ",
    summary: " Yenileme öncesi kontrol edilmesi gereken üyelik. ",
  });
  assert.equal(result.eligible, true);
  assert.equal(result.kind, "subscription");
  assert.equal(result.deadline, "2026-10-15");
  assert.equal(result.title, "Yıllık üyelik");
});
test("drops invalid or ineligible protection data", () => {
  const result = sanitizeProtectionCandidate({
    eligible: false,
    kind: "subscription",
    title: "ignored",
    deadline: "15/10/2026",
  });
  assert.deepEqual(result, {
    eligible: false,
    kind: "none",
    title: "",
    provider: "",
    deadline: "",
    nextAction: "",
    summary: "",
  });
});

test("rejects an eligible flag without a real protection object", () => {
  const result = sanitizeProtectionCandidate({
    eligible: true,
    kind: "none",
    title: "Belirsiz kayıt",
    deadline: "2026-10-15",
    nextAction: "",
    summary: "",
  });
  assert.equal(result.eligible, false);
  assert.equal(result.kind, "none");
});

test("drops impossible calendar dates", () => {
  const result = sanitizeProtectionCandidate({
    eligible: true,
    kind: "deadline",
    title: "Son tarih",
    provider: "Örnek",
    deadline: "2026-02-31",
    nextAction: "Tarihi doğrula.",
    summary: "Takip edilmesi gereken tarih.",
  });
  assert.equal(result.eligible, true);
  assert.equal(result.deadline, "");
});
