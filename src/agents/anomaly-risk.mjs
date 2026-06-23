export function analyzeAnomalies(data) {
  const { anomalies, views, budgets, dates } = data || {};
  const list = Array.isArray(anomalies) ? anomalies : anomalies?.results ? anomalies.results : [];
  const viewList = Array.isArray(views) ? views : [];
  const budgetList = Array.isArray(budgets) ? budgets : [];
  const today = dates?.today || new Date().toISOString().slice(0, 10);

  // Classify anomalies
  const critical = [], warning = [], info = [];
  const newToday = [], recurring = [];

  for (const a of list) {
    const spend = parseFloat(a.unusualSpend || a.amount || 0);
    const sev = spend > 10000 ? 'critical' : spend > 1000 ? 'warning' : 'info';
    const entry = { ...a, spend, severity: sev, service: a.enhancedServiceName || a.serviceName || a.service || 'Unknown', viewName: a.viewName || '' };

    if (sev === 'critical') critical.push(entry);
    else if (sev === 'warning') warning.push(entry);
    else info.push(entry);

    const created = (a.startDate || a.createdAt || '').slice(0, 10);
    if (created >= dates.yesterday) newToday.push(entry);
  }

  // Sort by spend
  critical.sort((a, b) => b.spend - a.spend);
  warning.sort((a, b) => b.spend - a.spend);

  // Coverage analysis
  const viewsWithBudgets = new Set(budgetList.map(b => b.viewId || b.view_id).filter(Boolean));
  const viewsWithoutBudgets = viewList.filter(v => !viewsWithBudgets.has(v.id));
  const totalSpendMonitored = viewList.length;
  const unmonitoredCount = viewsWithoutBudgets.length;

  // Risk patterns
  const riskPatterns = [];
  if (critical.length > 3) riskPatterns.push(`High anomaly volume: ${critical.length} critical anomalies suggest systemic issue`);
  if (newToday.length > 5) riskPatterns.push(`Anomaly spike: ${newToday.length} new anomalies in past 24h (vs typical 1-3)`);
  if (unmonitoredCount > viewList.length * 0.3) riskPatterns.push(`${unmonitoredCount} of ${viewList.length} views have no budget — blind spots`);

  // Alerts for actions agent
  const alerts = [];
  if (critical.length > 0) {
    alerts.push({ severity: 'critical', message: `${critical.length} critical anomalies: top is ${critical[0].service} (+$${Math.round(critical[0].spend)} unusual)`, costOfInaction: Math.max(1000, Math.round(critical[0].spend / 7)), effort: 'hours', source: 'anomaly', confidence: 0.9 });
  }
  if (warning.length > 10) {
    const totalWarnSpend = warning.reduce((s, a) => s + a.spend, 0);
    alerts.push({ severity: 'medium', message: `${warning.length} warning-level anomalies totaling $${Math.round(totalWarnSpend)} in unusual spend`, costOfInaction: Math.round(totalWarnSpend / 30), effort: 'sprint', source: 'anomaly', confidence: 0.7 });
  }
  if (unmonitoredCount > 5) {
    alerts.push({ severity: 'medium', message: `${unmonitoredCount} views without budget coverage — cost overruns invisible`, costOfInaction: 500, effort: 'hours', source: 'anomaly', confidence: 0.8 });
  }

  return {
    totalAnomalies: list.length, critical, warning, info, newToday, recurring,
    coverageGaps: viewsWithoutBudgets.slice(0, 10), unmonitoredCount,
    totalViews: viewList.length, riskPatterns, alerts
  };
}
