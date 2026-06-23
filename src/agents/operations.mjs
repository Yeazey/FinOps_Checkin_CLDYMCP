const fmt = n => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

export function analyzeOperations(data) {
  const { rightsizing, budgets, views, mtdVendor, dates } = data || {};
  const recs = Array.isArray(rightsizing) ? rightsizing : [];
  const budgetList = Array.isArray(budgets) ? budgets : [];
  const viewList = Array.isArray(views) ? views : [];
  const vendors = mtdVendor?.results || [];

  // Recommendation lifecycle analysis
  const done = recs.filter(r => r.status === 'Done');
  const inProgress = recs.filter(r => r.status === 'In Progress');
  const toDo = recs.filter(r => r.status === 'To Do');
  const backlog = recs.filter(r => r.status === 'Backlog');
  const adoptionRate = recs.length > 0 ? (done.length + inProgress.length) / recs.length : 0;
  const actionRate = recs.length > 0 ? done.length / recs.length : 0;

  // Age analysis
  const today = new Date(dates.today);
  const avgAge = recs.length > 0 ? Math.round(recs.reduce((s, r) => s + (today - new Date(r.createdAt)) / 86400000, 0) / recs.length) : 0;
  const oldestUnresolved = recs.filter(r => r.status !== 'Done').sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
  const oldestAge = oldestUnresolved ? Math.round((today - new Date(oldestUnresolved.createdAt)) / 86400000) : 0;

  // Maturity indicators
  const maturity = {
    budgetCoverage: budgetList.length > 0 ? 'yes' : 'no',
    budgetCount: budgetList.length,
    viewCount: viewList.length,
    multiCloud: vendors.length >= 3,
    recommendationVolume: recs.length,
    adoptionHealthy: adoptionRate > 0.3,
    hasJiraIntegration: recs.some(r => r.integrationType === 'JIRA'),
    hasServiceNow: recs.some(r => r.integrationType === 'SERVICE_NOW'),
  };

  const maturityScore = [maturity.budgetCoverage === 'yes', maturity.viewCount > 5, maturity.adoptionHealthy, maturity.hasJiraIntegration || maturity.hasServiceNow, maturity.multiCloud].filter(Boolean).length;
  const maturityLevel = maturityScore >= 4 ? 'Run' : maturityScore >= 3 ? 'Walk' : 'Crawl';

  // Governance gaps
  const gaps = [];
  if (budgetList.length < 5) gaps.push(`Only ${budgetList.length} budgets configured — most spend likely unbudgeted`);
  if (adoptionRate < 0.2) gaps.push(`Only ${(adoptionRate * 100).toFixed(0)}% of recommendations in progress or completed — execution gap`);
  if (avgAge > 60) gaps.push(`Average recommendation age is ${avgAge} days — backlog growing stale`);
  if (!maturity.hasJiraIntegration && !maturity.hasServiceNow) gaps.push('No ticketing integration detected — recommendations may lack workflow tracking');

  // Planning items with specifics
  const thisWeek = [];
  if (toDo.length > 0) thisWeek.push(`Triage ${toDo.length} "To Do" recommendations (${fmt(toDo.reduce((s, r) => s + parseFloat(r.potentialSavings || 0), 0))}/mo at stake)`);
  if (inProgress.length > 0) thisWeek.push(`Follow up on ${inProgress.length} in-progress items — are they moving?`);
  thisWeek.push(`Review anomaly alerts — ${recs.filter(r => r.status === 'To Do' && parseFloat(r.potentialSavings || 0) > 1000).length} high-value items need assignment`);

  const thisMonth = [];
  if (gaps.length > 0) thisMonth.push(`Address governance gaps: ${gaps[0]}`);
  thisMonth.push(`Budget review: ensure all top-spend accounts have budget thresholds`);
  thisMonth.push(`Commitment planning: review RI/SP coverage and upcoming expirations`);

  const thisQuarter = [];
  thisQuarter.push(`FinOps maturity: currently "${maturityLevel}" — identify capabilities to advance`);
  thisQuarter.push(`Vendor contract review: EDP/MACC burn rates and renewal windows`);
  if (vendors.length > 3) thisQuarter.push(`Multi-cloud strategy review: ${vendors.length} providers — consolidation or intentional spread?`);

  // Engagement by team (from assignees)
  const assigneeMap = {};
  for (const r of recs) {
    const assignee = r.assignee || 'Unassigned';
    if (!assigneeMap[assignee]) assigneeMap[assignee] = { name: assignee, total: 0, done: 0, savings: 0 };
    assigneeMap[assignee].total++;
    if (r.status === 'Done') assigneeMap[assignee].done++;
    assigneeMap[assignee].savings += parseFloat(r.potentialSavings || 0);
  }
  const engagement = Object.values(assigneeMap).sort((a, b) => b.savings - a.savings).slice(0, 5);

  // Alerts
  const alerts = [];
  if (adoptionRate < 0.15) alerts.push({ severity: 'high', message: `Recommendation adoption at ${(adoptionRate * 100).toFixed(0)}% — most savings going unrealized`, costOfInaction: 500, effort: 'sprint', source: 'operations', confidence: 0.9 });
  if (gaps.length > 2) alerts.push({ severity: 'medium', message: `${gaps.length} governance gaps identified — process maturity at risk`, costOfInaction: 200, effort: 'sprint', source: 'operations', confidence: 0.7 });

  return {
    maturityLevel, maturityScore, maturity, adoptionRate, actionRate,
    statusCounts: { done: done.length, inProgress: inProgress.length, toDo: toDo.length, backlog: backlog.length },
    avgAge, oldestAge, gaps, engagement,
    planningItems: { thisWeek, thisMonth, thisQuarter },
    budgetCount: budgetList.length, viewCount: viewList.length, alerts
  };
}
