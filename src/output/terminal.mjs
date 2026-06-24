const c = { reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m' };
const B = s => `${c.bold}${s}${c.reset}`;
const D = s => `${c.dim}${s}${c.reset}`;
const fmt = n => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
const arrow = ch => { const n = parseFloat(ch); return n > 5 ? `${c.red}▲ +${ch}%${c.reset}` : n > 0 ? `${c.yellow}▲ +${ch}%${c.reset}` : n < -5 ? `${c.green}▼ ${ch}%${c.reset}` : n < 0 ? `${c.green}▼ ${ch}%${c.reset}` : `${c.dim}→ flat${c.reset}`; };

export function renderTerminal(report) {
  const { dayOfWeek, dateStr, dayOfMonth, daysInMonth, daysLeft, oneLiner, costs, forecast, optimization, anomalies, operations, actions, deepDives } = report;
  const L = [];
  const hr = '═'.repeat(74);
  const hr2 = '─'.repeat(74);
  const phase = (emoji, title) => { L.push(''); L.push(`${c.magenta}${hr2}${c.reset}`); L.push(`${c.magenta}${c.bold} ${emoji} ${title}${c.reset}`); L.push(`${c.magenta}${hr2}${c.reset}`); };

  // ===== HEADER =====
  L.push('');
  L.push(`${c.magenta}${hr}${c.reset}`);
  L.push(`${c.magenta}  🎯 FINOPS DAILY STANDUP — ${dayOfWeek}, ${dateStr}${c.reset}`);
  L.push(`${c.dim}  Day ${dayOfMonth}/${daysInMonth} | ${daysLeft} days left | ${costs.vendors?.length || 0} providers | ${optimization.topRecs?.length || 0}+ recs tracked${c.reset}`);
  L.push(`${c.magenta}${hr}${c.reset}`);
  L.push('');
  L.push(`  ${c.cyan}${c.bold}${oneLiner}${c.reset}`);

  // ===== PRIORITY ACTIONS =====
  L.push('');
  L.push(`  ${c.red}${B('⚡ PRIORITY ACTIONS')}${c.reset} ${D('— highest cost-of-inaction items')}`);
  L.push('');
  for (const a of actions.priorityActions.slice(0, 8)) {
    const sev = a.severity === 'critical' ? `${c.red}🔴` : a.severity === 'high' ? `${c.yellow}🟡` : `${c.cyan}🔵`;
    const phaseTag = a.source?.includes('anomaly') || a.source?.includes('cost') ? `${c.dim}[INFORM]${c.reset}` : a.source?.includes('optim') ? `${c.dim}[OPTIMIZE]${c.reset}` : `${c.dim}[OPERATE]${c.reset}`;
    L.push(`  ${sev} ${phaseTag} ${B(a.title)}${c.reset}`);
    const parts = [];
    if (a.savings > 0) parts.push(`${c.green}saves ${fmt(a.savings)}/mo${c.reset}`);
    if (a.costOfInaction > 50) parts.push(`${c.red}losing ${fmt(a.costOfInaction)}/day${c.reset}`);
    parts.push(`owner: ${c.bold}${a.owner}${c.reset}`);
    parts.push(a.effort);
    L.push(`     ${parts.join(' │ ')}`);
  }

  // =========================================================================
  // INFORM PHASE
  // =========================================================================
  phase('👁️', 'INFORM — Visibility, Allocation & Understanding');

  // Spend overview
  L.push('');
  L.push(`  ${B('SPEND SNAPSHOT')}`);
  L.push(`  MTD: ${B(fmt(costs.mtdTotal))} ${costs.mtdVsPrior ? `(${arrow(costs.mtdVsPrior)} vs prior month)` : ''}`);
  L.push(`  Daily rate: ${fmt(costs.dailyRate)}/day ${forecast.rateChange ? `(${arrow(forecast.rateChange)} vs last month's rate)` : ''}`);
  L.push(`  Projected month-end: ${B(fmt(forecast.projected))} | Annualized: ${fmt(forecast.annualizedRate)}`);
  L.push(`  Days remaining: ${daysLeft} | Burn rate needed to stay on track: ${fmt((forecast.budgetTotal - costs.mtdTotal) / Math.max(daysLeft, 1))}/day`);
  L.push('');

  // Provider breakdown
  L.push(`  ${B('PROVIDER BREAKDOWN')}`);
  for (const v of costs.vendors) {
    const bar = '█'.repeat(Math.min(20, Math.round(parseFloat(v.share) / 5))) + '░'.repeat(Math.max(0, 20 - Math.round(parseFloat(v.share) / 5)));
    L.push(`  ${v.name.padEnd(13)} ${fmt(v.cost).padStart(13)}  ${v.share.padStart(5)}%  ${c.dim}${bar}${c.reset}  ${v.change !== 'new' ? arrow(v.change) : `${c.cyan}NEW${c.reset}`}`);
  }

  // Top accounts
  if (costs.accounts?.length > 0) {
    L.push('');
    L.push(`  ${B('TOP ACCOUNTS (MTD)')}`);
    for (const a of costs.accounts.slice(0, 8)) {
      L.push(`  ${(a.name || 'unnamed').slice(0, 35).padEnd(37)} ${fmt(a.cost).padStart(13)}  ${a.share}%`);
    }
  }

  // Week-over-week movers
  L.push('');
  L.push(`  ${B('WEEK-OVER-WEEK MOVERS')} ${D('— what changed vs last week')}`);
  if (costs.risers?.length > 0) {
    L.push(`  ${c.red}Rising:${c.reset}`);
    for (const m of costs.risers.slice(0, 7)) {
      L.push(`  ${c.red}▲${c.reset} ${m.vendor.padEnd(8)} ${m.service.slice(0, 42).padEnd(44)} +${fmt(m.delta).padStart(10)}  ${m.pctChange === 'new' ? `${c.cyan}NEW${c.reset}` : `+${m.pctChange}%`}`);
      // Deep dive context if available
      const ddKey = `spike|${m.vendor}|${m.service}`;
      const dd = deepDives?.[ddKey];
      if (dd?.byAccount?.length > 0) {
        L.push(`     ${c.cyan}└─ accounts: ${dd.byAccount.slice(0, 3).map(a => `${a.vendor_account_name} (${fmt(parseFloat(a.unblended_cost))})`).join(', ')}${c.reset}`);
      }
    }
  }
  if (costs.fallers?.length > 0) {
    L.push(`  ${c.green}Falling:${c.reset}`);
    for (const m of costs.fallers.slice(0, 5)) {
      L.push(`  ${c.green}▼${c.reset} ${m.vendor.padEnd(8)} ${m.service.slice(0, 42).padEnd(44)} ${fmt(m.delta).padStart(10)}  ${m.pctChange}%`);
    }
  }

  // New services with deep dive
  if (costs.newServices?.length > 0) {
    L.push('');
    L.push(`  ${c.cyan}${B('NEW SERVICES THIS WEEK')}${c.reset} ${D('— appeared for the first time')}`);
    for (const s of costs.newServices.slice(0, 5)) {
      L.push(`  ${c.cyan}★${c.reset} ${s.vendor} │ ${B(s.service)} │ ${fmt(s.cost)} this week`);
      const ddKey = `${s.vendor}|${s.service}`;
      const dd = deepDives?.[ddKey];
      if (dd) {
        if (dd.byAccount?.length > 0) {
          L.push(`     ${c.cyan}├─ Account(s): ${dd.byAccount.slice(0, 3).map(a => `${a.vendor_account_name} (${fmt(parseFloat(a.unblended_cost))})`).join(', ')}${c.reset}`);
        }
        if (dd.byRegion?.length > 0) {
          L.push(`     ${c.cyan}└─ Region(s): ${dd.byRegion.slice(0, 3).map(r => `${r.region} (${fmt(parseFloat(r.unblended_cost))})`).join(', ')}${c.reset}`);
        }
      }
    }
  }

  // Anomalies
  L.push('');
  L.push(`  ${B('ANOMALY DETECTION')} ${D(`— ${anomalies.totalAnomalies} active (${anomalies.critical?.length || 0} critical, ${anomalies.warning?.length || 0} warning)`)}`);
  if (anomalies.critical?.length > 0) {
    for (const a of anomalies.critical.slice(0, 5)) {
      L.push(`  ${c.red}🔴 ${(a.service || 'Unknown').padEnd(38)}${c.reset} +${fmt(a.spend)} unusual ${a.viewName ? D(`[${a.viewName}]`) : ''}`);
      const ddKey = `anomaly|${a.service}`;
      const dd = deepDives?.[ddKey];
      if (dd?.byAccount?.length > 0) {
        L.push(`     ${c.cyan}└─ Source: ${dd.byAccount.slice(0, 3).map(x => `${x.vendor_account_name || 'unknown'} (${fmt(parseFloat(x.unblended_cost))})`).join(', ')}${c.reset}`);
      }
    }
  }
  if (anomalies.warning?.length > 0) {
    for (const a of anomalies.warning.slice(0, 6)) {
      L.push(`  ${c.yellow}🟡 ${(a.service || 'Unknown').padEnd(38)}${c.reset} +${fmt(a.spend)} unusual ${a.viewName ? D(`[${a.viewName}]`) : ''}`);
    }
    if (anomalies.warning.length > 6) L.push(`  ${D(`   ... and ${anomalies.warning.length - 6} more warning-level anomalies`)}`);
  }
  if (anomalies.riskPatterns?.length > 0) {
    L.push('');
    for (const p of anomalies.riskPatterns) L.push(`  ${c.yellow}⚡ ${p}${c.reset}`);
  }

  // =========================================================================
  // OPTIMIZE PHASE
  // =========================================================================
  phase('⚡', 'OPTIMIZE — Rate & Usage Optimization');

  // Rightsizing
  L.push('');
  L.push(`  ${B('RIGHTSIZING PIPELINE')}`);
  L.push(`  Total addressable: ${c.green}${B(fmt(optimization.totalSavings))}/mo${c.reset} (${fmt(optimization.totalSavings * 12)}/yr)`);
  L.push(`  Average oversizing: ${optimization.avgPctSavings.toFixed(0)}% | Fleet adoption: ${(optimization.adoptionRate * 100).toFixed(0)}%`);
  L.push('');
  L.push(`  ${D('Top recommendations:')}`);
  for (const r of (optimization.topRecs || []).slice(0, 10)) {
    const ageColor = r.age > 90 ? c.red : r.age > 30 ? c.yellow : c.dim;
    L.push(`  • ${(r.vendorService || '').slice(0, 20).padEnd(22)} ${(r.resourceType || '').slice(0, 26).padEnd(28)} → ${(r.recommendedResourceType || '').slice(0, 22).padEnd(22)} ${c.green}${fmt(r.savings).padStart(8)}/mo${c.reset}  ${r.pctSavings}%  ${ageColor}${r.age}d${c.reset}`);
  }

  // By category
  L.push('');
  L.push(`  ${D('Savings by service category:')}`);
  for (const s of (optimization.serviceBreakdown || []).slice(0, 6)) {
    L.push(`  ${s.service.padEnd(30)} ${s.count.toString().padStart(5)} recs  ${c.green}${fmt(s.savings).padStart(10)}/mo${c.reset}`);
  }

  // Execution gap
  L.push('');
  L.push(`  ${B('EXECUTION STATUS')} ${D('— are recommendations being acted on?')}`);
  const sc = optimization.statusCounts || {};
  L.push(`  Done: ${c.green}${sc.done || 0}${c.reset} │ In Progress: ${c.cyan}${sc.inProgress || 0}${c.reset} │ To Do: ${c.yellow}${sc.toDo || 0}${c.reset} │ Backlog: ${sc.backlog || 0}`);
  L.push(`  Stale >30d: ${c.yellow}${optimization.staleCount}${c.reset} (${fmt(optimization.staleSavings)}/mo unrealized)`);
  L.push(`  Stale >90d: ${c.red}${optimization.veryStaleCount}${c.reset} ${D('← these will likely never be acted on without intervention')}`);

  // Chip architecture
  if (optimization.chipBreakdown?.length > 0) {
    L.push('');
    L.push(`  ${B('CHIP ARCHITECTURE')} ${D(`— compute spend: ${fmt(optimization.computeTotal)}`)}`);
    for (const ch of optimization.chipBreakdown) {
      const bar = '█'.repeat(Math.min(20, Math.round(parseFloat(ch.pct) / 5)));
      L.push(`  ${ch.chip.padEnd(14)} ${fmt(ch.cost).padStart(13)}  ${ch.pct.padStart(5)}%  ${c.dim}${bar}${c.reset}`);
    }
    if (optimization.gravitonOpportunity > 1000) {
      L.push(`  ${c.cyan}→ Migration potential: ${fmt(optimization.gravitonOpportunity)}/mo savings by moving 25% of Intel to Graviton/ARM${c.reset}`);
    }
  }

  // =========================================================================
  // OPERATE PHASE
  // =========================================================================
  phase('🏛️', 'OPERATE — Governance, Budgets & Accountability');

  // Budget status
  L.push('');
  L.push(`  ${B('BUDGET HEALTH')}`);
  if (forecast.budgetTotal > 0) {
    const budgetColor = forecast.budgetPctConsumed > forecast.calendarPct + 5 ? c.red : c.green;
    L.push(`  Total budget: ${fmt(forecast.budgetTotal)} │ Consumed: ${budgetColor}${forecast.budgetPctConsumed.toFixed(1)}%${c.reset} │ Calendar: ${forecast.calendarPct.toFixed(0)}%`);
    if (forecast.daysToExceed && forecast.daysToExceed < daysLeft) {
      L.push(`  ${c.red}⚠ Budget breach projected in ${forecast.daysToExceed} days at current rate${c.reset}`);
    }
  }
  if (forecast.budgetsAtRisk?.length > 0) {
    L.push(`  ${c.red}Budgets exceeding threshold (${forecast.budgetsAtRisk.length}):${c.reset}`);
    for (const b of forecast.budgetsAtRisk.slice(0, 5)) {
      L.push(`  ${c.red}⚠${c.reset} ${b.name.slice(0, 40).padEnd(42)} projected +${b.projectedVsBudget}% over`);
    }
  }

  // Maturity & governance
  L.push('');
  L.push(`  ${B('FINOPS MATURITY')}: ${B(operations.maturityLevel)} (${operations.maturityScore}/5)`);
  L.push(`  Budgets: ${operations.budgetCount} │ Views: ${operations.viewCount} │ Adoption: ${(operations.adoptionRate * 100).toFixed(0)}% │ Avg age: ${operations.avgAge}d`);
  if (operations.gaps?.length > 0) {
    L.push('');
    L.push(`  ${c.yellow}${B('GOVERNANCE GAPS:')}${c.reset}`);
    for (const g of operations.gaps) L.push(`  ${c.yellow}⚠${c.reset} ${g}`);
  }

  // Team engagement
  if (operations.engagement?.length > 0) {
    L.push('');
    L.push(`  ${B('TEAM ENGAGEMENT')} ${D('— who owns what, who\'s acting?')}`);
    for (const e of operations.engagement.slice(0, 6)) {
      const rate = e.total > 0 ? `${Math.round(e.done / e.total * 100)}%` : '0%';
      const rateColor = e.done / Math.max(e.total, 1) > 0.3 ? c.green : e.done > 0 ? c.yellow : c.red;
      L.push(`  ${(e.name || 'unknown').padEnd(22)} ${e.total.toString().padStart(5)} recs │ ${fmt(e.savings).padStart(10)} potential │ ${rateColor}${rate} done${c.reset}`);
    }
  }

  // Planning
  L.push('');
  L.push(`  ${B('PLANNING HORIZON')}`);
  if (operations.planningItems?.thisWeek?.length > 0) {
    L.push(`  ${c.cyan}This Week:${c.reset}`);
    for (const item of operations.planningItems.thisWeek) L.push(`  • ${item}`);
  }
  if (operations.planningItems?.thisMonth?.length > 0) {
    L.push(`  ${c.blue}This Month:${c.reset}`);
    for (const item of operations.planningItems.thisMonth) L.push(`  • ${item}`);
  }
  if (operations.planningItems?.thisQuarter?.length > 0) {
    L.push(`  ${c.magenta}This Quarter:${c.reset}`);
    for (const item of operations.planningItems.thisQuarter) L.push(`  • ${item}`);
  }

  // Meetings
  if (actions.meetings?.length > 0) {
    L.push('');
    L.push(`  ${B('RECOMMENDED MEETINGS')}`);
    for (const m of actions.meetings) {
      L.push(`  📅 ${m.day.padEnd(10)} ${B(m.who.padEnd(14))} ${m.topic.slice(0, 55)} (${m.duration})`);
    }
  }

  // Insight
  if (actions.insightOfDay) {
    L.push('');
    L.push(`${c.magenta}${hr2}${c.reset}`);
    L.push(`  ${c.cyan}${B('💡 INSIGHT')}: ${actions.insightOfDay}${c.reset}`);
  }

  // Footer
  L.push('');
  L.push(`${c.magenta}${hr}${c.reset}`);
  L.push(`${c.dim}  FinOps Daily Intelligence │ 7 agents │ ${Object.keys(deepDives || {}).length} deep dives │ Cloudability MCP${c.reset}`);
  L.push(`${c.dim}  Generated: ${new Date().toLocaleString()} │ Ask me to drill into any finding${c.reset}`);
  L.push(`${c.magenta}${hr}${c.reset}`);
  L.push('');
  return L.join('\n');
}
