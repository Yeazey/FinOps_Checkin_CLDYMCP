# /dailycheckin — Multi-Agent FinOps Daily Standup (v2)

## Vision

A daily intelligence system that doesn't just report what happened — it tells you what to DO, who to TALK TO, and what happens if you DON'T ACT. Built for a senior FinOps practitioner who needs to scan in 2 minutes, act in 10, and have full context for any stakeholder conversation.

---

## Architecture (7 Agents)

```
User triggers /dailycheckin
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 1: DATA COLLECTION (single MCP connection, parallel queries) │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 1. COST      │  │ 2. FORECAST &    │  │ 3. OPTIMIZATION  │
│    ANALYSIS  │  │    BUDGET        │  │    ENGINE        │
│    AGENT     │  │    VARIANCE      │  │    AGENT         │
└──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘
       │                   │                      │
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 4. ANOMALY & │  │ 5. OPERATIONS &  │  │ 6. ACTIONS &     │
│    RISK      │  │    STRATEGY      │  │    INSIGHTS      │ ← NEW
│    AGENT     │  │    AGENT         │  │    AGENT         │
└──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘
       │                   │                      │
       └───────────────────┼──────────────────────┘
                           ▼
              ┌──────────────────────┐
              │ 7. FINOPS            │
              │    ORCHESTRATOR      │
              │    (Synthesizer)     │
              └──────────┬───────────┘
                         ▼
                Daily Standup Output
```

---

## What's New in v2

| Addition | Why |
|----------|-----|
| **Agent 6: Actions & Insights** | Prioritizes across ALL domains, assigns owners, calculates cost of inaction, maps to team meetings |
| **Unit Economics** | Cost per user/transaction tracked daily — not just total spend |
| **Cost of Inaction** | Every recommendation shows what happens if you wait |
| **Team Engagement Map** | Which teams to meet, what to discuss, with meeting prep context |
| **Leading Indicators** | Catches waste BEFORE it hits billing (idle CPU, orphaned resources, scaling drift) |
| **Sustainability Score** | GreenOps metrics alongside financial — same actions reduce both |
| **Gamification Hooks** | Team leaderboard data, "win of the week" identification |
| **AI/GPU Cost Intelligence** | Token economics, cost per inference, model efficiency tracking |
| **Technical Debt Tax** | Infrastructure premium from architectural shortcuts |
| **Closed-Loop Tracking** | Actions tracked from detection → decision → execution → verification |

---

## Agent 6: Actions & Insights Agent (NEW)

**File:** `agents/actions-insights.md`

**Purpose:** The decision engine. Takes findings from ALL other agents and produces a prioritized action plan with owners, deadlines, cost-of-inaction, and team engagement recommendations.

### Prioritization Framework: WSJF + Blast Radius

Every action scored on:
```
PRIORITY SCORE = (Daily Cost of Inaction × Time Criticality × Confidence) ÷ Implementation Effort

Where:
- Daily Cost of Inaction = $ wasted per day if not acted on
- Time Criticality = 1-5 (5 = expires soon, 1 = stable opportunity)
- Confidence = 0.5-1.0 (how certain is the savings estimate?)
- Effort = hours to implement (lower = higher priority)
```

### Blast Radius Classification

| Tier | Coverage | Examples | Decision Speed |
|------|----------|----------|----------------|
| **Auto-safe** (70-80% of value) | Idle non-prod termination, log retention, disk class downgrade | Automated, no approval needed |
| **Approval-required** (15-20%) | Prod rightsizing, RI/SP purchase, schedule change | One-click approve, <30 min |
| **Human-only** (5-10%) | Architecture change, vendor negotiation, multi-team coordination | Days-weeks, needs meetings |

### Team Engagement Mapping

For each action, the agent determines:
```
WHO TO MEET:
├── Resource Owner (Engineering Lead)
├── Budget Owner (Finance/Product)
├── Technical Approver (SRE/Platform)
└── Executive Sponsor (if > $X threshold)

MEETING TYPE:
├── Async (Slack message with context + approve button)
├── 15-min sync (quick decision with pre-filled context)
├── Sprint planning item (add to next sprint backlog)
└── Quarterly review item (strategic, needs committee)
```

### RACI by Action Type

