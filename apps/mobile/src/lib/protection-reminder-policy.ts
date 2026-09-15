function parseLocalDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) return null;
  return date;
}

export function getProtectionReminderAt(deadline: string, now = new Date()) {
  const due = parseLocalDate(deadline);
  if (!due) return null;

  const dayBefore = new Date(due);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(10, 0, 0, 0);

  const deadlineMorning = new Date(due);
  deadlineMorning.setHours(9, 0, 0, 0);

  const minimumLead = new Date(now.getTime() + 5 * 60 * 1000);
  if (dayBefore > minimumLead) return dayBefore;
  if (deadlineMorning > minimumLead) return deadlineMorning;
  return null;
}
