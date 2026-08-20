import { File, Paths } from 'expo-file-system';

const FILE_NAME = 'guvencheck-install-id.txt';
const VALID_ID = /^gc-[a-z0-9]{16,32}$/;
let cachedInstallId: string | null = null;
let pendingInstallId: Promise<string> | null = null;

function generateInstallId() {
  const raw =
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 12) +
    Math.random().toString(36).slice(2, 8);

  return `gc-${raw.slice(0, 24)}`;
}

async function loadOrCreateInstallId() {
  const file = new File(Paths.document, FILE_NAME);

  if (file.exists) {
    try {
      const existing = file.textSync().trim().toLowerCase();
      if (VALID_ID.test(existing)) return existing;
    } catch {
      // Bozuk/okunamayan kimlik varsa anonim yeni bir kimlik oluştur.
    }
  }

  const next = generateInstallId();

  try {
    if (!file.exists) file.create();
    file.write(next);
  } catch {
    // Dosya sistemi beklenmedik biçimde yazılamazsa bu oturum yine çalışsın.
    // Bu fallback kalıcı unique-user ölçümüne dahil olmayabilir.
  }

  return next;
}

export async function getInstallId() {
  if (cachedInstallId) return cachedInstallId;
  if (!pendingInstallId) {
    pendingInstallId = loadOrCreateInstallId().then(value => {
      cachedInstallId = value;
      return value;
    });
  }
  return pendingInstallId;
}

export function createSessionId(installId: string) {
  const sessionPart =
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  return `mobile:${installId}:s:${sessionPart}`;
}
