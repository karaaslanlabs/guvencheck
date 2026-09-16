import assert from 'node:assert/strict';
import test from 'node:test';
import { assessLiveMessage } from '../src/lib/live-guard-policy.ts';

test('warns only when material harm and multiple strong signals align', () => {
  const result = assessLiveMessage({
    title: 'Banka güvenlik uyarısı',
    text: 'Hesabınız kapanacak, hemen OTP kodunuzu girin ve ödeme yapın.',
  });
  assert.equal(result.decision, 'warn');
  assert.equal(result.confidence, 'high');
  assert.equal(result.materialAction, true);
});

test('remote access request is a high-confidence local warning', () => {
  const result = assessLiveMessage({ text: 'Sorunu çözmek için AnyDesk kurup ekran paylaşın.' });
  assert.equal(result.decision, 'warn');
  assert.ok(result.reasonCodes.includes('remote_access'));
});
test('ordinary link is review, not an alarm', () => {
  const result = assessLiveMessage({ text: 'Sipariş detayları: https://example.com/order/123' });
  assert.equal(result.decision, 'review');
  assert.equal(result.confidence, 'low');
});

test('benign notification stays silent', () => {
  const result = assessLiveMessage({ title: 'Mesaj', text: 'Akşam 8 gibi görüşürüz.' });
  assert.equal(result.decision, 'ignore');
  assert.deepEqual(result.reasonCodes, []);
});

test('assessment output contains no raw notification content', () => {
  const secret = '123456 tek kullanımlık kod';
  const result = assessLiveMessage({ text: secret });
  assert.equal(JSON.stringify(result).includes(secret), false);
  assert.equal(result.explicitReviewRequired, true);
});
