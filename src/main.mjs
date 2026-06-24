#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DataCollector } from './collector.mjs';
import { analyzeCosts } from './agents/cost-analysis.mjs';
import { analyzeForecastBudget } from './agents/forecast-budget.mjs';
import { analyzeOptimization } from './agents/optimization.mjs';
import { analyzeAnomalies } from './agents/anomaly-risk.mjs';
import { analyzeOperations } from './agents/operations.mjs';
import { analyzeActions } from './agents/actions-insights.mjs';
import { orchestrate } from './agents/orchestrator.mjs';
import { renderTerminal } from './output/terminal.mjs';
import { renderMarkdown } from './output/markdown.mjs';

function loadContext() {
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), '..');
    return readFileSync(join(root, 'CONTEXT.md'), 'utf-8');
  } catch { return null; }
}

async function main() {
  const start = Date.now();
  const jsonMode = process.argv.includes('--json');
  const mdMode = process.argv.includes('--markdown');
  const log = (jsonMode || mdMode) ? () => {} : console.log.bind(console);
  log('🚀 FinOps Daily Check-in — Starting multi-agent analysis...\n');

  const collector = new DataCollector({ quiet: jsonMode || mdMode });
  await collector.connect();
  log('✅ Connected to Cloudability MCP\n');

  // Phase 1: Broad data collection
  const data = await collector.collectAll();
  log(`\n✅ Base data collected (${((Date.now() - start) / 1000).toFixed(1)}s)\n`);

  // Phase 2: Agent analysis (identifies signals)
  log('🤖 Running 6 analysis agents...');
  const costs = analyzeCosts(data);
  const forecast = analyzeForecastBudget(data);
  const optimization = analyzeOptimization(data);
  const anomalies = analyzeAnomalies(data);
  const operations = analyzeOperations(data);

  // Phase 3: Deep dives — agents found interesting things, now drill down
  log('\n🔬 Phase 3: Deep-dive investigations on findings...');
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
  log(`\n✅ Deep dives complete (${((Date.now() - start) / 1000).toFixed(1)}s total)\n`);

  // Load business context
  const businessContext = loadContext();

  // Phase 4: Actions agent with deep dive context
  const actions = analyzeActions({ costs, forecast, optimization, anomalies, operations, deepDives, businessContext });

  // Phase 5: Orchestrate and render
  const report = orchestrate({ costs, forecast, optimization, anomalies, operations, actions, deepDives, businessContext });

  if (process.argv.includes('--json')) {
    const json = { ...costs, ...forecast, ...optimization, ...anomalies, ...operations, ...actions, deepDives, businessContext };
    process.stdout.write(JSON.stringify(json));
  } else if (mdMode) {
    process.stdout.write(renderMarkdown(report));
  } else {
    console.log(renderTerminal(report));
    console.log(`⏱️  Total: ${((Date.now() - start) / 1000).toFixed(1)}s | 7 agents | ${Object.keys(deepDives).length} deep dives\n`);
  }
}

main().catch(err => { console.error('❌ Error:', err.message, err.stack); process.exit(1); });