| Action | Responsible | Accountable | Consulted | Informed |
|--------|-------------|-------------|-----------|----------|
| Idle non-prod cleanup | Automation/Eng | FinOps | — | Finance |
| Production rightsizing | Engineering | Eng Lead | SRE, FinOps | Finance |
| RI/SP purchase | Procurement | Finance | Eng, FinOps | Exec |
| Architecture redesign | Engineering | Product/GM | FinOps, SRE | Exec |
| Vendor renegotiation | Procurement | Exec | FinOps, Finance | Engineering |
| AI/GPU cost review | ML Engineering | ML Lead | FinOps, Finance | Product |
| Tag compliance fix | Platform Eng | Eng Lead | FinOps | Finance |
| Data platform tuning | Data Eng | Data Lead | FinOps | Finance |

### Cost of Inaction Calculator

Every action includes:
```
COST OF INACTION:
- Per day: $X/day accumulating
- Per week: $X already lost this week
- Per month: $X if not addressed by month-end
- Compounding: [Does this enable other waste? Does the pattern spread?]
- Non-financial: [Security exposure, compliance risk, team frustration]
```

### Action Lifecycle Tracking
```
DETECTED → CLASSIFIED → ASSIGNED → APPROVED → EXECUTED → VERIFIED
    │           │            │          │           │          │
  Agent 1-5   Agent 6     Agent 6    Owner     Automation   Agent 6
  finds it    scores it   routes it  decides   implements   confirms
```

### Output Format
```
🎯 PRIORITY ACTIONS

#1 [🔴 CRITICAL] Terminate idle Azure NC48ads GPU — $73/day wasting
   Owner: ML Engineering (unassigned → suggest: [team lead])
   Effort: 5 min | Confidence: 95% | Blast: Auto-safe
   Cost of inaction: $2,190/mo compounding
   Action: Downsize to NV6ads_A10_v5 or terminate if unused
   Meeting: None needed — Slack notification to ML team

#2 [🔴 HIGH] 3 RDS instances oversized by 57-76%
   Owner: Database team
   Effort: 1 sprint | Confidence: 85% | Blast: Approval-required
   Cost of inaction: $180/day ($5,431/mo combined)
   Action: Downsize db.m8g.4xl → db.m6g.2xl (+ 2 others)
   Meeting: 15-min sync with DBA lead this week

#3 [🟡 MEDIUM] Celonis/Wiz/Reltio marketplace surge +$1.24M
   Owner: Procurement / Azure team
   Effort: Meeting | Confidence: N/A (validation) | Blast: Human-only
   Cost of inaction: None if planned; $1.24M/mo if accidental
   Action: Validate these were approved purchases with budget coverage
   Meeting: Check with Procurement lead — were these in plan?

MEETINGS THIS WEEK:
┌─────────────────────────────────────────────────────┐
│ Mon: ML Eng Lead — GPU idle resources (5 min async) │
│ Tue: DBA Lead — RDS rightsizing (15 min sync)       │
│ Wed: Procurement — Azure marketplace validation     │
│ Thu: Platform Eng — Tag compliance (sprint planning)│
└─────────────────────────────────────────────────────┘
```

---

## Agent 1: Cost Analysis Agent (Enhanced)

**File:** `agents/cost-analysis.md`

### Purpose
Daily spend triage — what changed, why, and does it matter in BUSINESS CONTEXT?

### Data Sources
- `cldy_cost_report_run` — yesterday vs 7-day avg, MTD vs prior month MTD
- `cldy_anomalies_list` — detected anomalies in past 24h
- Unit economics calculation (cost ÷ business volume where available)

### Focus Areas

**Spend Snapshot:**
- Day-over-day change by vendor, service, account
- MTD spend vs same-day-of-month last period
- Services with >15% increase vs 7-day rolling baseline
- New services or regions appearing for first time

**Unit Economics (Elite Practice):**
- Cost per unit trends (where measurable)
- Cloud Efficiency Rate: is spend growing faster or slower than business?
- "A 50% spend jump with 3x transaction growth = GOOD. Same jump with flat traffic = BAD."

**Leading Indicators (Predictive):**
- Non-production costs growing faster than production (ratio drift)
- Services with accelerating growth curves (trending toward breakout)
- Weekend/after-hours spend anomalies (forgotten resources)

