export async function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const parsed = new URL(path);
    if (parsed.hostname === 'expo-sharing') return '/handle-share';
    return path;
  } catch {
    return '/';
  }
}
