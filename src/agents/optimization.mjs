export function analyzeOptimization(data) {
  const recs = data.rightsizing || [];
  const instanceTypes = data.instanceTypes?.results || [];
  const dates = data.dates;
  const today = new Date(dates.today);

  const totalSavings = recs.reduce((s, r) => s + parseFloat(r.potentialSavings || 0), 0);
  const avgOversized = recs.length ? recs.reduce((s, r) => s + parseFloat(r.percentSavings || 0), 0) / recs.length : 0;

  const sorted = [...recs].sort((a, b) => parseFloat(b.potentialSavings || 0) - parseFloat(a.potentialSavings || 0));
  const topRecs = sorted.slice(0, 5).map(r => {
    const age = Math.round((today - new Date(r.createdAt)) / 86400000);
    return { resource: r.resourceName, service: r.vendorService, current: r.resourceType, recommended: r.recommendedResourceType, savings: parseFloat(r.potentialSavings || 0), pctSavings: parseFloat(r.percentSavings || 0), age };
  });

  let staleCount = 0, staleSavings = 0;
  for (const r of recs) {
    const age = Math.round((today - new Date(r.createdAt)) / 86400000);
    if (age > 30) { staleCount++; staleSavings += parseFloat(r.potentialSavings || 0); }
  }

  const chipMap = {};
  for (const r of instanceTypes) {
    const type = r.instance_type || r.resource_type || '';
    let chip = 'x86';
    if (/g\d/.test(type) || /graviton/i.test(type)) chip = 'graviton';
    else if (/a\d/.test(type) && /aws/i.test(r.vendor || '')) chip = 'graviton';
    chipMap[chip] = (chipMap[chip] || 0) + 1;
  }
  const chipOpportunities = Object.entries(chipMap).map(([chip, count]) => ({ chip, count }));

  const alerts = [];
  if (topRecs.length > 0) {
    const top = topRecs[0];
    alerts.push({ severity: 'high', message: `Rightsize ${top.service}: ${top.current} → ${top.recommended}`, savings: top.savings, costOfInaction: Math.round(top.savings / 30), effort: 'hours', source: 'rightsizing', confidence: 0.85 });
  }
  if (staleCount > 10) alerts.push({ severity: 'medium', message: `${staleCount} stale recs (>30d) worth ${Math.round(staleSavings)}/mo — execution gap`, savings: staleSavings, costOfInaction: Math.round(staleSavings / 30), effort: 'sprint', source: 'rightsizing', confidence: 0.8 });

  return { totalSavings, topRecs, staleCount, staleSavings, avgOversized, chipOpportunities, alerts };
}
