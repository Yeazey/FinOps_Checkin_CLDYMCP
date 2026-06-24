# FinOps Daily Check-In — Multi-Agent Cloud Cost Standup

A multi-agent FinOps daily standup that connects to **Cloudability** via MCP (Model Context Protocol), analyzes your cloud spend across AWS, Azure, GCP, OCI, Snowflake, and Databricks, and produces an actionable briefing segmented by FinOps pillars.

Works with **any AI-powered IDE or LLM tool** — Kiro, Cursor, VS Code Copilot, Windsurf, Cline, Aider, Claude Desktop, ChatGPT, and more.

---

## What It Does

Runs 6 specialized analysis agents against live Cloudability data:

1. **Cost Analysis** — MTD spend, provider breakdown, top accounts, WoW movers
2. **Forecast & Budget** — Projections, budget health, days-to-exceed
3. **Optimization** — Rightsizing recommendations, savings pipeline, adoption rate
4. **Anomaly & Risk** — Spend anomalies, severity triage, recurring patterns
5. **Operations & Strategy** — Maturity scoring, governance gaps, engagement
6. **Actions & Insights** — Priority-ranked action items, meeting recommendations

Then an **orchestrator** synthesizes these into a unified report organized by FinOps phases:

- ⚡ **Priority Actions** — ranked by cost-of-inaction
- 👁️ **INFORM** — Spend snapshot, movers, anomalies
- ⚡ **OPTIMIZE** — Rightsizing, savings pipeline, architecture
- 🏛️ **OPERATE** — Budget health, maturity, governance
- 📅 **Meetings** — Recommended syncs
- 💡 **Insight** — The #1 narrative takeaway

---

## Quick Start

### Prerequisites