**AI/GPU Spend (2026 Critical):**
- GPU instance costs by team/model
- Token consumption trends (if applicable)
- Cost per inference/invocation tracking
- Model efficiency comparisons

### Alert Thresholds
- 🔴 Critical: >200% of 30-day baseline OR >$10K unexplained single-day increase
- 🟡 Warning: >150% of average OR >20% week-over-week sustained increase
- 🟢 Normal: Within 1.5σ of rolling average
- ℹ️ Context: >10% increase correlated with business growth metric = document, don't alert

### Output Format
```
📊 COST SNAPSHOT
Yesterday: $X,XXX (▲/▼ X% vs 7-day avg)
MTD: $XX,XXX — projected $XXX,XXX at month-end
vs Last Month Same Day: ▲/▼ X%

TOP MOVERS (last 24h):
  ▲ [service] +$X,XXX (+X%) — [context: deployment? growth? waste?]
  ▼ [service] -$X,XXX (-X%) — [context]

LEADING INDICATORS:
  • Non-prod/prod ratio: X% (baseline: X%) [stable/drifting]
  • New services detected: [list or "none"]
  • AI/GPU spend: $X,XXX/day (▲/▼ X% vs last week)
```

---

## Agent 2: Forecast & Budget Variance Agent (Enhanced)

**File:** `agents/forecast-budget.md`

### Purpose
Are we on track? When will we breach? What's the confidence level?

### Data Sources
- `cldy_cost_report_run` — MTD spend, daily rate
- `cldy_forecast_get` / `cldy_estimate_get`
- `list_budgets` / `get_budget`
- Historical monthly data for trend analysis

### Focus Areas

**Budget Health:**
- Burn rate: (MTD spend ÷ days elapsed) vs (budget ÷ days in month)
- End-of-month projection with confidence bands
- Days until budget exceeded (if trajectory suggests overage)
- Budget consumption % vs calendar % (should be equal ± 5%)

**Forecast Accuracy:**
- Forecast vs actual drift: is reality tracking above/below forecast?
- Variance by cost center / business unit
- Forecast accuracy trend (improving or degrading over time?)

**Variance Classification (FinOps Foundation):**
- Favorable variance (underspend) — is budget being productively deployed?
- Unfavorable variance (overspend) — legitimate growth or waste?
- Structural variance — one-time events vs systemic pattern?

**Escalation Logic (4-Level from FinOps Foundation):**
1. Engineering self-corrects (same day)
2. Budget owner releases holdback (48h)
3. Finance review (1 week)
4. Leadership adjustment (5-10 days)

**Seasonal & Event Awareness:**
- Month-length normalization (31-day month ≠ 28-day month)
- Known upcoming events that will impact forecast
- Commitment amortization impact on reported numbers

### Maturity Targets
| Level | Forecast Variance | Update Frequency |
|-------|------------------|-----------------|
| Crawl | <20% | Yearly |
| Walk | <15% | Monthly |
| Run | <5% | Weekly/real-time |

### Output Format
```
📈 BUDGET & FORECAST
Budget: $XXX,XXX | MTD: $XX,XXX (XX% consumed, XX% of month elapsed)
Burn Rate: $X,XXX/day (budget allows $X,XXX/day) [on track / ⚠️ hot]
Projection: $XXX,XXX month-end (▲/▼ $X vs budget)
Days to breach: X days | Confidence: X%

VARIANCE ANALYSIS:
  Largest favorable: [service] -$X vs plan (why)
  Largest unfavorable: [service] +$X vs plan (why)
  Structural shifts: [any one-time or systemic changes]

FORECAST HEALTH:
  Accuracy (last 30d): X% (target: <15% variance)
  Drift direction: [forecast too high / too low / tracking well]
```

---

## Agent 3: Optimization Engine Agent (Enhanced)

**File:** `agents/optimization.md`

### Purpose
What can we fix RIGHT NOW? What's the full pipeline? What's the savings velocity?

### Data Sources
- `cldy_rightsizing_list` — recommendations with savings
- `cldy_cost_report_run` — instance types, commitment analysis
- Container utilization (if available)

### Focus Areas

