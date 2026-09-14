import assert from 'node:assert/strict';
import test from 'node:test';
import { ANALYSIS_CONTRACT_VERSION, canonicalizeLinkForReuse, createReuseFingerprint, directionalAvoidedCost, linkReuseTtlMs, prepareResultForReuse, reuseAgeSeconds } from '../lib/analysis-reuse.ts';

test('canonicalizes tracking-only link variants to the same value', () => {
  assert.equal(
    canonicalizeLinkForReuse('https://Example.com/a?utm_source=x&b=2&a=1#frag'),
    'https://example.com/a?a=1&b=2',
  );
});

test('fingerprint is secret-bound and contract-version-bound', () => {
  const first = createReuseFingerprint('https://example.com/a', '0123456789abcdef');
  const second = createReuseFingerprint('https://example.com/a', 'fedcba9876543210');
  assert.ok(first);
  assert.notEqual(first, second);
  assert.ok(ANALYSIS_CONTRACT_VERSION.startsWith('m3.2-'));
});

test('does not reuse unverified low-risk results', () => {
  assert.equal(linkReuseTtlMs({ level: 'low', webVerified: false }), 0);
  assert.equal(linkReuseTtlMs({ level: 'low', webVerified: true }), 60 * 60 * 1000);
  assert.equal(linkReuseTtlMs({ level: 'high' }), 7 * 24 * 60 * 60 * 1000);
});

test('scrubs request metadata and extracted target URLs before persistence', () => {
  const reusable = prepareResultForReuse({ score: 80, requestId: 'abc', meta: { route: 'x' }, extractedUrls: ['https://secret.example'] });
  assert.equal(reusable.requestId, undefined);
  assert.equal(reusable.meta, undefined);
  assert.equal(reusable.extractedUrls, undefined);
  assert.equal(reusable.score, 80);
});

test('computes bounded reuse age', () => {
  const now = Date.parse('2026-09-14T12:00:00Z');
  assert.equal(reuseAgeSeconds('2026-09-14T11:00:00Z', now), 3600);
  assert.equal(reuseAgeSeconds('2026-09-14T13:00:00Z', now), null);
  assert.equal(reuseAgeSeconds('not-a-date', now), null);
});

test('keeps only bounded directional avoided cost', () => {
  assert.equal(directionalAvoidedCost(0.1234567), 0.123457);
  assert.equal(directionalAvoidedCost(-1), null);
  assert.equal(directionalAvoidedCost(101), null);
  assert.equal(directionalAvoidedCost('bad'), null);
});
