import test from 'node:test';
import assert from 'node:assert/strict';
import { getProtectionReminderAt } from '../src/lib/protection-reminder-policy.ts';

function parts(date: Date | null) {
  if (!date) return null;
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

test('schedules a future protection reminder for the day before at 10:00', () => {
  const now = new Date(2026, 8, 14, 8, 0, 0);
  const reminder = getProtectionReminderAt('2026-09-16', now);
  assert.deepEqual(parts(reminder), {
    year: 2026, month: 9, day: 15, hour: 10, minute: 0,
  });
});

test('falls back to deadline morning when the day-before slot has passed', () => {
  const now = new Date(2026, 8, 14, 18, 0, 0);
  const reminder = getProtectionReminderAt('2026-09-15', now);
  assert.deepEqual(parts(reminder), {
    year: 2026, month: 9, day: 15, hour: 9, minute: 0,
  });
});

test('does not schedule when the deadline window has already passed', () => {
  const now = new Date(2026, 8, 15, 12, 0, 0);
  assert.equal(getProtectionReminderAt('2026-09-15', now), null);
  assert.equal(getProtectionReminderAt('2026-09-14', now), null);
});

test('rejects invalid dates instead of inventing a reminder', () => {
  const now = new Date(2026, 8, 14, 8, 0, 0);
  assert.equal(getProtectionReminderAt('2026-02-31', now), null);
  assert.equal(getProtectionReminderAt('', now), null);
});
