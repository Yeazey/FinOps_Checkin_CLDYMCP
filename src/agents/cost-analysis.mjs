const fmt = n => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
const pct = (a, b) => b > 0 ? ((a / b - 1) * 100).toFixed(1) : '0.0';

export function analyzeCosts(data) {
  const { mtdVendor, mtdService, priorMtdVendor, priorMtdService, thisWeekService, lastWeekService, mtdAccount, dates } = data;

  // MTD totals
  const mtdResults = mtdVendor?.results || [];
  const mtdTotal = parseFloat(mtdVendor?.meta?.aggregates?.[0]?.value || 0);
  const priorMtdTotal = parseFloat(priorMtdVendor?.meta?.aggregates?.[0]?.value || 0);
  const mtdVsPrior = priorMtdTotal > 0 ? ((mtdTotal / priorMtdTotal - 1) * 100).toFixed(1) : null;

  // Vendor breakdown
  const vendors = mtdResults.map(v => {
    const priorVendor = (priorMtdVendor?.results || []).find(p => p.vendor === v.vendor);
    const cost = parseFloat(v.unblended_cost);
    const prior = priorVendor ? parseFloat(priorVendor.unblended_cost) : 0;
    const change = prior > 0 ? ((cost / prior - 1) * 100).toFixed(1) : 'new';
    return { name: v.vendor, cost, prior, change, share: ((cost / mtdTotal) * 100).toFixed(1) };
  }).filter(v => v.cost > 0);

  // Week-over-week service movers
  const thisWeekMap = {};
  for (const r of (thisWeekService?.results || [])) {
    const key = `${r.vendor}|${r.service_name}`;
    thisWeekMap[key] = { vendor: r.vendor, service: r.service_name, cost: parseFloat(r.unblended_cost) };
  }
  const lastWeekMap = {};
  for (const r of (lastWeekService?.results || [])) {
    const key = `${r.vendor}|${r.service_name}`;
    lastWeekMap[key] = parseFloat(r.unblended_cost);
  }

  const weekMovers = Object.entries(thisWeekMap).map(([key, curr]) => {
    const prior = lastWeekMap[key] || 0;
    const delta = curr.cost - prior;
    const pctChange = prior > 0 ? ((curr.cost / prior - 1) * 100).toFixed(1) : (curr.cost > 1000 ? 'new' : null);
    return { ...curr, prior, delta, pctChange };
  }).filter(m => m.pctChange !== null && Math.abs(m.delta) > 500)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const risers = weekMovers.filter(m => m.delta > 0).slice(0, 8);
  const fallers = weekMovers.filter(m => m.delta < 0).slice(0, 5);

  // New services (this week, not last week, cost > $500)
  const newServices = Object.entries(thisWeekMap)
    .filter(([key, v]) => !lastWeekMap[key] && v.cost > 500)
    .map(([, v]) => v);

  // Top accounts
  const accounts = (mtdAccount?.results || []).slice(0, 10).map(r => ({
    vendor: r.vendor, name: r.vendor_account_name, cost: parseFloat(r.unblended_cost),
    share: ((parseFloat(r.unblended_cost) / mtdTotal) * 100).toFixed(1)
  }));

  // Top services MTD
  const topServices = (mtdService?.results || []).slice(0, 15).map(r => {
    const priorMatch = (priorMtdService?.results || []).find(p => p.service_name === r.service_name && p.vendor === r.vendor);
    const cost = parseFloat(r.unblended_cost);
    const prior = priorMatch ? parseFloat(priorMatch.unblended_cost) : 0;
    return { vendor: r.vendor, service: r.service_name, cost, prior, change: prior > 0 ? ((cost / prior - 1) * 100).toFixed(1) : 'new' };
  });

  // Days in month math
  const now = new Date(dates.today);
  const daysElapsed = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyRate = mtdTotal / daysElapsed;
  const projected = dailyRate * daysInMonth;

  // Alerts for actions agent
  const alerts = [];
  if (risers.length > 0 && risers[0].delta > 10000) {
    alerts.push({ severity: 'high', message: `${risers[0].vendor} ${risers[0].service} up ${fmt(risers[0].delta)} WoW (+${risers[0].pctChange}%)`, savings: 0, costOfInaction: Math.round(risers[0].delta / 7), effort: 'hours', source: 'cost-analysis', confidence: 0.9 });
  }
  if (newServices.length > 0) {
    alerts.push({ severity: 'medium', message: `${newServices.length} new services detected this week (${newServices.map(s => s.service).join(', ')})`, savings: 0, costOfInaction: 0, effort: 'hours', source: 'cost-analysis', confidence: 0.7 });
  }

  return {
    mtdTotal, priorMtdTotal, mtdVsPrior, projected, dailyRate, daysElapsed, daysInMonth,
    vendors, topServices, risers, fallers, newServices, accounts, alerts
  };
}
