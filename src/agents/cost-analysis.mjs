export function analyzeCosts(data) {
  const yesterday = data.yesterdayByService?.results || [];
  const week = data.weekByService?.results || [];
  const mtdVendor = data.mtdByVendor?.results || [];
  const priorVendor = data.priorMtdByVendor?.results || [];
  const dates = data.dates;

  const yesterdayTotal = yesterday.reduce((s, r) => s + parseFloat(r.unblended_cost || 0), 0);
  const mtdTotal = mtdVendor.reduce((s, r) => s + parseFloat(r.unblended_cost || 0), 0);
  const priorMtdTotal = priorVendor.reduce((s, r) => s + parseFloat(r.unblended_cost || 0), 0);

  const daysInWeek = 7;
  const weekByName = {};
  for (const r of week) {
    const key = r.service_name || r.enhanced_service_name || 'Unknown';
    weekByName[key] = (weekByName[key] || 0) + parseFloat(r.unblended_cost || 0);
  }
  const dailyAvg7d = Object.values(weekByName).reduce((s, v) => s + v, 0) / daysInWeek;

  const yesterdayByName = {};
  for (const r of yesterday) {
    const key = r.service_name || r.enhanced_service_name || 'Unknown';
    yesterdayByName[key] = { cost: (yesterdayByName[key]?.cost || 0) + parseFloat(r.unblended_cost || 0), vendor: r.vendor_name || r.vendor || '' };
  }

  const topMovers = [];
  const newServices = [];
  for (const [name, { cost, vendor }] of Object.entries(yesterdayByName)) {
    const avg = (weekByName[name] || 0) / daysInWeek;
    if (avg === 0) {
      newServices.push({ name, vendor, cost });
    } else {
      const change = cost - avg;
      const pctChange = (change / avg) * 100;
      topMovers.push({ name, vendor, cost, change, pctChange });
    }
  }
  topMovers.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  const changeVsAvg = dailyAvg7d ? ((yesterdayTotal - dailyAvg7d) / dailyAvg7d) * 100 : 0;
  const changeVsPrior = priorMtdTotal ? ((mtdTotal - priorMtdTotal) / priorMtdTotal) * 100 : 0;

  const alerts = [];
  if (changeVsAvg > 20) alerts.push(`Yesterday spend ${changeVsAvg.toFixed(1)}% above 7-day avg`);
  if (newServices.length) alerts.push(`${newServices.length} new service(s) detected`);

  return { yesterdayTotal, dailyAvg7d, mtdTotal, priorMtdTotal, changeVsAvg, changeVsPrior, topMovers: topMovers.slice(0, 10), newServices, alerts };
}
