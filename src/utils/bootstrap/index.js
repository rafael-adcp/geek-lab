import { pathToFileURL } from 'url';

export async function loadMysql2(env = process.env) {
  const overridePath = env.GEEK_LAB_MYSQL2_MODULE;
  const target = overridePath ? pathToFileURL(overridePath).href : 'mysql2/promise';
  return (await import(target)).default;
}

export function scheduleUpdateNotifier({ pkg, importer, isDebug }) {
  return importer()
    .then(({ default: updateNotifier }) => updateNotifier({ pkg, updateCheckInterval: 1000 }).notify())
    .catch((e) => {
      try {
        if (isDebug()) {
          console.error('[geek-lab] update-notifier check failed:', e);
        }
      } catch { /* config unreadable — stay silent on the advisory path */ }
    });
}
