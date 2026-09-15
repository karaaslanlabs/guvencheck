import test from 'node:test';
import assert from 'node:assert/strict';
import { redirectSystemPath } from '../app/+native-intent.ts';

test('routes Expo Sharing native intent into the share handler', async () => {
  assert.equal(
    await redirectSystemPath({ path: 'guvencheck://expo-sharing', initial: true }),
    '/handle-share',
  );
});

test('preserves ordinary app deep links', async () => {
  assert.equal(
    await redirectSystemPath({ path: 'guvencheck://open/safe', initial: false }),
    'guvencheck://open/safe',
  );
});

test('falls back safely for malformed input', async () => {
  assert.equal(await redirectSystemPath({ path: 'not a url', initial: true }), '/');
});
