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
      command: 'node',
      args: [path.join(mcpPath, 'dist/index.js')],
      env: { ...process.env }
    });
    this.client = new Client({ name: 'dailycheckin', version: '1.0.0' }, { capabilities: {} });
    await this.client.connect(this.transport);
  }

  async callTool(name, args) {
    try {
      const result = await this.client.callTool({ name, arguments: args });
      const text = result?.content?.[0]?.text;
      return text ? JSON.parse(text) : null;
    } catch (e) { return null; }
  }

  async disconnect() { if (this.transport) await this.transport.close(); }

  // --- Date helpers ---
  getDates() {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
    const fmt = (dt) => dt.toISOString().slice(0, 10);
    const today = fmt(now);
    const mtdStart = fmt(new Date(y, m, 1));
    const yesterday = fmt(new Date(y, m, d - 1));
    const weekAgo = fmt(new Date(y, m, d - 7));
    const priorMtdStart = fmt(new Date(y, m - 1, 1));
    const priorSameDay = fmt(new Date(y, m - 1, d));
    return { today, mtdStart, yesterday, weekAgo, priorMtdStart, priorSameDay };
  }

  // --- Fetch all data in parallel ---
  async collectAll() {
    const d = this.getDates();
    const viewId = '0';

    console.log('📊 Fetching cost data...');
    const [
      yesterdayByService, weekByService, mtdByVendor, mtdByService,
      priorMtdByVendor, instanceTypes, rightsizing, anomalies,
      budgets, views, forecast, estimate
    ] = await Promise.all([
      // Yesterday by vendor+service
      this.callTool('cldy_cost_report_run', {
        dimensions: 'vendor,service_name', metrics: 'unblended_cost',
        start_date: d.yesterday, end_date: d.yesterday,
        sort: 'unblended_costDESC', limit: 20, view_id: viewId
      }),
      // 7-day by vendor+service
      this.callTool('cldy_cost_report_run', {
        dimensions: 'vendor,service_name', metrics: 'unblended_cost',
        start_date: d.weekAgo, end_date: d.today,
        sort: 'unblended_costDESC', limit: 30, view_id: viewId
      }),
      // MTD by vendor
      this.callTool('cldy_cost_report_run', {
        dimensions: 'vendor', metrics: 'unblended_cost',
        start_date: d.mtdStart, end_date: d.today,
        sort: 'unblended_costDESC', view_id: viewId
      }),
      // MTD by service (top 30)
      this.callTool('cldy_cost_report_run', {
        dimensions: 'vendor,service_name', metrics: 'unblended_cost',
        start_date: d.mtdStart, end_date: d.today,
        sort: 'unblended_costDESC', limit: 30, view_id: viewId
      }),
      // Prior month same period
      this.callTool('cldy_cost_report_run', {
        dimensions: 'vendor', metrics: 'unblended_cost',
        start_date: d.priorMtdStart, end_date: d.priorSameDay,
        sort: 'unblended_costDESC', view_id: viewId
      }),
      // Instance types
      this.callTool('cldy_cost_report_run', {
        dimensions: 'vendor,instance_type', metrics: 'unblended_cost',
        start_date: d.mtdStart, end_date: d.today,
        sort: 'unblended_costDESC', limit: 50,
        filters: ['instance_type!=none'], view_id: viewId
      }),
      // Rightsizing
      this.callTool('cldy_rightsizing_list', { limit: 50, sort: '-potentialSavings' }),
      // Anomalies - try with a view
      this.callTool('cldy_anomalies_list', {
        startDate: d.weekAgo, endDate: d.today, viewId: '0'
      }),
      // Budgets
      this.callTool('list_budgets', {}),
      // Views
      this.callTool('list_views', {}),
      // Forecast
      this.callTool('cldy_forecast_get', {}),
      // Estimate
      this.callTool('cldy_estimate_get', {}),
    ]);

    return {
      dates: d,
      yesterdayByService, weekByService, mtdByVendor, mtdByService,
      priorMtdByVendor, instanceTypes, rightsizing, anomalies,
      budgets, views, forecast, estimate
    };
  }
}
