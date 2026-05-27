import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { differenceInDays } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const [clients, checkIns, messages, settings] = await Promise.all([
      base44.asServiceRole.entities.Client.list('-created_date'),
      base44.asServiceRole.entities.CheckIn.list('-date', 200),
      base44.asServiceRole.entities.Message.list('-created_date', 200),
      base44.asServiceRole.entities.CoachSettings.list(),
    ]);

    const coachSettings = settings[0];
    const now = new Date();

    // Build per-client check-in map
    const ciMap = {};
    checkIns.forEach(ci => {
      if (!ciMap[ci.client_id]) ciMap[ci.client_id] = [];
      ciMap[ci.client_id].push(ci);
    });

    // Top 3 priority clients
    const withScores = clients.map(c => {
      const cis = ciMap[c.id] || [];
      let score = 0;
      const lastCI = cis[0];
      const daysSinceCI = lastCI ? differenceInDays(now, new Date(lastCI.date)) : 99;
      if (daysSinceCI >= 14) score += 3;
      else if (daysSinceCI >= 7) score += 1.5;
      if (c.lifecycle_status === 'at_risk') score += 2;
      if (cis.length >= 3) {
        const scores = cis.slice(0, 3).map(ci => ((ci.compliance_training || 0) + (ci.compliance_nutrition || 0)) / 2);
        if (scores[0] < scores[1] && scores[1] < scores[2]) score += 2;
      }
      return { ...c, priorityScore: score };
    }).sort((a, b) => b.priorityScore - a.priorityScore);

    const topPriority = withScores.slice(0, 3);

    // Biggest wins last week
    const lastWeekCI = checkIns.filter(ci => differenceInDays(now, new Date(ci.date)) <= 7);
    const wins = lastWeekCI
      .filter(ci => ci.compliance_training >= 90 || ci.mood === 'great')
      .map(ci => {
        const client = clients.find(c => c.id === ci.client_id);
        return client ? `${client.name}: ${ci.compliance_training || 0}% training compliance${ci.mood === 'great' ? ', great mood' : ''}` : null;
      })
      .filter(Boolean)
      .slice(0, 5);

    // Churn risks
    const churnRisks = clients.filter(c => {
      if (c.lifecycle_status !== 'active' && c.status !== 'active') return false;
      const lastCI = ciMap[c.id]?.[0];
      return !lastCI || differenceInDays(now, new Date(lastCI.date)) >= 14;
    });

    // Leads ready to convert
    const staleLeads = clients.filter(c => {
      if (c.lifecycle_status !== 'lead') return false;
      return differenceInDays(now, new Date(c.created_date || now)) >= 10;
    });

    // Revenue snapshot
    const activeCount = clients.filter(c => c.lifecycle_status === 'active' || c.status === 'active').length;
    const mrr = clients.reduce((sum, c) => sum + (c.monthly_rate || 0), 0);

    const digestData = {
      week_of: now.toISOString().split('T')[0],
      top_priority: topPriority.map(c => ({ name: c.name, score: c.priorityScore.toFixed(1) })),
      wins,
      churn_risks: churnRisks.map(c => c.name),
      leads_to_convert: staleLeads.map(c => c.name),
      active_clients: activeCount,
      mrr,
    };

    // Build email HTML
    const coachTips = [
      'Send a voice message instead of text this week — clients love the personal touch.',
      'Review your least-engaged client and schedule a surprise check-in call.',
      'Consider updating a client\'s program — stale programs reduce adherence by up to 30%.',
      'Ask one client to share a progress photo — it boosts their accountability significantly.',
      'A personalized win acknowledgment takes 30 seconds and dramatically improves retention.',
    ];
    const tip = coachTips[now.getDay() % coachTips.length];

    const emailHtml = `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:32px;border-radius:16px;border:1px solid #e5e7eb;">
        <div style="background:#111827;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
          <h1 style="color:#fff;font-size:20px;margin:0 0 4px;">🧠 Your Weekly AI Coaching Digest</h1>
          <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">Week of ${digestData.week_of}</p>
        </div>

        <h2 style="color:#111827;font-size:15px;margin:0 0 12px;">🎯 Top 3 Clients to Prioritize</h2>
        ${topPriority.map((c, i) => `
          <div style="padding:12px;background:#f9fafb;border-radius:10px;margin-bottom:8px;border:1px solid #e5e7eb;">
            <span style="font-weight:700;color:#111827;">${i + 1}. ${c.name}</span>
            <span style="color:#6b7280;font-size:12px;margin-left:8px;">Priority score: ${c.priorityScore.toFixed(1)}/10</span>
          </div>`).join('')}

        ${wins.length > 0 ? `
          <h2 style="color:#111827;font-size:15px;margin:24px 0 12px;">🏆 Biggest Wins Last Week</h2>
          ${wins.map(w => `<div style="padding:10px 12px;background:#f0fdf4;border-radius:8px;margin-bottom:6px;color:#166534;font-size:13px;">✓ ${w}</div>`).join('')}
        ` : ''}

        ${churnRisks.length > 0 ? `
          <h2 style="color:#111827;font-size:15px;margin:24px 0 12px;">⚠️ Churn Risk Clients</h2>
          ${churnRisks.map(name => `<div style="padding:10px 12px;background:#fff7ed;border-radius:8px;margin-bottom:6px;color:#9a3412;font-size:13px;">🔴 ${name} — hasn't checked in in 14+ days</div>`).join('')}
        ` : ''}

        ${staleLeads.length > 0 ? `
          <h2 style="color:#111827;font-size:15px;margin:24px 0 12px;">💡 Leads Ready to Convert</h2>
          ${staleLeads.map(name => `<div style="padding:10px 12px;background:#f0f9ff;border-radius:8px;margin-bottom:6px;color:#0c4a6e;font-size:13px;">→ ${name}</div>`).join('')}
        ` : ''}

        <div style="margin:24px 0;padding:16px;background:#faf5ff;border-radius:10px;border:1px solid #e9d5ff;">
          <p style="margin:0 0 4px;font-weight:700;color:#6d28d9;font-size:13px;">💬 Coaching Tip of the Week</p>
          <p style="margin:0;color:#4c1d95;font-size:13px;">${tip}</p>
        </div>

        <div style="text-align:center;padding:16px;background:#f9fafb;border-radius:10px;">
          <p style="margin:0 0 8px;color:#6b7280;font-size:12px;">${activeCount} active clients · $${mrr.toLocaleString()}/mo MRR</p>
          <a href="${Deno.env.get('APP_URL') || 'https://app.koach.ai'}/ai-insights"
            style="display:inline-block;background:#111827;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;">
            View Full Digest →
          </a>
        </div>
      </div>
    `;

    // Send email
    if (user?.email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        from_name: 'KOACH AI',
        subject: `🧠 Your Weekly AI Coaching Digest — ${digestData.week_of}`,
        body: emailHtml,
      });
    }

    return Response.json({ success: true, digest: digestData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});