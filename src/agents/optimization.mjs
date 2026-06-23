const fmt = n => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

export function analyzeOptimization(data) {
  const recs = Array.isArray(data.rightsizing) ? data.rightsizing : [];
  const instances = data.instanceTypes?.results || [];
  const today = new Date(data.dates.today);

  // --- Rightsizing deep dive ---
  const totalSavings = recs.reduce((s, r) => s + parseFloat(r.potentialSavings || 0), 0);
  const avgPctSavings = recs.length > 0 ? recs.reduce((s, r) => s + parseFloat(r.percentSavings || 0), 0) / recs.length : 0;

  // Enrich with age and categorize
  const enriched = recs.map(r => {
    const age = Math.round((today - new Date(r.createdAt)) / 86400000);
    return { ...r, age, savings: parseFloat(r.potentialSavings || 0), pctSavings: parseFloat(r.percentSavings || 0) };
  });

  const topRecs = enriched.sort((a, b) => b.savings - a.savings).slice(0, 10);

  // By service category
  const byService = {};
  for (const r of enriched) {
    const svc = r.vendorService || 'Unknown';
    if (!byService[svc]) byService[svc] = { service: svc, count: 0, savings: 0 };
    byService[svc].count++;
    byService[svc].savings += r.savings;
  }
  const serviceBreakdown = Object.values(byService).sort((a, b) => b.savings - a.savings);

  // Stale analysis
  const stale = enriched.filter(r => r.age > 30 && r.status !== 'Done');
  const staleSavings = stale.reduce((s, r) => s + r.savings, 0);
  const veryStale = enriched.filter(r => r.age > 90);

  // By status
  const statusCounts = {};
  for (const r of enriched) { statusCounts[r.status || 'Unknown'] = (statusCounts[r.status || 'Unknown'] || 0) + 1; }

  // Adoption rate
  const done = enriched.filter(r => r.status === 'Done').length;
  const inProgress = enriched.filter(r => r.status === 'In Progress').length;
  const adoptionRate = enriched.length > 0 ? (done + inProgress) / enriched.length : 0;

  // --- Chip/Instance analysis ---
  const chipMap = { Intel: 0, AMD: 0, Graviton: 0, 'NVIDIA GPU': 0, ARM: 0, Other: 0 };
  let computeTotal = 0;
  for (const r of instances) {
    const type = (r.instance_type || '').toLowerCase();
    const cost = parseFloat(r.unblended_cost);
    computeTotal += cost;
    if (/g\d|graviton|[a-z]\d+g/.test(type) && /amazon/i.test(r.vendor || '')) chipMap.Graviton += cost;
    else if (/[a-z]\d+a|amd/i.test(type)) chipMap.AMD += cost;
    else if (/p\d|g\d.*xlarge|nc|nd|nv.*v\d/i.test(type)) chipMap['NVIDIA GPU'] += cost;
    else if (/ampere|axion/i.test(type)) chipMap.ARM += cost;
    else if (cost > 0) chipMap.Intel += cost;
  }
  const chipBreakdown = Object.entries(chipMap).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
    .map(([chip, cost]) => ({ chip, cost, pct: ((cost / computeTotal) * 100).toFixed(1) }));

  // Migration opportunity: Intel → Graviton savings estimate (20-40%)
  const intelSpend = chipMap.Intel;
  const gravitonOpportunity = Math.round(intelSpend * 0.25); // conservative 25% savings estimate

  // Quick wins vs complex
  const quickWins = enriched.filter(r => r.savings > 100 && r.pctSavings > 50 && r.age < 60).slice(0, 5);
  const complexOps = enriched.filter(r => r.savings > 500 && r.vendorService?.includes('Container')).slice(0, 5);

  // Alerts
  const alerts = [];
  for (const r of topRecs.slice(0, 3)) {
    alerts.push({
      severity: r.savings > 1500 ? 'high' : 'medium',
      message: `Rightsize ${r.vendorService}: ${r.resourceType} → ${r.recommendedResourceType} (${r.pctSavings}% oversized, ${r.age}d old)`,
      savings: r.savings, costOfInaction: Math.round(r.savings / 30),
      effort: r.vendorService?.includes('Container') ? 'sprint' : 'hours',
      source: 'optimization', confidence: 0.85
    });
  }
  if (gravitonOpportunity > 5000) {
    alerts.push({
      severity: 'medium',
      message: `Intel→Graviton migration opportunity: ~${fmt(gravitonOpportunity)}/mo (${chipBreakdown.find(c => c.chip === 'Intel')?.pct || 0}% of compute is Intel)`,
      savings: gravitonOpportunity, costOfInaction: Math.round(gravitonOpportunity / 30),
      effort: 'sprint', source: 'optimization', confidence: 0.7
    });
  }
  if (stale.length > 10) {
    alerts.push({
      severity: 'high',
      message: `${stale.length} recommendations stale >30 days (${fmt(staleSavings)}/mo lost). ${veryStale.length} are >90 days old.`,
      savings: staleSavings, costOfInaction: Math.round(staleSavings / 30),
      effort: 'sprint', source: 'optimization', confidence: 0.8
    });
  }

  return {
    totalSavings, avgPctSavings, topRecs, serviceBreakdown, staleCount: stale.length,
    staleSavings, veryStaleCount: veryStale.length, statusCounts, adoptionRate,
    chipBreakdown, computeTotal, gravitonOpportunity, intelSpend,
    quickWins, complexOps, alerts
  };
}
