export function analyzeOperations(data) {
  const { rightsizing, budgets, views, mtdByVendor, dates } = data || {};
  const recs = Array.isArray(rightsizing) ? rightsizing : [];
  const budgetList = Array.isArray(budgets) ? budgets : [];
  const viewList = Array.isArray(views) ? views : [];

  const done = recs.filter(r => r.status === 'Done').length;
  const inProgress = recs.filter(r => r.status === 'In Progress').length;
  const total = recs.length;
  const adoptionRate = total > 0 ? (done + inProgress) / total : 0;

  // Maturity: simple score 1-5 based on coverage signals
  const hasbudgets = budgetList.length > 0;
  const hasViews = viewList.length >= 3;
  const hasRightsizing = total > 0;
  const highAdoption = adoptionRate > 0.5;
  const maturityScore = [hasbudgets, hasViews, hasRightsizing, highAdoption].filter(Boolean).length + 1;
  const levels = ['', 'crawl', 'crawl', 'walk', 'run', 'fly'];
  const maturityLevel = levels[maturityScore] || 'crawl';

  // Planning items
  const thisWeek = [];
  const thisMonth = [];
  const thisQuarter = [];

  const staleRecs = recs.filter(r => r.status === 'To Do' && r.potentialSavings > 100);
  if (staleRecs.length > 0) thisWeek.push({ action: 'Review stale recommendations', count: staleRecs.length, savings: staleRecs.reduce((s, r) => s + (r.potentialSavings || 0), 0) });

  const uncoveredViews = viewList.filter(v => !budgetList.some(b => b.viewId === v.id));
  if (uncoveredViews.length > 0) thisMonth.push({ action: 'Create budgets for uncovered views', count: uncoveredViews.length });

  if (maturityScore < 4) thisQuarter.push({ action: `Advance FinOps maturity from ${maturityLevel} to ${levels[maturityScore + 1]}` });

  // Engagement signals
  const engagementSignals = [];
  if (inProgress > 0) engagementSignals.push(`${inProgress} recommendations actively being worked`);
  if (mtdByVendor && Object.keys(mtdByVendor).length > 1) engagementSignals.push('Multi-cloud spend tracked');

  const alerts = [];
  if (adoptionRate < 0.2 && total > 5) alerts.push({ severity: 'high', message: `Low recommendation adoption: ${(adoptionRate * 100).toFixed(0)}%`, source: 'operations' });
  if (budgetList.length === 0) alerts.push({ severity: 'medium', message: 'No budgets configured', source: 'operations' });

  return { maturityLevel, adoptionRate, budgetCount: budgetList.length, viewCount: viewList.length, planningItems: { thisWeek, thisMonth, thisQuarter }, engagementSignals, alerts };
}
