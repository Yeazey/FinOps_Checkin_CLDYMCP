const EFFORT_HOURS = { minutes: 0.08, hours: 2.5, sprint: 80, quarter: 480 };
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function scoreAction(action) {
  const daily = action.costOfInaction || 0;
  const time = action.timeCriticality || 1;
  const confidence = action.confidence || 0.7;
  const effort = EFFORT_HOURS[action.effort] || 2.5;
  return (daily * time * confidence) / effort;
}

function classifyBlastRadius(action) {
  if (action.effort === 'minutes' && (action.savings || 0) < 500) return 'auto-safe';
  if (action.effort === 'quarter' || (action.savings || 0) > 10000) return 'human-only';
  return 'approval-required';
}

function mapOwner(action) {
  const type = action.type || '';
  if (type.includes('rightsizing') || type.includes('instance')) return 'engineering';
  if (type.includes('budget') || type.includes('forecast')) return 'finops';
  if (type.includes('anomaly') || type.includes('security')) return 'platform';
  return 'finops';
}

function mapMeetingType(action) {
  if (action.severity === 'critical') return 'sync-15';
  if (action.effort === 'quarter') return 'quarterly-review';
  if (action.effort === 'sprint') return 'sprint-planning';
  return 'async';
}

export function analyzeActions(agentOutputs) {
  const { costs, forecast, optimization, anomalies, operations } = agentOutputs || {};
  const allAlerts = [
    ...(costs?.alerts || []),
    ...(forecast?.alerts || []),
    ...(optimization?.alerts || []),
    ...(anomalies?.alerts || []),
    ...(operations?.alerts || []),
  ];

  // Convert alerts to scored actions
  const actions = allAlerts.map(alert => {
    const base = {
      severity: alert.severity || 'medium',
      title: alert.message || alert.title || 'Action needed',
      detail: alert.detail || '',
      type: alert.source || '',
      effort: alert.effort || (alert.severity === 'critical' ? 'hours' : 'sprint'),
      savings: alert.savings || 0,
      costOfInaction: alert.costOfInaction || (alert.severity === 'critical' ? 1000 : alert.severity === 'high' ? 500 : 100),
      timeCriticality: alert.severity === 'critical' ? 3 : alert.severity === 'high' ? 2 : 1,
      confidence: alert.confidence || 0.7,
    };
    base.score = scoreAction(base);
    base.blastRadius = classifyBlastRadius(base);
    base.owner = mapOwner(base);
    base.meetingType = mapMeetingType(base);
    return base;
  });

  actions.sort((a, b) => b.score - a.score);

  const priorityActions = actions.map((a, i) => ({
    rank: i + 1, severity: a.severity, title: a.title, detail: a.detail,
    owner: a.owner, effort: a.effort, savings: a.savings,
    costOfInaction: a.costOfInaction, blastRadius: a.blastRadius, meetingType: a.meetingType,
  }));

  // Generate meetings from top actions
  const meetingMap = new Map();
  for (const a of priorityActions.slice(0, 5)) {
    const key = `${a.meetingType}-${a.owner}`;
    if (!meetingMap.has(key)) {
      const day = a.meetingType === 'async' ? 'today' : DAYS[new Date().getDay() + 1] || 'tomorrow';
      const duration = a.meetingType === 'sync-15' ? '15m' : a.meetingType === 'sprint-planning' ? '30m' : a.meetingType === 'quarterly-review' ? '60m' : '5m';
      meetingMap.set(key, { day, who: a.owner, topic: a.title, duration });
    }
  }

  const topAction = priorityActions[0];
  const insightOfDay = topAction
    ? `Top priority: ${topAction.title} (${topAction.severity}, ~$${topAction.costOfInaction}/day cost of inaction)`
    : 'No urgent actions today — focus on maturity improvements.';

  return { priorityActions, meetings: [...meetingMap.values()], insightOfDay, alerts: allAlerts };
}
