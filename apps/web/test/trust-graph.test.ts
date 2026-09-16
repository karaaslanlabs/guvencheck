import test from "node:test";
import assert from "node:assert/strict";
import { findClaimedEntities, lookupOfficialDomain, usableTrustEntities, type TrustGraphEntity } from "../lib/trust-graph.ts";

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

test("matches exact and real subdomains only", () => {
  assert.equal(lookupOfficialDomain("https://ornekbank.com.tr", [bank], now)?.id, "bank-1");
  assert.equal(lookupOfficialDomain("https://login.ornekbank.com.tr/path", [bank], now)?.id, "bank-1");
  assert.equal(lookupOfficialDomain("https://ornekbank-login.com", [bank], now), null);
});

test("drops expired or link-out-only facts from decision evidence", () => {
  const expired = { ...bank, id: "expired", source: { ...bank.source, expiresAt: "2026-09-10T00:00:00Z" } };
  const linkOut = { ...bank, id: "link-out", source: { ...bank.source, rightsMode: "link_out_only" as const } };
  assert.deepEqual(usableTrustEntities([expired, linkOut], now), []);
});

test("finds a claimed regulated entity by bounded aliases", () => {
  const found = findClaimedEntities("Örnek Bank müşteri hizmetlerinden arıyoruz", [bank], now);
  assert.equal(found.length, 1);
  assert.equal(found[0]?.id, "bank-1");
});

test("default reviewed BDDK seed recognizes a bank claim and official domain", () => {
  const seedNow = new Date("2026-09-16T18:00:00Z");
  const claimed = findClaimedEntities("Garanti BBVA hesabınız için işlem gerekiyor", undefined, seedNow);
  assert.equal(claimed[0]?.id, "bddk-garanti");
  assert.equal(lookupOfficialDomain("https://sube.garantibbva.com.tr/path", undefined, seedNow)?.id, "bddk-garanti");
  assert.equal(lookupOfficialDomain("https://garantibbva-login.com", undefined, seedNow), null);
});
