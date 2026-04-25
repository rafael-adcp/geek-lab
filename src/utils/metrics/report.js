export function buildReportData(store, genId) {
  const availableActions = Object.keys(store.totalUsage);
  const availableDays = Object.keys(store.dailyUsage);

  const totalUsage = availableActions.map((action) => [action, store.totalUsage[action]]);

  const actionUsagePerDay = availableActions.map((action) => [
    action,
    ...availableDays.map((day) => store.dailyUsage[day]?.[action] ?? 0),
  ]);

  const generatedOverallGraph = [
    {
      data: JSON.stringify(totalUsage),
      id: genId('graphic'),
      name: 'Total Usage',
      type: 'donut',
    },
    {
      data: JSON.stringify(actionUsagePerDay),
      id: genId('graphic'),
      name: 'Usage evolution per day',
      type: 'line',
      categories: JSON.stringify(availableDays),
    },
  ];

  const generatedeEachActionlGraph = availableActions.map((action, i) => ({
    data: JSON.stringify(actionUsagePerDay[i]),
    id: genId('graphic_each_action'),
    name: action,
    type: 'line',
    categories: JSON.stringify(availableDays),
    openNewRow: (i % 3) === 0,
    closeRow: (i % 3) === 2,
  }));

  return { generatedOverallGraph, generatedeEachActionlGraph };
}
