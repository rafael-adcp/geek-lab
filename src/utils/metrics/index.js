export function readMetrics(fs, metricsPath) {
  return JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
}

export function writeMetrics(fs, metricsPath, data) {
  fs.writeFileSync(metricsPath, JSON.stringify(data, null, 2));
}

export function recordUsage({ store, clock, command }) {
  const next = {
    totalUsage: { ...store.totalUsage },
    dailyUsage: { ...store.dailyUsage },
  };

  next.totalUsage[command] = (next.totalUsage[command] || 0) + 1;

  const today = new Intl.DateTimeFormat('en-GB').format(clock.now());
  next.dailyUsage[today] = { ...(next.dailyUsage[today] || {}) };
  next.dailyUsage[today][command] = (next.dailyUsage[today][command] || 0) + 1;

  return next;
}

export function recordCommand({ fs, metricsPath, clock, command, enabled }) {
  if (!enabled) return;
  const normalized = command && command.length > 0 ? command : 'geek-lab';
  const store = readMetrics(fs, metricsPath);
  const next = recordUsage({ store, clock, command: normalized });
  writeMetrics(fs, metricsPath, next);
}

