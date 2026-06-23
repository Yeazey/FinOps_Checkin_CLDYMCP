import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import 'dotenv/config';

export class DataCollector {
  constructor() { this.client = null; this.transport = null; }

  async connect() {
    const mcpPath = process.env.CLOUDABILITY_MCP_PATH;
    if (!mcpPath) { console.error('❌ CLOUDABILITY_MCP_PATH not set'); process.exit(1); }
    this.transport = new StdioClientTransport({
      command: 'node', args: [path.join(mcpPath, 'dist/index.js')], env: { ...process.env }
    });
    this.client = new Client({ name: 'dailycheckin', version: '1.0.0' }, { capabilities: {} });
    await this.client.connect(this.transport);
  }

  async call(name, args) {
    try {
      const r = await this.client.callTool({ name, arguments: args });
      const t = r?.content?.[0]?.text;
      return t ? JSON.parse(t) : null;
    } catch { return null; }
  }

  async disconnect() { if (this.transport) await this.transport.close(); }

  getDates() {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
    const f = (dt) => dt.toISOString().slice(0, 10);
    return {
      today: f(now),
      yesterday: f(new Date(y, m, d - 1)),
      twoDaysAgo: f(new Date(y, m, d - 2)),
      weekAgo: f(new Date(y, m, d - 7)),
      twoWeeksAgo: f(new Date(y, m, d - 14)),
      mtdStart: f(new Date(y, m, 1)),
      priorMonthStart: f(new Date(y, m - 1, 1)),
      priorMonthSameDay: f(new Date(y, m - 1, d)),
      priorMonthEnd: f(new Date(y, m, 0)),
      threeMonthsAgo: f(new Date(y, m - 3, 1)),
    };
  }

  async collectAll() {
    const d = this.getDates();
    const V = '0';
    const cost = (dims, start, end, opts = {}) => this.call('cldy_cost_report_run', {
      dimensions: dims, metrics: 'unblended_cost', start_date: start, end_date: end,
      sort: 'unblended_costDESC', view_id: V, ...opts
    });

    console.log('  📊 Phase 1: Core spend data...');
    const [mtdVendor, mtdService, priorMtdVendor, priorMtdService] = await Promise.all([
      cost('vendor', d.mtdStart, d.today),
      cost('vendor,service_name', d.mtdStart, d.today, { limit: 50 }),
      cost('vendor', d.priorMonthStart, d.priorMonthSameDay),
      cost('vendor,service_name', d.priorMonthStart, d.priorMonthSameDay, { limit: 50 }),
    ]);

    console.log('  📊 Phase 2: Trends & weekly comparison...');
    const [thisWeekService, lastWeekService, mtdAccount, instanceTypes] = await Promise.all([
      cost('vendor,service_name', d.weekAgo, d.today, { limit: 30 }),
      cost('vendor,service_name', d.twoWeeksAgo, d.weekAgo, { limit: 30 }),
      cost('vendor,vendor_account_name', d.mtdStart, d.today, { limit: 20 }),
      cost('vendor,instance_type', d.mtdStart, d.today, { limit: 100, filters: ['instance_type!=none'] }),
    ]);

    console.log('  📊 Phase 3: Rightsizing & anomalies...');
    const [rightsizing, anomalies, budgets, views] = await Promise.all([
      this.call('cldy_rightsizing_list', { limit: 50, sort: '-potentialSavings' }),
      this.call('cldy_anomalies_list', { startDate: d.weekAgo, endDate: d.today, viewId: '0' }),
      this.call('list_budgets', {}),
      this.call('list_views', {}),
    ]);

    console.log('  📊 Phase 4: Forecast & estimate...');
    const [forecast, estimate] = await Promise.all([
      this.call('cldy_forecast_get', {}),
      this.call('cldy_estimate_get', {}),
    ]);

    return {
      dates: d, mtdVendor, mtdService, priorMtdVendor, priorMtdService,
      thisWeekService, lastWeekService, mtdAccount, instanceTypes,
      rightsizing, anomalies, budgets, views, forecast, estimate
    };
  }
}
