const APP_URL = import.meta.env.VITE_APP_URL || '';

export const templates = {
  welcome: (client, coach) => ({
    subject: `Welcome to ${coach?.full_name || coach?.name || 'your'} coaching program! 🎉`,
    html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
      <div style="background:#111827;border-radius:12px;padding:32px;text-align:center;margin-bottom:32px;">
        <h1 style="color:white;font-size:24px;margin:0;">Welcome, ${client.name}! 👋</h1>
        <p style="color:rgba(255,255,255,0.6);margin:8px 0 0;">You're officially part of the program</p>
      </div>
      <p style="color:#374151;font-size:16px;line-height:1.6;">Hi ${client.name}, I'm thrilled to have you on board. Here's what happens next:</p>
      <div style="background:#F9FAFB;border-radius:12px;padding:24px;margin:24px 0;">
        <div style="margin-bottom:16px;"><span style="font-weight:600;color:#111827;">📋 Step 1:</span><span style="color:#6B7280;"> Complete your first check-in</span></div>
        <div style="margin-bottom:16px;"><span style="font-weight:600;color:#111827;">🥗 Step 2:</span><span style="color:#6B7280;"> Review your nutrition plan</span></div>
        <div><span style="font-weight:600;color:#111827;">💪 Step 3:</span><span style="color:#6B7280;"> Start your first workout</span></div>
      </div>
      <p style="color:#374151;font-size:16px;">Any questions? Just reply to this email.<br/>Let's get to work! 🚀</p>
      <p style="color:#6B7280;font-size:14px;margin-top:32px;border-top:1px solid #E5E7EB;padding-top:16px;">${coach?.full_name || coach?.name || 'Your Coach'} · Powered by KOACH AI</p>
    </div>`,
  }),

  weeklyCheckin: (client, coach) => ({
    subject: `${client.name}, time for your weekly check-in! 📋`,
    html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
      <h2 style="color:#111827;">Hey ${client.name} 👋</h2>
      <p style="color:#374151;line-height:1.6;">It's time for your weekly check-in! Take 2 minutes to log how your week went — this helps ${coach?.full_name || coach?.name || 'your coach'} personalize your plan and keep you on track.</p>
      <a href="${APP_URL}/portal" style="display:inline-block;background:#111827;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:24px 0;">Submit Check-in →</a>
      <p style="color:#6B7280;font-size:14px;">${coach?.full_name || coach?.name || 'Your Coach'} · KOACH AI</p>
    </div>`,
  }),

  lowCompliance: (client, coach, complianceScore) => ({
    subject: `Let's get back on track, ${client.name} 💪`,
    html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
      <h2 style="color:#111827;">Hey ${client.name},</h2>
      <p style="color:#374151;line-height:1.6;">${coach?.full_name || coach?.name || 'Your coach'} noticed your compliance has dropped to ${complianceScore}% this week. That's okay — everyone has tough weeks. Let's get back on track together.</p>
      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;padding:20px;margin:24px 0;">
        <p style="color:#D97706;font-weight:600;margin:0 0 8px;">Quick wins for this week:</p>
        <ul style="color:#374151;margin:0;padding-left:20px;"><li>Hit your protein target today</li><li>Complete at least 1 workout</li><li>Submit your check-in</li></ul>
      </div>
      <a href="${APP_URL}/portal" style="display:inline-block;background:#111827;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">View My Plan →</a>
      <p style="color:#6B7280;font-size:14px;margin-top:24px;">${coach?.full_name || coach?.name || 'Your Coach'} · KOACH AI</p>
    </div>`,
  }),

  badgeEarned: (client, badge, coach) => ({
    subject: `🏆 You earned the "${badge?.label || badge?.name}" badge!`,
    html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;text-align:center;">
      <div style="background:#111827;border-radius:12px;padding:40px 32px;margin-bottom:32px;">
        <div style="font-size:64px;margin-bottom:16px;">${badge?.emoji || '🏆'}</div>
        <h1 style="color:white;font-size:24px;margin:0 0 8px;">Achievement Unlocked!</h1>
        <p style="color:rgba(255,255,255,0.7);font-size:18px;margin:0;">${badge?.label || badge?.name}</p>
      </div>
      <p style="color:#374151;font-size:16px;line-height:1.6;">Congratulations ${client.name}! You earned the <strong>${badge?.label || badge?.name}</strong> badge${badge?.desc ? ` — ${badge.desc}` : ''}.</p>
      <p style="color:#374151;font-size:16px;">Keep up the amazing work! 🚀</p>
      <p style="color:#6B7280;font-size:14px;margin-top:32px;border-top:1px solid #E5E7EB;padding-top:16px;">${coach?.full_name || coach?.name || 'Your Coach'} · KOACH AI</p>
    </div>`,
  }),

  weeklyProgress: (client, coach, stats = {}) => ({
    subject: `Your weekly progress report 📊`,
    html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
      <h2 style="color:#111827;">Weekly Report — ${client.name}</h2>
      <div style="margin:24px 0;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">
        <div style="padding:16px 20px;display:flex;justify-content:space-between;border-bottom:1px solid #F3F4F6;"><span style="color:#6B7280;">Training Compliance</span><strong style="color:#111827;">${stats.trainingCompliance ?? 0}%</strong></div>
        <div style="padding:16px 20px;display:flex;justify-content:space-between;border-bottom:1px solid #F3F4F6;"><span style="color:#6B7280;">Nutrition Compliance</span><strong style="color:#111827;">${stats.nutritionCompliance ?? 0}%</strong></div>
        <div style="padding:16px 20px;display:flex;justify-content:space-between;${stats.weightChange !== undefined ? 'border-bottom:1px solid #F3F4F6;' : ''}"><span style="color:#6B7280;">Check-in Streak</span><strong style="color:#111827;">${stats.streak ?? 0} days 🔥</strong></div>
        ${stats.weightChange !== undefined ? `<div style="padding:16px 20px;display:flex;justify-content:space-between;"><span style="color:#6B7280;">Weight Change</span><strong style="color:#111827;">${stats.weightChange > 0 ? '+' : ''}${stats.weightChange} lbs</strong></div>` : ''}
      </div>
      <p style="color:#374151;line-height:1.6;">${stats.coachNote || 'Great work this week! Keep the momentum going.'}</p>
      <a href="${APP_URL}/portal" style="display:inline-block;background:#111827;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">View Full Progress →</a>
      <p style="color:#6B7280;font-size:14px;margin-top:32px;border-top:1px solid #E5E7EB;padding-top:16px;">${coach?.full_name || coach?.name || 'Your Coach'} · KOACH AI</p>
    </div>`,
  }),

  missedCheckin: (client, coach, daysMissed) => ({
    subject: `We miss you, ${client.name}! 👋`,
    html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
      <h2 style="color:#111827;">Hey ${client.name},</h2>
      <p style="color:#374151;line-height:1.6;">It's been ${daysMissed} days since your last check-in. ${coach?.full_name || coach?.name || 'Your coach'} wants to make sure you're doing okay and staying on track with your goals.</p>
      <a href="${APP_URL}/portal" style="display:inline-block;background:#111827;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:24px 0;">Submit Check-in →</a>
      <p style="color:#6B7280;font-size:14px;margin-top:24px;">${coach?.full_name || coach?.name || 'Your Coach'} · KOACH AI</p>
    </div>`,
  }),

  sessionReminder: (client, coach, session) => ({
    subject: `Reminder: Session tomorrow at ${session?.time} ⏰`,
    html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
      <h2 style="color:#111827;">Session Reminder 📅</h2>
      <div style="background:#F9FAFB;border-radius:12px;padding:24px;margin:24px 0;">
        <p style="margin:0 0 8px;color:#374151;"><strong>Date:</strong> ${session?.date}</p>
        <p style="margin:0 0 8px;color:#374151;"><strong>Time:</strong> ${session?.time}</p>
        <p style="margin:0 0 8px;color:#374151;"><strong>Coach:</strong> ${coach?.full_name || coach?.name || 'Your Coach'}</p>
        ${session?.zoom_url ? `<p style="margin:0;color:#374151;"><strong>Zoom:</strong> <a href="${session.zoom_url}" style="color:#2563EB;">Join Meeting</a></p>` : ''}
      </div>
      <p style="color:#6B7280;font-size:14px;">${coach?.full_name || coach?.name || 'Your Coach'} · KOACH AI</p>
    </div>`,
  }),
};

export const TEMPLATE_OPTIONS = [
  { key: 'welcome',        label: 'Welcome Email',          emoji: '👋', desc: 'Sent when a new client is added' },
  { key: 'weeklyCheckin',  label: 'Weekly Check-in Nudge',  emoji: '📋', desc: 'Prompt clients to submit their check-in' },
  { key: 'lowCompliance',  label: 'Low Compliance Alert',   emoji: '⚠️', desc: 'Re-engage clients with low compliance' },
  { key: 'badgeEarned',    label: 'Badge Earned',           emoji: '🏆', desc: 'Celebrate client achievements' },
  { key: 'weeklyProgress', label: 'Weekly Progress Report', emoji: '📊', desc: 'Weekly stats summary for the client' },
  { key: 'missedCheckin',  label: 'Missed Check-in',        emoji: '👋', desc: 'Follow up on missing check-ins' },
  { key: 'sessionReminder',label: 'Session Reminder',       emoji: '⏰', desc: 'Remind clients of upcoming sessions' },
];