**Rightsizing Pipeline:**
- Total addressable savings (open recommendations)
- New recommendations since last check
- Top 5 by potential savings with blast-radius classification
- Stale recommendations (>30 days without action) — these are the execution gap
- Avg oversizing % across fleet (utilization proxy)

**Commitment Health:**
- RI/SP coverage rate vs eligible on-demand spend (target: 70-80%)
- Utilization of existing commitments (any <80% = waste)
- Commitments expiring in 30/60/90 days (purchase window)
- Effective Savings Rate (ESR): actual discount achieved across portfolio

**Quick Wins Available Today:**
- Orphaned resources (unattached volumes, unused IPs)
- gp2 → gp3 migrations (20% savings, zero risk)
- Intel → Graviton candidates (20-40% savings)
- Non-prod running outside business hours (65% savings on schedule)
- Previous-gen → current-gen (5-15% better price/performance)

**Medium-Term Pipeline:**
- Architecture changes with ROI estimate
- Container optimization (pods requesting 2-5x actual usage)
- Storage tiering (S3 → Glacier for cold data)
- Data platform tuning (Snowflake warehouse sizing, Databricks cluster config)

**Savings Velocity Tracking:**
- Realized this month vs. last month
- Savings decay (do optimized resources grow back?)
- Pipeline throughput: actions completed per week

**Technical Debt Tax:**
- Infrastructure premium from inefficient architectures
- Cost of maintaining legacy systems vs modernization ROI
- "Tech debt raises cloud costs by up to 30% annually"

### Output Format
```
💰 OPTIMIZATION PIPELINE
Total addressable: $XX,XXX/mo ($XXX,XXX/yr)
Quick wins (today): $X,XXX/mo from N actions [Auto-safe tier]
Approval needed: $X,XXX/mo from N actions [Pre-filled tickets ready]
Architecture review: $X,XXX/mo [Needs sprint planning]

TOP OPPORTUNITIES:
1. [resource] → [action] = $X,XXX/mo (XX% oversized) [tier]
2. [resource] → [action] = $X,XXX/mo [tier]
3. [resource] → [action] = $X,XXX/mo [tier]

COMMITMENT HEALTH:
  Coverage: XX% (target: 70-80%) | Utilization: XX% (target: >95%)
  Expiring soon: N commitments in 30 days ($X,XXX/mo at risk)
  ESR: XX% effective discount rate

SAVINGS VELOCITY:
  This month realized: $X,XXX
  Pipeline throughput: X actions/week (trend: ▲/▼)
  Stale recs (>30d): N items worth $X,XXX/mo ← execution gap
```

---

## Agent 4: Anomaly & Risk Agent (Enhanced)

**File:** `agents/anomaly-risk.md`

### Purpose
What's broken? What's about to break? What are we blind to?

### Data Sources
- `cldy_anomalies_list` — all views, past 7 days
- `cldy_anomaly_subscriptions_list` — coverage audit
- `cldy_cost_report_run` — spike detection via period comparison
- `list_views` — identify unmonitored cost centers

### Focus Areas

**Active Anomalies (Triage):**
- Unresolved anomalies sorted by $ impact
- New in past 24 hours (highest priority)
- Recurring patterns (same service spiking repeatedly = systemic)
- Classification for each:
  - ✅ Legitimate growth (document and close)
  - 🗑️ Waste/misconfiguration (act immediately)
  - 🔧 Governance gap (flag for process fix)
  - ❓ Unknown (investigate before anything else)

**Risk Signals (Predictive):**
- Services with accelerating cost curves (trending toward breakout)
- Commitment utilization declining week-over-week
- Budget trajectories approaching breach
- Single-point-of-failure services (small misconfig = massive cost)
- Autoscaling rules expanding faster than workloads shrink

