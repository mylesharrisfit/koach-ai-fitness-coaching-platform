import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Anthropic from 'npm:@anthropic-ai/sdk';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Support entity automation payload (event.type === 'create' on CheckIn)
    let client_id = body.client_id;
    if (!client_id && body.event?.entity_name === 'CheckIn') {
      client_id = body.data?.client_id;
    }

    // If called from frontend, require auth
    if (!body.event && !client_id) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!client_id) return Response.json({ error: 'client_id required' }, { status: 400 });

    // Fetch all client data in parallel
    const [clients, checkIns, workoutSessions, messages] = await Promise.all([
      base44.asServiceRole.entities.Client.list('-created_date', 200).then(all => all.filter(c => c.id === client_id)),
      base44.asServiceRole.entities.CheckIn.filter({ client_id }, '-date', 20),
      base44.asServiceRole.entities.WorkoutSession.filter({ client_id }, '-completed_at', 20),
      base44.asServiceRole.entities.Message.filter({ client_id }, '-created_date', 50),
    ]);

    const client = clients[0];
    if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

    const sorted = [...checkIns].sort((a, b) => new Date(a.date) - new Date(b.date));
    const weeksOfData = sorted.length >= 2
      ? Math.round((new Date(sorted[sorted.length - 1].date) - new Date(sorted[0].date)) / (7 * 86400000))
      : 0;

    if (sorted.length < 3) {
      // Not enough data — return a stub
      const stub = {
        client_id,
        client_name: client.name,
        generated_at: new Date().toISOString(),
        weeks_of_data: weeksOfData,
        summary: `Not enough data yet — AI insights will appear after 4 check-ins of tracking.`,
        coaching_priority: null,
        trends: [],
        goal_pace: { status: 'no_goal' },
        predictions: {},
        correlations: [],
        client_insights: [`Keep logging your check-ins! Personalized insights unlock after 4 weeks of data. 🎯`],
        week_comparison: null,
      };
      const saved = await base44.asServiceRole.entities.ProgressAnalysis.create(stub);
      return Response.json({ analysis: saved });
    }

    // Build rich context for AI
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    const recent4 = sorted.slice(-4);

    const weightChange = first.weight && last.weight ? (last.weight - first.weight).toFixed(1) : null;
    const weeklyWeightRate = weightChange && weeksOfData > 0 ? (weightChange / weeksOfData).toFixed(2) : null;
    const recentWeights = recent4.filter(c => c.weight).map(c => c.weight);
    const plateauDetected = recentWeights.length >= 3 && Math.abs(recentWeights[recentWeights.length - 1] - recentWeights[0]) < 1.5;

    const avgTraining = sorted.length ? Math.round(sorted.reduce((s, c) => s + (c.compliance_training || 0), 0) / sorted.length) : null;
    const avgNutrition = sorted.length ? Math.round(sorted.reduce((s, c) => s + (c.compliance_nutrition || 0), 0) / sorted.length) : null;
    const avgEnergy = sorted.length ? (sorted.reduce((s, c) => s + (c.energy_level || 0), 0) / sorted.filter(c => c.energy_level).length).toFixed(1) : null;
    const avgMoodScore = (() => {
      const moodMap = { great: 5, good: 4, okay: 3, tired: 2, stressed: 1 };
      const scored = sorted.filter(c => c.mood).map(c => moodMap[c.mood] || 3);
      return scored.length ? (scored.reduce((s, v) => s + v, 0) / scored.length).toFixed(1) : null;
    })();

    // Mood trend (last 3 vs first 3)
    const moodMap = { great: 5, good: 4, okay: 3, tired: 2, stressed: 1 };
    const recentMoods = sorted.slice(-3).filter(c => c.mood).map(c => moodMap[c.mood] || 3);
    const olderMoods = sorted.slice(0, 3).filter(c => c.mood).map(c => moodMap[c.mood] || 3);
    const moodTrendDown = recentMoods.length && olderMoods.length &&
      (recentMoods.reduce((s, v) => s + v, 0) / recentMoods.length) < (olderMoods.reduce((s, v) => s + v, 0) / olderMoods.length) - 0.5;

    // Churn signals
    const lastCheckInDaysAgo = last?.date ? Math.floor((Date.now() - new Date(last.date)) / 86400000) : 99;
    const coachMessages = messages.filter(m => m.sender === 'coach').length;
    const clientMessages = messages.filter(m => m.sender === 'client').length;
    const responseRate = coachMessages > 0 ? Math.min(100, Math.round((clientMessages / coachMessages) * 100)) : 50;
    const churnSignals = (lastCheckInDaysAgo > 10 ? 30 : 0) + (avgTraining < 50 ? 20 : 0) + (moodTrendDown ? 20 : 0) + (plateauDetected ? 15 : 0) + (responseRate < 30 ? 15 : 0);
    const churnProbability = Math.min(95, churnSignals);

    // Goal pace
    const weeksToGoal = client.target_weight && weeklyWeightRate && parseFloat(weeklyWeightRate) !== 0
      ? Math.abs((parseFloat(last.weight || client.current_weight) - client.target_weight) / parseFloat(weeklyWeightRate)).toFixed(0)
      : null;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

    const prompt = `You are an expert AI fitness coach analyst. Analyze this client's complete progress data and return a structured JSON analysis.

CLIENT PROFILE:
Name: ${client.name}
Goal: ${client.goal?.replace(/_/g, ' ')}
Start weight: ${client.current_weight} lbs | Target: ${client.target_weight || 'not set'} lbs
Start date: ${client.start_date || sorted[0]?.date || 'unknown'}

PROGRESS SUMMARY:
Total check-ins: ${sorted.length} over ${weeksOfData} weeks
Weight change: ${weightChange !== null ? weightChange + ' lbs total' : 'no weight data'}
Weekly weight rate: ${weeklyWeightRate ? weeklyWeightRate + ' lbs/week' : 'N/A'}
Plateau detected (last 4 weeks < 1.5 lbs change): ${plateauDetected}
Estimated weeks to goal at current rate: ${weeksToGoal || 'N/A'}

LAST WEEK (most recent check-in on ${last.date}):
Weight: ${last.weight || 'N/A'} | Mood: ${last.mood || 'N/A'} | Energy: ${last.energy_level || 'N/A'}/10
Sleep: ${last.sleep_hours || 'N/A'}h | Stress: ${last.stress_level || 'N/A'}/10
Training compliance: ${last.compliance_training || 'N/A'}% | Nutrition: ${last.compliance_nutrition || 'N/A'}%
Client notes: ${last.notes || 'none'}

PREVIOUS WEEK (${prev.date}):
Weight: ${prev.weight || 'N/A'} | Mood: ${prev.mood || 'N/A'} | Energy: ${prev.energy_level || 'N/A'}/10
Training: ${prev.compliance_training || 'N/A'}% | Nutrition: ${prev.compliance_nutrition || 'N/A'}%

OVERALL AVERAGES:
Training compliance: ${avgTraining}% | Nutrition compliance: ${avgNutrition}%
Avg energy: ${avgEnergy}/10 | Avg mood score: ${avgMoodScore}/5
Mood trending down (recent vs early): ${moodTrendDown}

ENGAGEMENT:
Days since last check-in: ${lastCheckInDaysAgo}
Coach-client message response rate: ${responseRate}%
Calculated churn risk score: ${churnProbability}%
Total workout sessions logged: ${workoutSessions.length}

Return ONLY this JSON (no markdown, no extra text):
{
  "summary": "3-4 sentence plain English coaching summary of this week",
  "coaching_priority": "One sentence: Focus this week on X",
  "week_comparison": {
    "vs_last_week": "better|same|worse",
    "differences": ["specific difference 1", "specific difference 2"]
  },
  "trends": [
    {"type": "positive|concerning|neutral", "text": "specific trend description", "metric": "weight|mood|energy|sleep|training|nutrition"}
  ],
  "goal_pace": {
    "status": "ahead|on_track|behind|significantly_behind|no_goal",
    "current_rate": ${weeklyWeightRate || 0},
    "weeks_to_goal": ${weeksToGoal || 0},
    "summary": "One sentence on pace",
    "scenarios": [
      "If adherence improves to 90%: goal in X weeks",
      "If current pace continues: goal in Y weeks",
      "If adherence drops to 60%: goal in Z weeks"
    ]
  },
  "predictions": {
    "confidence": "high|medium|low",
    "churn_probability": ${churnProbability},
    "plateau_risk": "description of plateau risk or null",
    "program_readiness": "progress|maintain|deload|switch",
    "program_readiness_reason": "1 sentence reason"
  },
  "correlations": [
    {"text": "specific data correlation between nutrition/training and results", "strength": "strong|moderate|weak"}
  ],
  "client_insights": [
    "Positive, motivating insight for client view (no negative predictions)",
    "Achievement-focused insight",
    "Encouragement based on data"
  ]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    let analysis;
    try {
      analysis = JSON.parse(response.content[0].text);
    } catch {
      // fallback parse attempt
      const match = response.content[0].text.match(/\{[\s\S]*\}/);
      analysis = match ? JSON.parse(match[0]) : {};
    }

    const record = {
      client_id,
      client_name: client.name,
      generated_at: new Date().toISOString(),
      weeks_of_data: weeksOfData,
      summary: analysis.summary || '',
      coaching_priority: analysis.coaching_priority || '',
      trends: analysis.trends || [],
      goal_pace: analysis.goal_pace || { status: 'no_goal' },
      predictions: analysis.predictions || {},
      correlations: analysis.correlations || [],
      client_insights: analysis.client_insights || [],
      week_comparison: analysis.week_comparison || null,
    };

    const saved = await base44.asServiceRole.entities.ProgressAnalysis.create(record);
    return Response.json({ analysis: saved });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});