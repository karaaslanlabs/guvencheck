import test from "node:test";
import assert from "node:assert/strict";
import { deriveTransactionGuard } from "../lib/transaction-guard.ts";
import type { TrustGraphEntity } from "../lib/trust-graph.ts";

const now = new Date("2026-09-16T12:00:00Z");
const bank: TrustGraphEntity = {
  id: "bank-1",
  name: "Örnek Bankası",
  aliases: ["Örnek Bank"],
  kind: "bank",
  status: "active",
  officialDomains: ["ornekbank.com.tr"],
  source: {
    authority: "Test Regulator",
    url: "https://regulator.example/bank-1",
    rightsMode: "curated_verified_fact",
    observedAt: "2026-09-01T00:00:00Z",
    expiresAt: "2026-10-01T00:00:00Z",
  },
};

const low = { level: "low" as const, confidence: "high" as const, signals: [], actions: [], extractedUrls: [] };

test("official-domain match never upgrades a high-risk request to safe", () => {
  const result = deriveTransactionGuard({
    text: "Örnek Bankası hesabın için https://ornekbank.com.tr adresine gir ve OTP kodunu paylaş",
    analysis: { ...low, level: "high", confidence: "high", extractedUrls: ["https://ornekbank.com.tr"] },
    records: [bank],
    now,
  });
  assert.equal(result.decision, "stop");
  assert.ok(result.evidence.some((item) => item.kind === "official_domain_match"));
});

test("claimed entity plus lookalike payment link stops the transaction", () => {
  const result = deriveTransactionGuard({
    text: "Örnek Bankası doğrulaması için https://ornekbank-login.com adresinden ödeme yap",
    analysis: { ...low, extractedUrls: ["https://ornekbank-login.com"] },
    records: [bank],
    now,
  });
  assert.equal(result.decision, "stop");
  assert.ok(result.evidence.some((item) => item.kind === "claimed_entity_mismatch"));
});

test("low-risk official-domain transaction remains cautious, not guaranteed safe", () => {
  const result = deriveTransactionGuard({
    text: "Örnek Bankası için https://ornekbank.com.tr hesabını kontrol et",
    analysis: { ...low, extractedUrls: ["https://ornekbank.com.tr"] },
    records: [bank],
    now,
  });
  assert.equal(result.decision, "proceed_cautiously");
  assert.match(result.summary, /garantisi değildir/i);
});

test("returns not applicable when no transaction or trust decision exists", () => {
  const result = deriveTransactionGuard({
    text: "Bugün hava güzel görünüyor.",
    analysis: low,
    records: [bank],
    now,
  });
  assert.equal(result.decision, "not_applicable");
  assert.equal(result.applicable, false);
});