- Node.js 18+
- The [Cloudability MCP Server](https://github.com/apptio/cldy-mcp-server) cloned locally
- A Cloudability API token (OpenToken)

### Install

```bash
git clone https://github.com/Yeazey/FinOps_Checkin_CLDYMCP.git
cd FinOps_Checkin_CLDYMCP
npm install
```

### Configure

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
CLOUDABILITY_MCP_PATH=/path/to/cldy-mcp-server-main
CLOUDABILITY_AUTH_METHOD=opentoken
CLOUDABILITY_OPENTOKEN=your-opentoken-here
CLOUDABILITY_ENVIRONMENT_ID=your-env-id
CLOUDABILITY_REGION=us
```

| Variable | Description |
|----------|-------------|
| `CLOUDABILITY_MCP_PATH` | Absolute path to your local clone of the Cloudability MCP server |
| `CLOUDABILITY_AUTH_METHOD` | Auth method — typically `opentoken` |
| `CLOUDABILITY_OPENTOKEN` | Your Cloudability API token |
| `CLOUDABILITY_ENVIRONMENT_ID` | Your Cloudability environment/org ID |
| `CLOUDABILITY_REGION` | Region — `us` or `eu` |

### Run

```bash
# Terminal output (ANSI-colored)
npm run checkin

# Portable markdown report (pipe anywhere)
npm run markdown

# Raw JSON for AI tool consumption
node src/main.mjs --json 2>/dev/null
```

---

## Business Context

The `CONTEXT.md` file in the project root gives the agents business-specific knowledge that Cloudability data alone can't provide. **Edit this file with your own details** — the agents read it on every run.

Sections:

| Section | What to put here | How agents use it |
|---------|-----------------|-------------------|
| **Top Priorities** | Current business objectives, OKRs, focus areas | Ranks findings by business relevance |
| **Key Business Details** | Migrations, rearchitectures, platform changes | Distinguishes planned spend from waste |
| **Personas & Teams** | Who owns what accounts/services | Assigns action items to the right people |
| **Seasonality & Revenue** | Traffic patterns, peak periods, fiscal calendar | Avoids false-flagging expected spikes |
| **Active Initiatives** | Upcoming launches, load tests, planned changes | Correlates spend changes to known events |
| **Cost Allocation & Tagging** | Key tags, shared accounts, dimension mappings | Interprets unallocated spend correctly |

The context is included in `--json` output (as `businessContext`) so AI tools formatting the report can factor it into their narrative.

---

## Output Modes

| Mode | Command | Use Case |
|------|---------|----------|
| **Terminal** | `npm run checkin` | Quick visual scan in your terminal |
| **Markdown** | `npm run markdown` | Self-contained report — paste into Slack, docs, or render in any tool |
| **JSON** | `node src/main.mjs --json 2>/dev/null` | Feed to an AI tool for conversational formatting + follow-up questions |

---

## The Skill Definition

This is the complete AI skill specification. Copy this into your IDE's skill/prompt system to enable the daily check-in as a conversational command.

### Trigger Phrases

Use when the user asks for:
- "daily checkin" / "daily check-in"
- "finops standup"
- "morning briefing"
- "cost standup"
- "what should I focus on today"

### Execution Steps

**Step 1: Run the data collector**

```bash
cd /path/to/FinOps_Checkin_CLDYMCP && node src/main.mjs --json 2>/dev/null
```

**Step 2: Format the JSON output as a markdown report in chat**

Organize by FinOps phases:

- **⚡ Priority Actions** — Table with: rank, severity, title, savings, cost-of-inaction, owner, effort, blast radius
- **👁️ INFORM** — Spend snapshot (MTD, daily rate, projection, annualized), provider breakdown with MoM change, top accounts, WoW movers (risers/fallers), new services, deep-dive findings, anomaly triage
- **⚡ OPTIMIZE** — Rightsizing pipeline (top recs with current→recommended, daily savings, status, age), savings by service, adoption rate, stale recommendation count, chip/architecture breakdown
- **🏛️ OPERATE** — Budget health table, at-risk budgets, FinOps maturity score, governance gaps, team engagement (assignees, completion rates), planning horizons (week/month/quarter)
- **📅 Meetings** — Recommended syncs with day/who/topic/duration
- **💡 Insight** — Single paragraph narrative takeaway

**Step 3: Enable follow-up conversation**

After presenting the report, the user can ask drill-down questions. If your tool has Cloudability MCP access, answer with live data. Examples:
- "Tell me more about the Azure spike"
- "What's happening in corp-legacy?"
- "Drill into the EC2 anomalies"
- "Who owns the stale recommendations?"

### JSON Output Schema (Key Fields)

```
mtdTotal, priorMtdTotal, mtdVsPrior, projected, dailyRate, annualizedRate
vendors[], topServices[], accounts[], risers[], fallers[], newServices[]
alerts[], priorityActions[], meetings[], insightOfDay
budgetTotal, budgetPctConsumed, budgetDetails[], budgetsAtRisk[]
totalSavings, topRecs[], serviceBreakdown[], staleCount, adoptionRate
totalAnomalies, critical[], warning[], info[], recurring[]
maturityLevel, maturityScore, gaps[], engagement[]
planningItems{thisWeek[], thisMonth[], thisQuarter[]}
deepDives{}
```

---

## IDE Setup Guides

### Kiro

Kiro uses skill files in `~/.kiro/skills/<name>/SKILL.md`.

```bash
mkdir -p ~/.kiro/skills/dailycheckin
```

Create `~/.kiro/skills/dailycheckin/SKILL.md`:

```markdown
# dailycheckin

Run the multi-agent FinOps daily standup as a conversational markdown report.
Use when the user asks for a "daily checkin", "finops standup", "morning briefing",
"cost standup", "daily check-in", or "what should I focus on today".

## Steps

1. Run the daily check-in and capture JSON output:
   ```bash
   cd /path/to/FinOps_Checkin_CLDYMCP && node src/main.mjs --json 2>/dev/null
   ```

2. Format the JSON output as a comprehensive markdown report directly in the chat
   response, organized by FinOps phases (Priority Actions, INFORM, OPTIMIZE,
   OPERATE, Meetings, Insight). See the full schema in README.md.

3. After presenting the report, remain conversational — use Cloudability MCP
   tools directly to answer follow-up questions with live data.
```

**MCP Config**: Kiro auto-discovers MCP tools. If you have the Cloudability MCP configured in your MCP settings, follow-up questions will use live data directly.

---

### Cursor

Cursor uses `.cursor/rules/` for project-level instructions and supports MCP servers.

**Step 1: Add the skill as a rule**

Create `.cursor/rules/dailycheckin.mdc`:

```markdown
---
description: FinOps daily standup — run when user asks for daily checkin, finops standup, or morning briefing
globs: []
alwaysApply: false
---

When the user asks for a daily checkin, finops standup, or morning briefing:

1. Run this command and capture the output:
   ```bash
   cd /path/to/FinOps_Checkin_CLDYMCP && node src/main.mjs --json 2>/dev/null
   ```

2. Format the JSON as a markdown report organized by FinOps pillars:
   - ⚡ Priority Actions (severity, title, savings, cost-of-inaction, owner)
   - 👁️ INFORM (MTD spend, provider breakdown, WoW movers, anomalies)
   - ⚡ OPTIMIZE (rightsizing recs, savings pipeline, adoption rate)
   - 🏛️ OPERATE (budget health, maturity, governance gaps)
   - 📅 Meetings (recommended syncs)
   - 💡 Insight (narrative takeaway)

3. Remain conversational for follow-up questions.
```

**Step 2: Add Cloudability MCP (optional, for live follow-ups)**

In Cursor Settings → MCP Servers, add:

```json
{
  "cloudability": {
    "command": "node",
    "args": ["/path/to/cldy-mcp-server-main/dist/index.js"],
    "env": {
      "CLOUDABILITY_AUTH_METHOD": "opentoken",
      "CLOUDABILITY_OPENTOKEN": "your-token",
      "CLOUDABILITY_ENVIRONMENT_ID": "your-env-id",
      "CLOUDABILITY_REGION": "us"
    }
  }
}
```

---

### VS Code GitHub Copilot

Copilot uses `.github/copilot-instructions.md` for repo-level context and supports MCP via `settings.json`.

**Step 1: Add instructions**

Create `.github/copilot-instructions.md`:

```markdown
# FinOps Daily Check-In Skill

When the user asks for a "daily checkin", "finops standup", "morning briefing",
or "what should I focus on today":

1. Run: `cd /path/to/FinOps_Checkin_CLDYMCP && node src/main.mjs --json 2>/dev/null`
2. Format the JSON output as a markdown FinOps report segmented by:
   - ⚡ Priority Actions — ranked by cost-of-inaction
   - 👁️ INFORM — Spend snapshot, provider breakdown, WoW movers, anomalies
   - ⚡ OPTIMIZE — Rightsizing recs, savings pipeline, architecture
   - 🏛️ OPERATE — Budget health, maturity, governance gaps
   - 📅 Meetings — Recommended syncs
   - 💡 Insight — Narrative takeaway
3. Answer follow-up questions about specific findings using MCP tools if available.
```

**Step 2: Add MCP server (VS Code settings.json)**

```json
{
  "github.copilot.chat.mcpServers": {
    "cloudability": {
      "command": "node",
      "args": ["/path/to/cldy-mcp-server-main/dist/index.js"],
      "env": {
        "CLOUDABILITY_AUTH_METHOD": "opentoken",
        "CLOUDABILITY_OPENTOKEN": "your-token",
        "CLOUDABILITY_ENVIRONMENT_ID": "your-env-id",
        "CLOUDABILITY_REGION": "us"
      }
    }
  }
}
```

---

### Windsurf

Windsurf uses `.windsurfrules` for project instructions and supports MCP.

**Step 1: Create `.windsurfrules`**

```markdown
# FinOps Daily Check-In

When the user asks for a "daily checkin", "finops standup", or "morning briefing":

1. Run: `cd /path/to/FinOps_Checkin_CLDYMCP && node src/main.mjs --json 2>/dev/null`
2. Parse the JSON and present as a FinOps standup report:
   - ⚡ Priority Actions (rank, severity, title, savings, owner, effort)
   - 👁️ INFORM (MTD total, daily rate, projection, vendors, top accounts, movers, anomalies)
   - ⚡ OPTIMIZE (top rightsizing recs, savings total, adoption rate, stale count)
   - 🏛️ OPERATE (budget status, maturity level, governance gaps, planning items)
   - 📅 Meetings (day, who, topic, duration)
   - 💡 Insight (single key takeaway)
3. Enable follow-up questions using Cloudability MCP tools.
```

**Step 2: Configure MCP in Windsurf Settings → Cascade → MCP**

Add the Cloudability server with the same command/args/env pattern as above.

---

### Cline

Cline uses custom instructions and MCP server configuration.

**Step 1: Add to Cline custom instructions** (Settings → Custom Instructions):

```
When I ask for a "daily checkin", "finops standup", or "morning briefing":

1. Execute: cd /path/to/FinOps_Checkin_CLDYMCP && node src/main.mjs --json 2>/dev/null
2. Format the output as a markdown FinOps report with sections:
   - Priority Actions (severity/title/savings/owner)
   - INFORM (spend snapshot, providers, movers, anomalies)
   - OPTIMIZE (rightsizing recs, savings pipeline)
   - OPERATE (budgets, maturity, governance)
   - Meetings and Insight
3. Answer follow-up questions with Cloudability MCP tools.
```

**Step 2: Add MCP server** (Cline Settings → MCP Servers):

```json
{
  "cloudability": {
    "command": "node",
    "args": ["/path/to/cldy-mcp-server-main/dist/index.js"],
    "env": {
      "CLOUDABILITY_AUTH_METHOD": "opentoken",
      "CLOUDABILITY_OPENTOKEN": "your-token",
      "CLOUDABILITY_ENVIRONMENT_ID": "your-env-id",
      "CLOUDABILITY_REGION": "us"
    }
  }
}
```

---

### Aider

Aider uses conventions files and doesn't natively support MCP, so use the `--markdown` mode for self-contained output.

**Step 1: Create `.aider.conf.yml`**

```yaml
read:
  - CONVENTIONS.md
```

**Step 2: Create `CONVENTIONS.md`**

```markdown
# FinOps Daily Check-In

When asked for a daily checkin or finops standup, run:

```bash
cd /path/to/FinOps_Checkin_CLDYMCP && node src/main.mjs --markdown
```

This produces a complete markdown report. Present it directly.

For JSON mode (if you want to reformat):
```bash
node src/main.mjs --json 2>/dev/null
```
```

**Note**: Aider doesn't support MCP for live follow-ups. Use `--markdown` for the self-contained report, or pipe `--json` and format in conversation.

---

### Claude Desktop / Claude.ai Projects

**Option A: Use `--markdown` (simplest)**

Run in terminal, paste output into Claude:
```bash
cd /path/to/FinOps_Checkin_CLDYMCP && node src/main.mjs --markdown
```

**Option B: Configure MCP for live interaction**

In Claude Desktop → Settings → Developer → MCP Servers:

```json
{
  "mcpServers": {
    "cloudability": {
      "command": "node",
      "args": ["/path/to/cldy-mcp-server-main/dist/index.js"],
      "env": {
        "CLOUDABILITY_AUTH_METHOD": "opentoken",
        "CLOUDABILITY_OPENTOKEN": "your-token",
        "CLOUDABILITY_ENVIRONMENT_ID": "your-env-id",
        "CLOUDABILITY_REGION": "us"
      }
    }
  }
}
```

Then add this to your Claude Project instructions:

```
When I ask for a daily checkin or finops standup, use the Cloudability MCP tools
to pull: cost reports (MTD by vendor, by account, by service, WoW comparison),
rightsizing recommendations, anomalies (last 7 days), budgets, and forecasts.
Present as a FinOps report with Priority Actions, INFORM, OPTIMIZE, OPERATE,
Meetings, and Insight sections.
```

---

### ChatGPT / OpenAI (Custom GPT or API)

ChatGPT doesn't support MCP natively. Use the `--markdown` output mode.

**Workflow:**
```bash
# Generate the report
node src/main.mjs --markdown > /tmp/finops-standup.md

# Paste into ChatGPT or upload as a file
```

**For Custom GPTs**: Add the skill definition from the "Skill Definition" section above to your GPT's instructions, and have users paste the `--json` output when they want analysis.

**For API integrations**: Use `--json` and feed the output as context to your chat completions call.

---

### Generic LLM / Any Tool

If your tool can:
1. **Execute shell commands** → Use `--json` mode and format in conversation
2. **Read files** → Write to a file: `node src/main.mjs --markdown > report.md`
3. **Neither** → Run `npm run markdown` in terminal, copy-paste the output

**Universal prompt to add to any LLM system:**

```
I have a FinOps daily check-in tool. When I share its JSON output, format it as:

## ⚡ Priority Actions
Table: rank | severity | title | savings | cost-of-inaction | owner | effort

## 👁️ INFORM
- MTD spend, daily rate, projected month-end, annualized
- Provider breakdown with MoM change %
- Top 5 accounts by spend
- Week-over-week risers and fallers
- Active anomalies with severity

## ⚡ OPTIMIZE
- Top rightsizing recommendations (current → recommended, savings, status, age)
- Total savings pipeline
- Adoption rate and stale count

## 🏛️ OPERATE
- Budget health (budgets configured, at-risk, expired)
- FinOps maturity level and score
- Governance gaps

## 📅 Meetings
- Recommended syncs: day | who | topic | duration

## 💡 Insight
- Single paragraph: the #1 thing to focus on today
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  src/main.mjs (entry point)                     │
│  Flags: --json | --markdown | (default=terminal)│
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  src/collector.mjs                  │
│  Spawns Cloudability MCP server     │
│  via stdio transport                │
│  Calls: cost reports, rightsizing,  │
│  anomalies, budgets, views, etc.    │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  src/agents/ (6 analysis agents)    │
│  cost-analysis.mjs                  │
│  forecast-budget.mjs                │
│  optimization.mjs                   │
│  anomaly-risk.mjs                   │
│  operations.mjs                     │
│  actions-insights.mjs               │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  src/agents/orchestrator.mjs        │
│  Synthesize → Deduplicate → Rank    │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  src/output/                        │
│  terminal.mjs → ANSI colored        │
│  markdown.mjs → Portable markdown   │
│  (stdout JSON) → AI formatting      │
└─────────────────────────────────────┘
```

### Agent Prompt Definitions

The `agents/` directory contains markdown files defining each agent's analysis strategy. These are reference documents — the actual logic is in `src/agents/*.mjs`.

---

## MCP Server Requirement

This tool requires the **Cloudability MCP Server** to be installed locally. It spawns the server as a child process via stdio transport (not HTTP).

```bash
# Clone the MCP server
git clone https://github.com/apptio/cldy-mcp-server.git
cd cldy-mcp-server
npm install && npm run build

# Set the path in your .env
CLOUDABILITY_MCP_PATH=/absolute/path/to/cldy-mcp-server
```

The MCP server provides tools for: cost reports, rightsizing recommendations, anomaly detection, budgets, views, forecasts, estimates, business dimensions, and container cost allocation.

---

## FAQ

**Q: Why does `--json` output zeros when run standalone?**
A: The collector connects to the Cloudability MCP server which needs valid credentials. Check your `.env` file and ensure `CLOUDABILITY_MCP_PATH` points to a built server (`dist/index.js` must exist).

**Q: Can I use this without an IDE?**
A: Yes — `npm run markdown` produces a complete report in your terminal. Pipe it wherever you want: `npm run markdown | pbcopy` (macOS) or `npm run markdown > report.md`.

**Q: What if my IDE doesn't support MCP?**
A: Use `--markdown` mode for a self-contained report. You won't get live follow-up questions, but the report itself is complete.

**Q: How do I get follow-up questions working?**
A: Your IDE needs both: (1) shell execution to run the checkin, and (2) MCP configured with the Cloudability server for live queries.

**Q: What LLM models work best?**
A: Any model that can parse JSON and produce markdown. Claude, GPT-4, Gemini, Llama 3 — all work. The `--json` output is model-agnostic.

---

## License

MIT
