import { File, Paths } from 'expo-file-system';
import type { ProtectionCandidate, ProtectionObject } from './types';

const FILE_NAME = 'guvencheck-protection.json';

function file() {
  return new File(Paths.document, FILE_NAME);
}

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function validIsoDate(value: unknown) {
  const text = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '';
  const parsed = new Date(`${text}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text ? '' : text;
}

function normalizeCandidate(candidate: ProtectionCandidate): ProtectionCandidate {
  return {
    eligible: candidate.eligible === true,
    kind: candidate.kind,
    title: clean(candidate.title, 120),
    provider: clean(candidate.provider, 100),
    deadline: validIsoDate(candidate.deadline),
    nextAction: clean(candidate.nextAction, 220),
    summary: clean(candidate.summary, 300),
  };
}

export async function loadProtection(): Promise<ProtectionObject | null> {
  const target = file();
  if (!target.exists) return null;
  try {
    const parsed = JSON.parse(target.textSync()) as ProtectionObject;
    if (!parsed || parsed.eligible !== true || !parsed.id || !parsed.savedAt) return null;
    const normalized = normalizeCandidate(parsed);
    if (!normalized.eligible || normalized.kind === 'none' || !normalized.nextAction || !normalized.summary) return null;
    return { ...normalized, id: String(parsed.id), savedAt: String(parsed.savedAt) };
  } catch {
    return null;
  }
}

export async function saveProtection(candidate: ProtectionCandidate): Promise<ProtectionObject> {
  const normalized = normalizeCandidate(candidate);
  if (!normalized.eligible || normalized.kind === 'none' || !normalized.nextAction || !normalized.summary) throw new Error('Bu sonuç korumaya alınabilir yeterli bir taahhüt içermiyor.');
  const object: ProtectionObject = {
    ...normalized,
    id: `protection-${Date.now().toString(36)}`,
    savedAt: new Date().toISOString(),
  };
  const target = file();
  if (!target.exists) target.create();
  target.write(JSON.stringify(object));
  return object;
}

export async function clearProtection() {
  const target = file();
  if (target.exists) target.delete();
}
