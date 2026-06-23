#!/usr/bin/env node
import { DataCollector } from './collector.mjs';
import { analyzeCosts } from './agents/cost-analysis.mjs';
import { analyzeForecastBudget } from './agents/forecast-budget.mjs';
import { analyzeOptimization } from './agents/optimization.mjs';
import { analyzeAnomalies } from './agents/anomaly-risk.mjs';
import { analyzeOperations } from './agents/operations.mjs';
import { analyzeActions } from './agents/actions-insights.mjs';
import { orchestrate } from './agents/orchestrator.mjs';
import { renderTerminal } from './output/terminal.mjs';

async function main() {
  const start = Date.now();
  console.log('🚀 FinOps Daily Check-in — Starting multi-agent analysis...\n');

  const collector = new DataCollector();
  await collector.connect();
  console.log('✅ Connected to Cloudability MCP\n');

  // Phase 1: Broad data collection
  const data = await collector.collectAll();
  console.log(`\n✅ Base data collected (${((Date.now() - start) / 1000).toFixed(1)}s)\n`);

  // Phase 2: Agent analysis (identifies signals)
  console.log('🤖 Running 6 analysis agents...');
  const costs = analyzeCosts(data);
  const forecast = analyzeForecastBudget(data);
  const optimization = analyzeOptimization(data);
  const anomalies = analyzeAnomalies(data);
  const operations = analyzeOperations(data);

  // Phase 3: Deep dives — agents found interesting things, now drill down
  console.log('\n🔬 Phase 3: Deep-dive investigations on findings...');
  const deepDives = {};

  // Deep dive into new services
  for (const svc of (costs.newServices || []).slice(0, 3)) {
    const key = `${svc.vendor}|${svc.service}`;
    deepDives[key] = await collector.deepDiveService(svc.service, svc.vendor, data.dates.weekAgo, data.dates.today);
  }

  // Deep dive into biggest weekly risers
  for (const mover of (costs.risers || []).slice(0, 2)) {
    if (mover.delta > 5000) {
      const key = `spike|${mover.vendor}|${mover.service}`;
      deepDives[key] = await collector.deepDiveSpike(mover.service, mover.vendor, data.dates.weekAgo, data.dates.today);
    }
  }

  // Deep dive into top anomaly service
  if (anomalies.critical?.length > 0) {
    const topAnomaly = anomalies.critical[0];
    if (topAnomaly.service && topAnomaly.service !== 'Unknown') {
      const key = `anomaly|${topAnomaly.service}`;
      deepDives[key] = await collector.deepDiveSpike(topAnomaly.service, 'Amazon', data.dates.weekAgo, data.dates.today);
    }
  }

  await collector.disconnect();
  console.log(`\n✅ Deep dives complete (${((Date.now() - start) / 1000).toFixed(1)}s total)\n`);

  // Phase 4: Actions agent with deep dive context
  const actions = analyzeActions({ costs, forecast, optimization, anomalies, operations, deepDives });

  // Phase 5: Orchestrate and render
  const report = orchestrate({ costs, forecast, optimization, anomalies, operations, actions, deepDives });
  console.log(renderTerminal(report));

  console.log(`⏱️  Total: ${((Date.now() - start) / 1000).toFixed(1)}s | 7 agents | ${Object.keys(deepDives).length} deep dives\n`);
}

main().catch(err => { console.error('❌ Error:', err.message, err.stack); process.exit(1); });
