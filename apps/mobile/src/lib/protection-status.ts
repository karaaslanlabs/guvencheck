export type ProtectionTimingState = "none" | "future" | "soon" | "today" | "overdue";

export type ProtectionTiming = {
  state: ProtectionTimingState;
  label: string;
  daysUntil?: number;
};

function validDateParts(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parts = value.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) return null;
  return { year, month, day };
}
export function getProtectionTiming(deadline: string, now = new Date()): ProtectionTiming {
  const parts = validDateParts(deadline);
  if (!parts) return { state: "none", label: "Kritik tarih belirtilmedi" };

  const due = Date.UTC(parts.year, parts.month - 1, parts.day);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const daysUntil = Math.round((due - today) / 86400000);

  if (daysUntil < 0) return { state: "overdue", label: `${Math.abs(daysUntil)} gün geçti`, daysUntil };
  if (daysUntil === 0) return { state: "today", label: "Kritik tarih bugün", daysUntil };
  if (daysUntil === 1) return { state: "soon", label: "Kritik tarih yarın", daysUntil };
  if (daysUntil <= 7) return { state: "soon", label: `${daysUntil} gün kaldı`, daysUntil };
  return { state: "future", label: `${daysUntil} gün kaldı`, daysUntil };
}
