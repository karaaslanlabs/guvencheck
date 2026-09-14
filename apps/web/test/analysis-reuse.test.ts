import assert from 'node:assert/strict';
import test from 'node:test';
import { ANALYSIS_CONTRACT_VERSION, canonicalizeLinkForReuse, createReuseFingerprint, linkReuseTtlMs, prepareResultForReuse } from '../lib/analysis-reuse.ts';

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