**Coverage Gaps (What You CAN'T See):**
- Cost centers without anomaly alerting configured
- High-spend services without optimization recommendations (blind spots)
- Accounts without budgets assigned
- Resources deployed without required tags (shadow spend)

**Security-Cost Intersection:**
- Idle resources nobody monitors = attack surface
- Resources in unexpected regions (cost anomaly AND security signal)
- Untagged resources with high network egress

### Output Format
```
🚨 ANOMALIES & RISK

ACTIVE (last 7 days): N total (🔴 X critical, 🟡 X warning, 🟢 X info)

NEW TODAY:
  🔴 [service/account] +$X above baseline — [classification]
     → Root cause: [known/investigating/unknown]
  🟡 [service/account] +$X above baseline — [classification]

RECURRING PATTERNS:
  • [service] has spiked X times in 30 days — systemic issue?

RISK WATCH:
  • [service] trending +X%/week — will exceed baseline by [date]
  • [commitment] utilization dropped to X% — investigate usage shift
  • [X] cost centers have NO anomaly monitoring configured

BLIND SPOTS:
  • $X,XXX/day in spend has no budget assigned
  • N resources deployed this week without required tags
```

---

## Agent 5: Operations & Strategy Agent (Enhanced)

**File:** `agents/operations-strategy.md`

### Purpose
The 30,000-foot view. Process health, governance maturity, strategic planning.

### Data Sources
- `cldy_cost_report_run` — allocation analysis, vendor distribution
- `cldy_rightsizing_list` — recommendation adoption metrics
- `list_views`, `list_budgets`, `list_business_mappings`
- Historical trend data for maturity assessment

### Focus Areas

**FinOps Maturity Assessment (Crawl/Walk/Run):**

| Capability | Your Level | Evidence |
|------------|-----------|----------|
| Tag compliance | ? | X% spend allocated |
| Forecast accuracy | ? | ±X% variance |
| Commitment coverage | ? | X% covered |
| Anomaly response | ? | Avg Xh to resolution |
| Recommendation adoption | ? | X% acted in 30 days |

**Governance Health:**
- Budget coverage: do all major cost centers have budgets?
- Anomaly alert coverage: which views are unmonitored?
- Tag/allocation coverage: % of spend attributable to team/owner
- Policy compliance: teams exceeding budgets, unapproved services

**Process Velocity:**
- Recommendation adoption rate (acted ÷ total in 30 days)
- Time-to-action: avg days from recommendation to resolution
- Savings decay: are previously-optimized resources growing back?
- Action-rate decay curve: week 1 = 30% → week 4 = 5% (are we beating this?)

**Strategic Planning Horizons:**

| Horizon | Focus |
|---------|-------|
| THIS WEEK | Top 3 operational items, anomaly resolution, quick wins |
| THIS MONTH | Process improvements, governance gaps, commitment decisions |
| THIS QUARTER | Contract renewals, architecture investments, maturity advancement |

**Vendor & Contract Intelligence:**
- EDP/MACC burn rate vs. commitment timeline
- Contract renewal dates approaching (30/60/90 day warnings)
- Multi-cloud distribution trend (concentration risk or strategic spread?)
- SaaS renewal calendar (auto-renewals, unused licenses)

**Sustainability Score (GreenOps):**
- Idle resources = both $ waste AND carbon waste
- Region optimization opportunities (lower-carbon regions available?)
- "If you're doing FinOps, you're amplifying GreenOps automatically"

**Organizational Engagement:**
- Which teams are actively participating in cost reviews?
- Which teams have stale/ignored recommendations?
- Gamification opportunities: "Win of the Week" candidate identification
- Engineering culture signals: are teams proactively asking "what does this cost?"

### Output Format
```
🏛️ OPERATIONS & STRATEGY

MATURITY SNAPSHOT: [Crawl / Walk / Run] indicators
  ✅ Tag coverage: X% (target: 90%)
  ✅ Budget coverage: X cost centers covered
  ⚠️ Recommendation adoption: X% (target: >60%)
  ❌ Avg time-to-action: X days (target: <14 days)

GOVERNANCE HEALTH:
  • X% of spend fully allocated to owners
  • X budgets active across Y cost centers
  • Z cost centers have no monitoring ← gap

PROCESS VELOCITY:
  • Actions completed this week: N
  • Savings velocity: $X,XXX/mo realized this month
  • Stale items: N recommendations ignored >30 days

PLANNING:
  This week: [3 tactical items]
  This month: [key governance/process initiative]
  This quarter: [contract renewal, architecture decision]
  
ENGAGEMENT:
  • Most engaged team: [team] (X actions completed)
  • Least engaged team: [team] (X recs ignored)
  • Win of the week candidate: [specific achievement]
```

---

## Agent 7: FinOps Orchestrator (Enhanced)

**File:** `agents/orchestrator.md`

### Purpose
Synthesize all agent outputs into a 2-minute scannable daily standup. The "executive intelligence layer."

### Synthesis Logic
1. **Deduplicate** — If multiple agents flag the same issue, consolidate into single item
2. **Cross-reference** — Connect anomalies to budget impact, cost spikes to optimization opportunities
3. **Priority-rank** — Use Agent 6's scoring across all domains
4. **Contextualize** — Is this new? Recurring? Getting worse? Resolved?
5. **Narrate** — Turn data into story ("Costs are stable, but GPU spend is accelerating faster than AI revenue — worth a conversation with ML team")

### Output Structure
```
═══════════════════════════════════════════════════════════════════════
   🎯 FINOPS DAILY STANDUP — [Day, Date]
   [Current Month] | Day X of Y | [X days until month-end]
═══════════════════════════════════════════════════════════════════════

💬 ONE-LINER: [Single sentence summary of the day's state]
   e.g., "Spend is tracking to budget. 3 quick wins worth $4K/mo available.
         GPU costs up 12% — validate with ML team."

───────────────────────────────────────────────────────────────────────

🚨 DO TODAY (priority actions — each with owner + $ impact)
   1. [Action] — saves $X/mo — [Owner] — [5 min / 15 min / 1 sprint]
   2. [Action] — saves $X/mo — [Owner] — [effort]
   3. [Action] — validates $X — [Owner] — [effort]

📊 NUMBERS
   Yesterday: $X,XXX (▲/▼ X% vs baseline) | MTD: $XX,XXX of $XXX,XXX budget
   Projection: $XXX,XXX month-end [on track ✅ / ⚠️ +$X over]
   Savings pipeline: $X,XXX/mo addressable | $X,XXX realized this month

🔍 WHAT CHANGED (last 24h)
   • [Cost change with context]
   • [Anomaly or alert with classification]
   • [Action completed yesterday with result]

⚠️  WATCH LIST
   • [Trend or risk being monitored]
   • [Commitment expiring in X days]
   • [Team engagement gap]

📅 MEETINGS THIS WEEK
   • [Day]: [Person/Team] — [Topic] — [Prep needed: Y/N]

💡 INSIGHT OF THE DAY
   [One strategic observation that wouldn't be obvious from the numbers alone]
   e.g., "Intel spend is 62% of compute. Each 10% migrated to Graviton
         saves ~$X,XXX/mo. Platform team should own a migration sprint."

───────────────────────────────────────────────────────────────────────
   FinOps Daily Intelligence | Powered by Cloudability MCP
   Generated: [timestamp] | Next check-in: [tomorrow time]
═══════════════════════════════════════════════════════════════════════
```

### Narrative Principles
- **Every number needs context** — "$50K increase" means nothing; "$50K increase driven by planned Celonis onboarding" is useful
- **Every action needs an owner** — Not "rightsize RDS" but "DBA team: rightsize 3 RDS instances, saves $5.4K/mo"
- **Every risk needs a timeline** — Not "budget at risk" but "at current rate, budget exceeded by June 28"
- **Signal over noise** — Suppress routine fluctuations. Surface only what needs human attention.
- **The "Prius Effect"** — Make the cost of decisions visible in real-time

---

## Implementation Architecture

### Project Structure
```
/Users/kingyeazey/cloudability-dailycheckin/
├── package.json
├── .env → (credentials)
├── .env.example
├── .gitignore
├── PLAN_v2.md (this file)
├── agents/                          ← Agent instruction files
│   ├── cost-analysis.md
│   ├── forecast-budget.md
│   ├── optimization.md
│   ├── anomaly-risk.md
│   ├── operations-strategy.md
│   ├── actions-insights.md          ← NEW
│   └── orchestrator.md
├── src/
│   ├── main.mjs                     ← Entry point
│   ├── collector.mjs                ← Single MCP connection, all queries
│   ├── agents/
│   │   ├── cost-analysis.mjs
│   │   ├── forecast-budget.mjs
│   │   ├── optimization.mjs
│   │   ├── anomaly-risk.mjs
│   │   ├── operations.mjs
│   │   ├── actions-insights.mjs     ← NEW
│   │   └── orchestrator.mjs
│   └── output/
│       ├── terminal.mjs             ← Rich ANSI terminal output
│       └── html.mjs                 ← Optional HTML report
└── output/
    └── standup_[YYYY-MM-DD].html
```

### Execution Flow
```
1. main.mjs initializes → connects to Cloudability MCP (single connection)
2. Parallel data fetch (all queries at once, ~10-15 seconds)
3. Data distributed to Agent 1-5 modules (parallel processing)
4. Agent 6 receives ALL agent outputs → scores, prioritizes, maps teams
5. Agent 7 (Orchestrator) synthesizes into final standup
6. Output to terminal (immediate) + save HTML (archival)
7. Total time target: <30 seconds
```

### Data Collection Strategy (Fetch Once, Use Everywhere)

| Query | Tool | Parameters | Used By |
|-------|------|-----------|---------|
| Yesterday by vendor+service | `cldy_cost_report_run` | dims: vendor,service_name; yesterday | Agent 1 |
| 7-day avg by vendor+service | `cldy_cost_report_run` | dims: vendor,service_name; last 7d | Agent 1 |
| MTD by vendor | `cldy_cost_report_run` | dims: vendor; month-to-date | Agent 1, 2, 7 |
| Prior month same-day | `cldy_cost_report_run` | dims: vendor; last month 1st→same day | Agent 2 |
| MTD by service (top 30) | `cldy_cost_report_run` | dims: vendor,service_name; MTD; limit 30 | Agent 1, 3, 6 |
| Instance types MTD | `cldy_cost_report_run` | dims: vendor,instance_type; MTD | Agent 3 |
| Rightsizing recs (top 50) | `cldy_rightsizing_list` | limit 50, sort -potentialSavings | Agent 3, 5, 6 |
| Anomalies (7 days) | `cldy_anomalies_list` | past 7 days, all views | Agent 4, 6 |
| Budgets | `list_budgets` | all | Agent 2, 5 |
| Views | `list_views` | all | Agent 4, 5 |
| Forecast | `cldy_forecast_get` | current | Agent 2 |
| Estimate | `cldy_estimate_get` | current period | Agent 2 |

**Total API calls: ~12 (parallelized into 3-4 batches)**

---

## New Ideas Beyond Original Scope

### 1. The "Monday Brief" vs "Daily Check" Mode
- **Daily (Tue-Fri):** Quick 20-line standup, focus on changes since yesterday
- **Monday Brief:** Expanded report covering full prior week, sets weekly priorities, identifies meetings needed
- **Month-Start:** Includes prior month recap, budget reset, commitment review

### 2. Confidence Scoring for Every Number
Not just "$50K savings available" but "$50K savings available (85% confidence based on 30-day utilization data)." This builds trust and helps prioritize.

### 3. "What If" Scenarios
- "If we migrated all Intel m5 to Graviton m7g, estimated savings: $X/mo"
- "If we purchased 1yr No-Upfront SP for stable baseline, saves: $X/mo"
- "If non-prod scheduled to 10h/day, saves: $X/mo"

### 4. Historical Action Log
Track what was recommended, when it was acted on, and what the actual savings were. Builds a track record proving FinOps ROI.
```
LAST WEEK'S ACTIONS — RESULTS:
  ✅ Terminated 3 idle dev instances → saved $420/mo (projected $380) 
  ✅ Purchased SP for stable EC2 → saving $1,200/mo (on track)
  ⏳ RDS rightsizing still pending (assigned to DBA team, Day 8 of 14 SLA)
```

### 5. Team Scoreboard (Gamification)
```
TEAM ENGAGEMENT SCOREBOARD:
  🥇 Platform Team: 8 actions completed, $12K/mo saved
  🥈 Data Team: 5 actions completed, $8K/mo saved
  🥉 ML Team: 2 actions completed, $3K/mo saved
  ⚠️ Backend Team: 0 actions in 30 days, $15K/mo in open recs
```

### 6. "Cost of the Day" Educational Snippet
One rotating fact to build cost literacy across the org:
- "Did you know? A single NAT Gateway costs $32/mo + $0.045/GB. VPC endpoints are $7.20/mo flat."
- "Graviton instances deliver 40% better price/performance than equivalent Intel for most workloads."
- "An unattached EBS volume costs the same as an attached one. Delete or snapshot and remove."

### 7. SaaS Renewal Calendar Integration
- Flag upcoming SaaS auto-renewals (Celonis, Wiz, Reltio, Datadog, etc.)
- Highlight unused licenses for renegotiation
- "Reltio Enterprise 360 renews in 45 days — usage review recommended"

### 8. AI/Token Economics Section (2026 Critical)
```
🤖 AI COST INTELLIGENCE
  Total AI/GPU spend (MTD): $X,XXX
  Cost per inference: $0.XX (▲/▼ vs last week)
  Model efficiency: [model A] costs 3x [model B] for similar quality
  GPU utilization: X% (target: >70%)
  Recommendation: Consider [smaller model / batch inference / spot GPUs]
```

### 9. Sustainability Score
```
🌱 SUSTAINABILITY
  Estimated carbon saved from optimizations: X kg CO₂e
  Idle compute carbon waste: X kg CO₂e/day
  Low-carbon region opportunities: [region] is 30% lower carbon intensity
```

### 10. The "Trust Arc" — Progressive Automation
Start with full human review. As confidence builds:
- Week 1-4: Report only (all agents produce recommendations)
- Week 5-8: Auto-safe tier executes automatically, reports results
- Week 9-12: Approval-required tier sends pre-filled tickets to owners
- Week 13+: Human-only tier surfaces in standup for planning

---

## Decision Velocity Standards

| Decision Type | Target Speed | Who Decides |
|---------------|-------------|-------------|
| Anomaly triage (classify) | 15 minutes | FinOps |
| Idle non-prod termination | Same day (automated) | Automation |
| Production rightsizing | Within sprint (1-2 weeks) | Engineering lead |
| RI/SP purchase | 5 business days | Procurement + Finance |
| Architecture change | Within quarter | Product/GM + Engineering |
| Vendor renegotiation | 30-60 days before renewal | Procurement + Exec |
| Budget breach response | Same business day | Budget owner |

---

## Meeting Cadence (Recommended)

| Cadence | Attendees | Duration | Agenda |
|---------|-----------|----------|--------|
| **Daily** (self) | You | 5 min | Scan standup output, act on priorities |
| **Weekly** (Eng+FinOps) | Eng leads + FinOps | 15 min | Anomaly review, action assignment, commitment watch |
| **Biweekly** (Optimization) | Eng + SRE + FinOps | 30 min | Rightsizing progress, savings velocity, pipeline |
| **Monthly** (Commitment Board) | Finance + Procurement + Eng + FinOps | 30 min | Coverage review, purchase decisions, renewals |
| **Monthly** (Finance Variance) | Finance + FinOps | 30 min | Budget vs actual, reforecast, one-offs |
| **Quarterly** (Exec Review) | CTO/CFO + VP Eng + FinOps | 90 min | Unit economics, strategic initiatives, contract planning |

---

## Success Criteria

- [ ] `/dailycheckin` produces complete standup in <30 seconds
- [ ] All 7 agent domains represented with actionable output
- [ ] Every action has: owner, $ impact, effort, deadline, cost-of-inaction
- [ ] Priority scoring produces sensible ordering (quick wins first, strategic items planned)
- [ ] Team/meeting recommendations are specific (who, when, about what)
- [ ] Monday mode is richer than daily mode
- [ ] Historical action tracking shows ROI over time
- [ ] Output scannable in <2 minutes by practitioner
- [ ] Confidence levels attached to estimates
- [ ] Skill registered at `~/.kiro/skills/dailycheckin/SKILL.md`
- [ ] Pushed to GitHub (Yeazey)

---

## Key Design Principles

1. **Velocity over perfection** — Act on 80% confidence data today rather than 99% data next week
2. **Every insight needs an action** — If there's nothing to do differently, it's noise
3. **Cost of inaction is the real metric** — Not "you could save $X" but "you're LOSING $X/day"
4. **Closed-loop beats open-loop** — Track from detection to realization, not just identification
5. **Narrative over numbers** — "GPU costs growing 3x faster than AI revenue" > "$50K GPU spend"
6. **Progressive trust** — Start informing, earn the right to automate
7. **Audience-aware** — Same data, different framing for eng vs finance vs exec
8. **Compound value** — Each day's standup builds on prior days' context and actions
