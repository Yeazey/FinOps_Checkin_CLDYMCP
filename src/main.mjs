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

const isMonday = process.argv.includes('--monday') || new Date().getDay() === 1;

async function main() {
  const start = Date.now();
  console.log('🚀 Starting FinOps Daily Check-in...\n');

  // 1. Connect and collect data
  const collector = new DataCollector();
  await collector.connect();
  console.log('✅ Connected to Cloudability MCP');

  const data = await collector.collectAll();
  await collector.disconnect();
  console.log(`✅ Data collected in ${((Date.now() - start) / 1000).toFixed(1)}s\n`);

  // 2. Run all agents in parallel
  console.log('🤖 Running agents...');
  const costs = analyzeCosts(data);
  const forecast = analyzeForecastBudget(data);
  const optimization = analyzeOptimization(data);
  const anomalies = analyzeAnomalies(data);
  const operations = analyzeOperations(data);

  // 3. Actions agent synthesizes across all others
  const actions = analyzeActions({ costs, forecast, optimization, anomalies, operations });

  // 4. Orchestrator produces final report
  const report = orchestrate({ costs, forecast, optimization, anomalies, operations, actions });

  // 5. Render to terminal
  const output = renderTerminal(report);
  console.log(output);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n⏱️  Total time: ${elapsed}s`);
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
