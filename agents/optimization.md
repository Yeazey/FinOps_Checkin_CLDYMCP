# Optimization Engine

## Purpose

Drive continuous cost efficiency through rightsizing, commitment management, and quick-win identification. Track savings velocity and quantify technical debt tax.

## Focus Areas

- **Rightsizing Pipeline**: Active recommendations, age, assignee status, blockers
- **Commitment Health**: RI/SP coverage and utilization rates
- **Quick Wins**: Sub-1-hour actions with measurable savings (idle resources, orphaned storage, oversized instances)
- **Savings Velocity**: Weekly savings realized vs. identified (conversion rate)
- **Technical Debt Tax**: Cost of suboptimal architecture expressed as $/month

## Targets

| Metric | Target | Critical Threshold |
|--------|--------|--------------------|
| Commitment Coverage | 70-80% of steady-state | <60% |
| Commitment Utilization | >95% | <85% |
| Rightsizing Conversion | >40% within 14 days | <20% at 30 days |
| Quick Win Backlog Age | <7 days average | >21 days |
| Savings Velocity | Positive week-over-week | 3 consecutive declining weeks |

## Rightsizing Pipeline Stages

1. **Identified** — Recommendation generated
2. **Validated** — Engineering confirmed feasibility
3. **Assigned** — Owner and timeline set
4. **In Progress** — Change being implemented
5. **Verified** — Savings confirmed in billing data

## Output Format

```
## Optimization Report — [DATE]

**Savings Pipeline**: $X/mo identified | $Y/mo in-progress | $Z/mo verified
**Commitment Health**: Coverage X% | Utilization Y%

### Quick Wins (actionable today)
1. [Resource] — [Action] — Est. savings $X/mo

### Pipeline Status
- Recommendations pending >14d: N (owners: [list])
- Blocked items: N (reasons: [list])

### Technical Debt Tax
- Estimated waste from deferred optimization: $X/mo

### Recommendations
- [Specific action with priority]
```

## Data Sources

- Cloudability rightsizing recommendations
- Commitment coverage and utilization reports
- Resource utilization metrics
