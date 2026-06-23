const fmt = n => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

export function analyzeForecastBudget(data) {
  const { mtdVendor, priorMtdVendor, budgets, forecast, estimate, dates } = data;
  const now = new Date(dates.today);
  const daysElapsed = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const calendarPct = (daysElapsed / daysInMonth) * 100;

  const mtdTotal = parseFloat(mtdVendor?.meta?.aggregates?.[0]?.value || 0);
  const priorMtdTotal = parseFloat(priorMtdVendor?.meta?.aggregates?.[0]?.value || 0);
  const dailyRate = mtdTotal / Math.max(daysElapsed, 1);
  const projected = dailyRate * daysInMonth;
  const daysLeft = daysInMonth - daysElapsed;

  // Budget analysis
  const budgetList = Array.isArray(budgets) ? budgets : [];
  let totalBudget = 0;
  const budgetDetails = [];
  for (const b of budgetList) {
    const months = b.months || [];
    const thisMonth = months.find(m => m.month === dates.mtdStart.slice(0, 7));
    if (thisMonth) {
      const threshold = parseFloat(thisMonth.threshold || 0);
      totalBudget += threshold;
      const consumed = threshold > 0 ? (mtdTotal / threshold * 100) : 0;
      const projectedVsBudget = threshold > 0 ? ((projected / threshold - 1) * 100).toFixed(1) : 0;
      budgetDetails.push({ name: b.name, threshold, consumed: consumed.toFixed(1), projectedVsBudget, atRisk: projected > threshold });
    }
  }
  const budgetPctConsumed = totalBudget > 0 ? (mtdTotal / totalBudget * 100) : 0;
  const budgetsAtRisk = budgetDetails.filter(b => b.atRisk);

  // Days until budget exceeded
  const daysToExceed = totalBudget > 0 && dailyRate > 0 ? Math.round((totalBudget - mtdTotal) / dailyRate) : null;

  // Prior month run rate comparison
  const priorDailyRate = priorMtdTotal / Math.max(daysElapsed, 1);
  const rateChange = priorDailyRate > 0 ? ((dailyRate / priorDailyRate - 1) * 100).toFixed(1) : null;

  // Forecast vs actual
  const forecastValue = forecast?.forecast?.amount || forecast?.amount || null;
  const estimateValue = estimate?.estimate?.amount || estimate?.amount || null;
  const forecastVariance = forecastValue ? ((mtdTotal / parseFloat(forecastValue) - 1) * 100).toFixed(1) : null;

  // Growth trajectory
  const monthlyGrowth = priorMtdTotal > 0 ? ((projected / (priorMtdTotal * daysInMonth / daysElapsed) - 1) * 100).toFixed(1) : null;
  const annualizedRate = dailyRate * 365;

  // Alerts
  const alerts = [];
  if (budgetPctConsumed > calendarPct + 10) {
    alerts.push({ severity: 'high', message: `Spending ahead of budget: ${budgetPctConsumed.toFixed(0)}% consumed at ${calendarPct.toFixed(0)}% of month`, savings: 0, costOfInaction: Math.round(dailyRate * 0.1), effort: 'hours', source: 'forecast', confidence: 0.9 });
  }
  if (budgetsAtRisk.length > 0) {
    alerts.push({ severity: 'high', message: `${budgetsAtRisk.length} budgets projected to exceed threshold`, savings: 0, costOfInaction: 0, effort: 'hours', source: 'forecast', confidence: 0.85 });
  }
  if (rateChange && parseFloat(rateChange) > 15) {
    alerts.push({ severity: 'medium', message: `Daily burn rate up ${rateChange}% vs prior month (${fmt(dailyRate)}/day vs ${fmt(priorDailyRate)}/day)`, savings: 0, costOfInaction: Math.round((dailyRate - priorDailyRate) * 7), effort: 'hours', source: 'forecast', confidence: 0.8 });
  }

  return {
    mtdTotal, projected, dailyRate, daysElapsed, daysInMonth, daysLeft, calendarPct,
    budgetTotal: totalBudget, budgetPctConsumed, budgetDetails, budgetsAtRisk,
    daysToExceed, priorDailyRate, rateChange, annualizedRate, monthlyGrowth,
    forecastVariance, alerts
  };
}
