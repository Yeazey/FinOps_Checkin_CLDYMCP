const fmt = n => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

export function orchestrate(agentOutputs) {
  const { costs, forecast, optimization, anomalies, operations, actions, deepDives } = agentOutputs;
  const now = new Date();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = daysInMonth - dayOfMonth;

  // Build narrative one-liner
  const parts = [];
  if (costs.mtdVsPrior && Math.abs(parseFloat(costs.mtdVsPrior)) > 5) {
    parts.push(`Spend ${parseFloat(costs.mtdVsPrior) > 0 ? 'up' : 'down'} ${Math.abs(parseFloat(costs.mtdVsPrior)).toFixed(0)}% vs last month`);
  }
  if (costs.risers?.[0]?.delta > 50000) {
    parts.push(`${costs.risers[0].service} surging +${fmt(costs.risers[0].delta)} WoW`);
  }
  if (optimization.totalSavings > 10000) {
    parts.push(`${fmt(optimization.totalSavings)}/mo in savings available`);
  }
  if (anomalies.critical?.length > 0) {
    parts.push(`${anomalies.critical.length} critical anomalies`);
  }
  if (costs.newServices?.length > 0) {
    parts.push(`${costs.newServices.length} new service(s) detected`);
  }
  const oneLiner = parts.join(' │ ') || 'All systems nominal.';

  return { dayOfWeek, dateStr, dayOfMonth, daysInMonth, daysLeft, oneLiner, costs, forecast, optimization, anomalies, operations, actions, deepDives };
}
