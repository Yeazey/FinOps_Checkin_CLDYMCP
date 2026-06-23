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
      today: f(now), yesterday: f(new Date(y, m, d - 1)),
      weekAgo: f(new Date(y, m, d - 7)), twoWeeksAgo: f(new Date(y, m, d - 14)),
      mtdStart: f(new Date(y, m, 1)),
      priorMonthStart: f(new Date(y, m - 1, 1)), priorMonthSameDay: f(new Date(y, m - 1, d)),
      priorMonthEnd: f(new Date(y, m, 0)),
    };
  }

  async collectAll() {
    const d = this.getDates();
    const V = '0';
    const cost = (dims, start, end, opts = {}) => this.call('cldy_cost_report_run', {
      dimensions: dims, metrics: 'unblended_cost', start_date: start, end_date: end,
      sort: 'unblended_costDESC', view_id: V, ...opts
    });

    console.log('  📊 Phase 1: Core spend...');
    const [mtdVendor, mtdService, priorMtdVendor, priorMtdService] = await Promise.all([
      cost('vendor', d.mtdStart, d.today),
      cost('vendor,service_name', d.mtdStart, d.today, { limit: 50 }),
      cost('vendor', d.priorMonthStart, d.priorMonthSameDay),
      cost('vendor,service_name', d.priorMonthStart, d.priorMonthSameDay, { limit: 50 }),
    ]);

    console.log('  📊 Phase 2: Weekly trends & accounts...');
    const [thisWeekService, lastWeekService, mtdAccount, instanceTypes] = await Promise.all([
      cost('vendor,service_name', d.weekAgo, d.today, { limit: 40 }),
      cost('vendor,service_name', d.twoWeeksAgo, d.weekAgo, { limit: 40 }),
      cost('vendor,vendor_account_name', d.mtdStart, d.today, { limit: 20 }),
      cost('vendor,instance_type', d.mtdStart, d.today, { limit: 100, filters: ['instance_type!=none'] }),
    ]);

    console.log('  📊 Phase 3: Rightsizing, anomalies, governance...');
    const [rightsizing, anomalies, budgets, views] = await Promise.all([
      this.call('cldy_rightsizing_list', { limit: 50, sort: '-potentialSavings' }),
      this.call('cldy_anomalies_list', { startDate: d.weekAgo, endDate: d.today, viewId: '0' }),
      this.call('list_budgets', {}),
      this.call('list_views', {}),
    ]);

    console.log('  📊 Phase 4: Forecast & estimate...');
    const [forecast, estimate] = await Promise.all([
      this.call('cldy_forecast_get', {}), this.call('cldy_estimate_get', {}),
    ]);

    return { dates: d, mtdVendor, mtdService, priorMtdVendor, priorMtdService, thisWeekService, lastWeekService, mtdAccount, instanceTypes, rightsizing, anomalies, budgets, views, forecast, estimate };
  }

  // === DEEP DIVE QUERIES — triggered by agent findings ===

  async deepDiveService(serviceName, vendor, startDate, endDate) {
    console.log(`  🔍 Deep dive: ${vendor} ${serviceName}...`);
    const [byAccount, byRegion] = await Promise.all([
      this.call('cldy_cost_report_run', {
        dimensions: 'vendor_account_name,service_name', metrics: 'unblended_cost',
        start_date: startDate, end_date: endDate,
        filters: [`service_name==${serviceName}`, `vendor==${vendor}`],
        sort: 'unblended_costDESC', limit: 10, view_id: '0'
      }),
      this.call('cldy_cost_report_run', {
        dimensions: 'region,service_name', metrics: 'unblended_cost',
        start_date: startDate, end_date: endDate,
        filters: [`service_name==${serviceName}`, `vendor==${vendor}`],
        sort: 'unblended_costDESC', limit: 10, view_id: '0'
      }),
    ]);
    return { byAccount: byAccount?.results || [], byRegion: byRegion?.results || [] };
  }

  async deepDiveAccount(accountName, startDate, endDate) {
    console.log(`  🔍 Deep dive: account ${accountName}...`);
    const byService = await this.call('cldy_cost_report_run', {
      dimensions: 'vendor_account_name,service_name', metrics: 'unblended_cost',
      start_date: startDate, end_date: endDate,
      filters: [`vendor_account_name==${accountName}`],
      sort: 'unblended_costDESC', limit: 15, view_id: '0'
    });
    return { byService: byService?.results || [] };
  }

  async deepDiveSpike(serviceName, vendor, startDate, endDate) {
    console.log(`  🔍 Deep dive: ${serviceName} spike...`);
    const [byAccount, byUsageType] = await Promise.all([
      this.call('cldy_cost_report_run', {
        dimensions: 'vendor_account_name', metrics: 'unblended_cost',
        start_date: startDate, end_date: endDate,
        filters: [`service_name==${serviceName}`, `vendor==${vendor}`],
        sort: 'unblended_costDESC', limit: 5, view_id: '0'
      }),
      this.call('cldy_cost_report_run', {
        dimensions: 'enhanced_service_name', metrics: 'unblended_cost',
        start_date: startDate, end_date: endDate,
        filters: [`service_name==${serviceName}`, `vendor==${vendor}`],
        sort: 'unblended_costDESC', limit: 10, view_id: '0'
      }),
    ]);
    return { byAccount: byAccount?.results || [], byUsageType: byUsageType?.results || [] };
  }
}
