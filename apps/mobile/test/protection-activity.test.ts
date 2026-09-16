import assert from 'node:assert/strict';
import test from 'node:test';
import { assessLiveMessage } from '../src/lib/live-guard-policy.ts';
import { createProtectionActivityEntry, summarizeProtectionActivity } from '../src/lib/protection-activity.ts';

test('activity entry preserves metadata but no raw notification content', () => {
  const raw = 'OTP kodunuz 123456, hemen ödeme yapın';
  const assessment = assessLiveMessage({ text: raw });
  const entry = createProtectionActivityEntry({
    id: 'event-1',
    checkedAt: '2026-09-16T16:00:00Z',
    assessment,
    sourcePackage: 'com.whatsapp',
    title: 'ignored' as never,
    text: raw as never,
  } as any);
  assert.ok(entry);
  assert.equal(JSON.stringify(entry).includes(raw), false);
  assert.equal(entry?.sourcePackage, 'com.whatsapp');
});
test('activity summary reports real checked outcomes without inventing threats', () => {
  const make = (id: string, text: string, checkedAt: string) => createProtectionActivityEntry({
    id,
    checkedAt,
    assessment: assessLiveMessage({ text }),
  })!;
  const entries = [
    make('1', 'Akşam görüşürüz.', '2026-09-16T10:00:00Z'),
    make('2', 'Sipariş: https://example.com', '2026-09-16T11:00:00Z'),
    make('3', 'Banka hesabınız kapanacak, OTP kodunu hemen girin.', '2026-09-16T12:00:00Z'),
  ];
  const summary = summarizeProtectionActivity(entries);
  assert.equal(summary.checked, 3);
  assert.equal(summary.warnings, 1);
  assert.equal(summary.reviews, 1);
  assert.equal(summary.quietPasses, 1);
  assert.equal(summary.lastCheckedAt, '2026-09-16T12:00:00.000Z');
});
