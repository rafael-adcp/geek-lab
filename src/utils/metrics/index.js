export function readMetrics(fs, metricsPath) {
  return JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
}

export function writeMetrics(fs, metricsPath, data) {
  fs.writeFileSync(metricsPath, JSON.stringify(data, null, '  '));
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

