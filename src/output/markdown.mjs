const fmt = n => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
const pct = n => (n != null ? `${parseFloat(n) > 0 ? '+' : ''}${parseFloat(n).toFixed(1)}%` : '—');
const trend = n => { const v = parseFloat(n); return v > 5 ? `🔴 +${v.toFixed(1)}%` : v > 0 ? `🟡 +${v.toFixed(1)}%` : v < -5 ? `🟢 ${v.toFixed(1)}%` : v < 0 ? `🟢 ${v.toFixed(1)}%` : '→ flat'; };

export function renderMarkdown(report) {
  const { dayOfWeek, dateStr, dayOfMonth, daysInMonth, daysLeft, oneLiner, costs, forecast, optimization, anomalies, operations, actions, deepDives } = report;
  const L = [];

  // Header
  L.push(`# 🎯 FinOps Daily Standup — ${dayOfWeek}, ${dateStr}`);
  L.push(`> Day ${dayOfMonth}/${daysInMonth} | ${daysLeft} days remaining | ${costs.vendors?.length || 0} providers | ${optimization.topRecs?.length || 0}+ recommendations tracked`);
  L.push('');
  L.push(`**TL;DR:** ${oneLiner}`);
  L.push('');

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIORITY ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  L.push('---');
  L.push('## ⚡ Priority Actions');
  L.push('*Ranked by cost-of-inaction — what to do today*');
  L.push('');
  L.push('| # | Sev | Phase | Action | Savings/mo | Cost of Inaction | Owner | Effort |');
  L.push('|---|-----|-------|--------|-----------|-----------------|-------|--------|');
  for (const [i, a] of (actions.priorityActions || []).slice(0, 8).entries()) {
    const sev = a.severity === 'critical' ? '🔴' : a.severity === 'high' ? '🟡' : '🔵';
    const phase = a.source?.includes('anomaly') || a.source?.includes('cost') ? 'INFORM' : a.source?.includes('optim') ? 'OPTIMIZE' : 'OPERATE';
    L.push(`| ${i + 1} | ${sev} | ${phase} | ${a.title} | ${a.savings > 0 ? fmt(a.savings) : '—'} | ${a.costOfInaction > 0 ? fmt(a.costOfInaction) + '/day' : '—'} | ${a.owner} | ${a.effort} |`);
  }
  L.push('');

  // ═══════════════════════════════════════════════════════════════════════════
  // INFORM PHASE
  // ═══════════════════════════════════════════════════════════════════════════
  L.push('---');
  L.push('## 👁️ INFORM — Visibility, Allocation & Understanding');
  L.push('');

  // Spend Snapshot
  L.push('### Spend Snapshot');
  L.push('');
  L.push(`| Metric | Value |`);
  L.push(`|--------|-------|`);
  L.push(`| **MTD Spend** | ${fmt(costs.mtdTotal)} ${costs.mtdVsPrior ? `(${trend(costs.mtdVsPrior)} vs prior month)` : ''} |`);
  L.push(`| **Daily Rate** | ${fmt(costs.dailyRate)}/day ${forecast.rateChange ? `(${trend(forecast.rateChange)} vs last month)` : ''} |`);
  L.push(`| **Projected Month-End** | ${fmt(forecast.projected)} |`);
  L.push(`| **Annualized Rate** | ${fmt(forecast.annualizedRate)} |`);
  L.push(`| **Burn Rate to Stay on Track** | ${fmt((forecast.budgetTotal - costs.mtdTotal) / Math.max(daysLeft, 1))}/day |`);
  L.push('');

  // Provider Breakdown
  L.push('### Provider Breakdown');
  L.push('');
  L.push('| Provider | MTD Cost | Share | Trend |');
  L.push('|----------|---------|-------|-------|');
  for (const v of (costs.vendors || [])) {
    L.push(`| ${v.name} | ${fmt(v.cost)} | ${v.share}% | ${v.change !== 'new' ? trend(v.change) : '🆕 NEW'} |`);
  }
  L.push('');

  // Top Accounts
  if (costs.accounts?.length > 0) {
    L.push('### Top Accounts (MTD)');
    L.push('');
    L.push('| Account | Cost | Share |');
    L.push('|---------|------|-------|');
    for (const a of costs.accounts.slice(0, 10)) {
      L.push(`| ${(a.name || 'unnamed').slice(0, 45)} | ${fmt(a.cost)} | ${a.share}% |`);
    }
    L.push('');
  }

  // Week-over-Week Movers
  L.push('### Week-over-Week Movers');
  L.push('');
  if (costs.risers?.length > 0) {
    L.push('**📈 Rising:**');
    L.push('');
    L.push('| Vendor | Service | Δ Cost | Change |');
    L.push('|--------|---------|--------|--------|');
    for (const m of costs.risers.slice(0, 7)) {
      const ddKey = `spike|${m.vendor}|${m.service}`;
      const dd = deepDives?.[ddKey];
      const accts = dd?.byAccount?.slice(0, 3).map(a => `${a.vendor_account_name} (${fmt(parseFloat(a.unblended_cost))})`).join(', ');
      L.push(`| ${m.vendor} | ${m.service} | +${fmt(m.delta)} | ${m.pctChange === 'new' ? '🆕 NEW' : `+${m.pctChange}%`} |`);
      if (accts) L.push(`| | ↳ *Accounts: ${accts}* | | |`);
    }
    L.push('');
  }
  if (costs.fallers?.length > 0) {
    L.push('**📉 Falling:**');
    L.push('');
    L.push('| Vendor | Service | Δ Cost | Change |');
    L.push('|--------|---------|--------|--------|');
    for (const m of costs.fallers.slice(0, 5)) {
      L.push(`| ${m.vendor} | ${m.service} | ${fmt(m.delta)} | ${m.pctChange}% |`);
    }
    L.push('');
  }

  // New Services
  if (costs.newServices?.length > 0) {
    L.push('### 🆕 New Services This Week');
    L.push('');
    for (const s of costs.newServices.slice(0, 5)) {
      const ddKey = `${s.vendor}|${s.service}`;
      const dd = deepDives?.[ddKey];
      L.push(`- **${s.vendor} › ${s.service}** — ${fmt(s.cost)} this week`);
      if (dd?.byAccount?.length > 0) L.push(`  - Accounts: ${dd.byAccount.slice(0, 3).map(a => `${a.vendor_account_name} (${fmt(parseFloat(a.unblended_cost))})`).join(', ')}`);
      if (dd?.byRegion?.length > 0) L.push(`  - Regions: ${dd.byRegion.slice(0, 3).map(r => `${r.region} (${fmt(parseFloat(r.unblended_cost))})`).join(', ')}`);
    }
    L.push('');
  }

  // Anomalies
  L.push('### Anomaly Detection');
  L.push(`> ${anomalies.totalAnomalies} active anomalies — ${anomalies.critical?.length || 0} critical, ${anomalies.warning?.length || 0} warning`);
  L.push('');
  if (anomalies.critical?.length > 0) {
    L.push('**🔴 Critical:**');
    L.push('');
    for (const a of anomalies.critical.slice(0, 5)) {
      const ddKey = `anomaly|${a.service}`;
      const dd = deepDives?.[ddKey];
      L.push(`- **${a.service || 'Unknown'}** — +${fmt(a.spend)} unusual spend${a.viewName ? ` [${a.viewName}]` : ''}`);
      if (dd?.byAccount?.length > 0) L.push(`  - Source: ${dd.byAccount.slice(0, 3).map(x => `${x.vendor_account_name || 'unknown'} (${fmt(parseFloat(x.unblended_cost))})`).join(', ')}`);
    }
    L.push('');
  }
  if (anomalies.warning?.length > 0) {
    L.push('**🟡 Warning:**');
    L.push('');
    for (const a of anomalies.warning.slice(0, 6)) {
      L.push(`- ${a.service || 'Unknown'} — +${fmt(a.spend)} unusual${a.viewName ? ` [${a.viewName}]` : ''}`);
    }
    if (anomalies.warning.length > 6) L.push(`- *...and ${anomalies.warning.length - 6} more*`);
    L.push('');
  }
  if (anomalies.riskPatterns?.length > 0) {
    L.push('**⚡ Risk Patterns:**');
    for (const p of anomalies.riskPatterns) L.push(`- ${p}`);
    L.push('');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIMIZE PHASE
  // ═══════════════════════════════════════════════════════════════════════════
  L.push('---');
  L.push('## ⚡ OPTIMIZE — Rate & Usage Optimization');
  L.push('');

  // Rightsizing Pipeline
  L.push('### Rightsizing Pipeline');
  L.push('');
  L.push(`| Metric | Value |`);
  L.push(`|--------|-------|`);
  L.push(`| **Total Addressable Savings** | ${fmt(optimization.totalSavings)}/mo (${fmt(optimization.totalSavings * 12)}/yr) |`);
  L.push(`| **Average Oversizing** | ${optimization.avgPctSavings.toFixed(0)}% |`);
  L.push(`| **Fleet Adoption** | ${(optimization.adoptionRate * 100).toFixed(0)}% |`);
  L.push('');

  L.push('**Top Recommendations:**');
  L.push('');
  L.push('| Service | Current | Recommended | Savings/mo | % | Age |');
  L.push('|---------|---------|-------------|-----------|---|-----|');
  for (const r of (optimization.topRecs || []).slice(0, 10)) {
    const ageFlag = r.age > 90 ? '🔴' : r.age > 30 ? '🟡' : '';
    L.push(`| ${(r.vendorService || '').slice(0, 20)} | ${(r.resourceType || '').slice(0, 24)} | ${(r.recommendedResourceType || '').slice(0, 22)} | ${fmt(r.savings)} | ${r.pctSavings}% | ${ageFlag} ${r.age}d |`);
  }
  L.push('');

  // Savings by category
  if (optimization.serviceBreakdown?.length > 0) {
    L.push('**Savings by Service:**');
    L.push('');
    L.push('| Service | Recs | Savings/mo |');
    L.push('|---------|------|-----------|');
    for (const s of optimization.serviceBreakdown.slice(0, 6)) {
      L.push(`| ${s.service} | ${s.count} | ${fmt(s.savings)} |`);
    }
    L.push('');
  }

  // Execution status
  L.push('### Execution Status');
  L.push('');
  const sc = optimization.statusCounts || {};
  L.push(`| Status | Count |`);
  L.push(`|--------|-------|`);
  L.push(`| ✅ Done | ${sc.done || 0} |`);
  L.push(`| 🔄 In Progress | ${sc.inProgress || 0} |`);
  L.push(`| 📋 To Do | ${sc.toDo || 0} |`);
  L.push(`| 📦 Backlog | ${sc.backlog || 0} |`);
  L.push(`| ⚠️ Stale >30d | ${optimization.staleCount} (${fmt(optimization.staleSavings)}/mo unrealized) |`);
  L.push(`| 🔴 Stale >90d | ${optimization.veryStaleCount} — *likely won't be acted on without intervention* |`);
  L.push('');

  // Chip Architecture
  if (optimization.chipBreakdown?.length > 0) {
    L.push('### Chip Architecture');
    L.push(`> Compute spend: ${fmt(optimization.computeTotal)}`);
    L.push('');
    L.push('| Chip | Cost | Share |');
    L.push('|------|------|-------|');
    for (const ch of optimization.chipBreakdown) {
      L.push(`| ${ch.chip} | ${fmt(ch.cost)} | ${ch.pct}% |`);
    }
    if (optimization.gravitonOpportunity > 1000) {
      L.push('');
      L.push(`> 💡 **Migration potential:** ${fmt(optimization.gravitonOpportunity)}/mo savings by moving 25% of Intel → Graviton/ARM`);
    }
    L.push('');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPERATE PHASE
  // ═══════════════════════════════════════════════════════════════════════════
  L.push('---');
  L.push('## 🏛️ OPERATE — Governance, Budgets & Accountability');
  L.push('');

  // Budget Health
  L.push('### Budget Health');
  L.push('');
  if (forecast.budgetTotal > 0) {
    const status = forecast.budgetPctConsumed > forecast.calendarPct + 5 ? '🔴 Over-pacing' : '🟢 On-track';
    L.push(`| Metric | Value |`);
    L.push(`|--------|-------|`);
    L.push(`| **Total Budget** | ${fmt(forecast.budgetTotal)} |`);
    L.push(`| **Consumed** | ${forecast.budgetPctConsumed.toFixed(1)}% (calendar: ${forecast.calendarPct.toFixed(0)}%) |`);
    L.push(`| **Status** | ${status} |`);
    if (forecast.daysToExceed && forecast.daysToExceed < daysLeft) {
      L.push(`| **⚠️ Budget Breach** | Projected in ${forecast.daysToExceed} days at current rate |`);
    }
    L.push('');
  }
  if (forecast.budgetsAtRisk?.length > 0) {
    L.push('**At-Risk Budgets:**');
    L.push('');
    L.push('| Budget | Projected Over |');
    L.push('|--------|---------------|');
    for (const b of forecast.budgetsAtRisk.slice(0, 5)) {
      L.push(`| ${b.name} | +${b.projectedVsBudget}% |`);
    }
    L.push('');
  }

  // Maturity
  L.push('### FinOps Maturity');
  L.push('');
  L.push(`**Level: ${operations.maturityLevel}** (${operations.maturityScore}/5)`);
  L.push('');
  L.push(`| Indicator | Value |`);
  L.push(`|-----------|-------|`);
  L.push(`| Budgets | ${operations.budgetCount} |`);
  L.push(`| Views | ${operations.viewCount} |`);
  L.push(`| Adoption Rate | ${(operations.adoptionRate * 100).toFixed(0)}% |`);
  L.push(`| Avg Rec Age | ${operations.avgAge}d |`);
  L.push('');
  if (operations.gaps?.length > 0) {
    L.push('**⚠️ Governance Gaps:**');
    for (const g of operations.gaps) L.push(`- ${g}`);
    L.push('');
  }

  // Team Engagement
  if (operations.engagement?.length > 0) {
    L.push('### Team Engagement');
    L.push('');
    L.push('| Assignee | Recs | Potential Savings | Completion |');
    L.push('|----------|------|------------------|------------|');
    for (const e of operations.engagement.slice(0, 8)) {
      const rate = e.total > 0 ? `${Math.round(e.done / e.total * 100)}%` : '0%';
      const flag = e.done / Math.max(e.total, 1) < 0.1 ? ' ⚠️' : '';
      L.push(`| ${e.name || 'Unassigned'} | ${e.total} | ${fmt(e.savings)} | ${rate}${flag} |`);
    }
    L.push('');
  }

  // Planning Horizon
  L.push('### Planning Horizon');
  L.push('');
  if (operations.planningItems?.thisWeek?.length > 0) {
    L.push('**This Week:**');
    for (const item of operations.planningItems.thisWeek) L.push(`- [ ] ${item}`);
    L.push('');
  }
  if (operations.planningItems?.thisMonth?.length > 0) {
    L.push('**This Month:**');
    for (const item of operations.planningItems.thisMonth) L.push(`- [ ] ${item}`);
    L.push('');
  }
  if (operations.planningItems?.thisQuarter?.length > 0) {
    L.push('**This Quarter:**');
    for (const item of operations.planningItems.thisQuarter) L.push(`- [ ] ${item}`);
    L.push('');
  }

  // Meetings
  if (actions.meetings?.length > 0) {
    L.push('### 📅 Recommended Meetings');
    L.push('');
    L.push('| Day | Who | Topic | Duration |');
    L.push('|-----|-----|-------|----------|');
    for (const m of actions.meetings) {
      L.push(`| ${m.day} | ${m.who} | ${m.topic} | ${m.duration} |`);
    }
    L.push('');
  }

  // Insight
  if (actions.insightOfDay) {
    L.push('---');
    L.push(`## 💡 Insight of the Day`);
    L.push('');
    L.push(`> ${actions.insightOfDay}`);
    L.push('');
  }

  // Footer
  L.push('---');
  L.push(`*FinOps Daily Intelligence • 7 agents • ${Object.keys(deepDives || {}).length} deep dives • Cloudability MCP*`);
  L.push(`*Generated: ${new Date().toISOString()}*`);

  return L.join('\n');
}
