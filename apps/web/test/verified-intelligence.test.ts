import assert from 'node:assert/strict';
import test from 'node:test';
import { lookupCuratedIntelligence, type CuratedIntelligenceRecord } from '../lib/verified-intelligence.ts';

const record: CuratedIntelligenceRecord = {
  id: 'fixture-v1',
  match: { kind: 'domain', value: 'known.example' },
  verifiedAt: '2026-09-14T00:00:00Z',
  expiresAt: '2026-10-14T00:00:00Z',
  provenance: 'Reviewed fixture',
  result: { score: 10, level: 'low', summary: 'fixture', signals: ['fixture'], actions: ['fixture'] },
};

test('matches an active curated domain including subdomains', () => {
  const hit = lookupCuratedIntelligence(
    'https://sub.known.example/path',
    [record],
    new Date('2026-09-20T00:00:00Z'),
  );
  assert.equal(hit?.id, 'fixture-v1');
});
test('rejects lookalikes and expired records', () => {
  const now = new Date('2026-09-20T00:00:00Z');
  assert.equal(
    lookupCuratedIntelligence('https://known.example.bad.test', [record], now),
    null,
  );
  assert.equal(
    lookupCuratedIntelligence('https://known.example', [record], new Date('2026-11-01T00:00:00Z')),
    null,
  );
});
