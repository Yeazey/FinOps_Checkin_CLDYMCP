export function orchestrate(agentOutputs) {
  const { costs, forecast, optimization, anomalies, operations, actions } = agentOutputs;
  const now = new Date();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = daysInMonth - dayOfMonth;

  // One-liner summary
  let oneLiner = '';
  if (forecast.budgetPctConsumed > 0 && forecast.budgetPctConsumed > forecast.calendarPct + 10) {
    oneLiner = `⚠️ Spending ahead of budget (${forecast.budgetPctConsumed.toFixed(0)}% consumed at ${forecast.calendarPct.toFixed(0)}% of month).`;
  } else if (optimization.totalSavings > 5000) {
    oneLiner = `${fmt(optimization.totalSavings)}/mo in savings available. ${actions.priorityActions.length} priority actions today.`;
  } else {
    oneLiner = `Spend tracking normally. ${actions.priorityActions.length} items need attention.`;
  }
  if (anomalies.totalAnomalies > 0) {
    oneLiner += ` ${anomalies.totalAnomalies} anomalies active.`;
  }

  return {
    dayOfWeek, dateStr, dayOfMonth, daysInMonth, daysLeft, oneLiner,
    costs, forecast, optimization, anomalies, operations, actions
  };
}

function fmt(n) { return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 }); }
