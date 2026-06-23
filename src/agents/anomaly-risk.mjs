export function analyzeAnomalies(data) {
  const { anomalies, views, dates } = data || {};
  const list = Array.isArray(anomalies) ? anomalies
    : anomalies?.results ? anomalies.results
    : [];

  const today = dates?.today || new Date().toISOString().slice(0, 10);
  const critical = [];
  const warning = [];
  const newToday = [];
  const recurring = [];

  for (const a of list) {
    const sev = a.severity || (a.unusualSpend > 10000 ? 'critical' : 'warning');
    if (sev === 'critical') critical.push(a);
    else warning.push(a);

    const created = (a.startDate || a.createdAt || '').slice(0, 10);
    if (created === today) newToday.push(a);
    if (a.occurrences > 1 || a.recurring) recurring.push(a);
  }

  const monitoredViewIds = new Set(list.map(a => a.viewId).filter(Boolean));
  const coverageGaps = (views || []).filter(v => !monitoredViewIds.has(v.id));

  const alerts = [];
  if (critical.length > 0) alerts.push({ severity: 'critical', message: `${critical.length} critical anomalies detected`, source: 'anomaly-risk' });
  if (coverageGaps.length > 0) alerts.push({ severity: 'medium', message: `${coverageGaps.length} views without anomaly monitoring`, source: 'anomaly-risk' });

  return { totalAnomalies: list.length, critical, warning, newToday, recurring, coverageGaps, alerts };
}
