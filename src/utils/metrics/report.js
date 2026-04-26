function actionUsagePerDay(actions, days, dailyUsage) {
  return actions.map((action) => [
    action,
    ...days.map((day) => dailyUsage[day]?.[action] ?? 0),
  ]);
}

function buildOverallGraph({ actions, days, totalUsage, perDay, genId }) {
  return [
    {
      data: JSON.stringify(actions.map((a) => [a, totalUsage[a]])),
      id: genId('graphic'),
      name: 'Total Usage',
      type: 'donut',
    },
    {
      data: JSON.stringify(perDay),
      id: genId('graphic'),
      name: 'Usage evolution per day',
      type: 'line',
      categories: JSON.stringify(days),
    },
  ];
}

function buildEachActionGraph({ actions, days, perDay, genId }) {
  return actions.map((action, i) => ({
    data: JSON.stringify(perDay[i]),
    id: genId('graphic_each_action'),
    name: action,
    type: 'line',
    categories: JSON.stringify(days),
    openNewRow: (i % 3) === 0,
    closeRow: (i % 3) === 2,
  }));
}

export function buildReportData(store, genId) {
  const actions = Object.keys(store.totalUsage);
  const days = Object.keys(store.dailyUsage);
  const perDay = actionUsagePerDay(actions, days, store.dailyUsage);

  return {
    generatedOverallGraph: buildOverallGraph({ actions, days, totalUsage: store.totalUsage, perDay, genId }),
    generatedeEachActionlGraph: buildEachActionGraph({ actions, days, perDay, genId }),
  };
}
