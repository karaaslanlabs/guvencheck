import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveOfficialSafePath } from '../lib/official-safe-path.ts';

test('routes bank-like cases to an independent bank channel', () => {
  const path = deriveOfficialSafePath({ type: 'text', text: 'Banka adına OTP ve havale isteyen mesaj' });
  assert.equal(path?.kind, 'bank');
});

test('routes public and delivery cases to official channels', () => {
  assert.equal(deriveOfficialSafePath({ type: 'text', text: 'e-Devlet vergi bildirimi' })?.kind, 'public');
  assert.equal(deriveOfficialSafePath({ type: 'text', text: 'Kargo teslimat takip mesajı' })?.kind, 'delivery');
});

test('returns no path when no bounded context is present', () => {
  assert.equal(deriveOfficialSafePath({ type: 'text', text: 'Merhaba nasılsın?' }), null);
});
