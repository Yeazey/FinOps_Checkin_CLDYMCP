export function analyzeForecastBudget(data) {
  const mtdVendor = data.mtdByVendor?.results || [];
  const budgets = data.budgets || [];
  const forecast = data.forecast;
  const estimate = data.estimate;
  const dates = data.dates;

  const mtdTotal = mtdVendor.reduce((s, r) => s + parseFloat(r.unblended_cost || 0), 0);

  const today = new Date(dates.today);
  const mtdStart = new Date(dates.mtdStart);
  const daysElapsed = Math.max(1, Math.round((today - mtdStart) / 86400000));
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const calendarPct = (daysElapsed / daysInMonth) * 100;

  const burnRate = mtdTotal / daysElapsed;
  const projectedMonthEnd = burnRate * daysInMonth;

  const budgetTotal = budgets.reduce((s, b) => {
    const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const entry = (b.months || []).find(m => m.month === month);
    return s + (entry ? entry.threshold : 0);
  }, 0);

  const budgetPctConsumed = budgetTotal ? (mtdTotal / budgetTotal) * 100 : 0;

  const daysToBreachList = [];
  for (const b of budgets) {
    const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const entry = (b.months || []).find(m => m.month === month);
    if (entry && burnRate > 0) {
      const remaining = entry.threshold - mtdTotal;
      if (remaining > 0) {
        const daysToBreach = Math.ceil(remaining / burnRate);
        daysToBreachList.push({ budget: b.name, threshold: entry.threshold, daysToBreach });
      } else {
        daysToBreachList.push({ budget: b.name, threshold: entry.threshold, daysToBreach: 0 });
      }
    }
  }

  const forecastVariance = forecast?.total ? ((projectedMonthEnd - forecast.total) / forecast.total) * 100 : null;

  const alerts = [];
  if (budgetPctConsumed > calendarPct + 10) alerts.push(`Budget ${budgetPctConsumed.toFixed(1)}% consumed vs ${calendarPct.toFixed(1)}% of month elapsed`);
  for (const d of daysToBreachList) {
    if (d.daysToBreach <= 5) alerts.push(`Budget "${d.budget}" breach in ${d.daysToBreach} days`);
  }

  return { mtdTotal, burnRate, projectedMonthEnd, budgetTotal, budgetPctConsumed, calendarPct, daysToBreachList, forecastVariance, alerts };
}
