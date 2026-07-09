import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, BarChart3, Zap, ArrowRight, Link2, CreditCard, Upload, Settings } from 'lucide-react';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } } },
};

function Card({ children, glow = false, className = '' }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`} style={{
      background: 'var(--tc-foreground)',
      border: glow ? '1px solid color-mix(in srgb, var(--tc-primary) 20%, transparent)' : '1px solid color-mix(in srgb, white 6%, transparent)',
      boxShadow: glow ? '0 0 28px color-mix(in srgb, var(--tc-primary) 7%, transparent)' : 'none',
    }}>
      {children}
    </div>
  );
}

const CHECKLIST = [
  { icon: Users,        label: 'Add your first client',        path: '/clients',            done: false },
  { icon: Zap,          label: 'Build a workout program',      path: '/program-builder',     done: false },
  { icon: Link2,        label: 'Generate client intake link',  path: '/onboarding-manager',  done: false },
  { icon: CreditCard,   label: 'Connect payments',             path: '/revenue',             done: false },
  { icon: Upload,       label: 'Upload your brand logo',       path: '/settings',            done: false },
  { icon: Settings,     label: 'Create an automation',         path: '/automations',         done: false },
];

const INSIGHTS = [
  { icon: '🚀', text: 'Your AI check-in system is ready to process client submissions.' },
  { icon: '📊', text: 'Analytics will populate as you add clients and data.' },
  { icon: '⚡', text: 'Set up your first automation to save 5+ hours per week.' },
];

export default function CoachRevealDashboard({ data }) {
  const firstName = data?.business_name?.split(' ')[0] || 'Coach';

  return (
    <div className="w-full h-full overflow-y-auto" style={{ background: 'var(--tc-sidebar)' }}>
      {/* Cinematic header glow */}
      <div className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% -20%, color-mix(in srgb, var(--tc-primary) 12%, transparent) 0%, transparent 70%)' }} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative px-5 pt-14 pb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] font-bold mb-2" style={{ color: 'var(--tc-primary)' }}>
          System Live · KOACH AI
        </p>
        <h1 className="text-2xl font-bold text-white mb-1" style={{ letterSpacing: '-0.025em' }}>
          Welcome, {firstName}. 👋
        </h1>
        <p className="text-sm" style={{ color: 'var(--kc-6b6b6b)' }}>
          Your coaching OS is ready. Let's get you set up.
        </p>
      </motion.div>

      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="relative px-5 space-y-3 pb-32"
      >
        {/* KPI strip */}
        <motion.div variants={stagger.item}>
          <Card glow>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: 'var(--kc-555555)' }}>Dashboard Overview</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Clients', value: '0', color: 'var(--tc-primary)' },
                { label: 'Adherence', value: '—', color: 'var(--tc-success)' },
                { label: 'Revenue', value: '$0', color: 'var(--tc-warning)' },
              ].map(s => (
                <div key={s.label} className="text-center py-3 rounded-xl"
                  style={{ background: 'color-mix(in srgb, white 2%, transparent)', border: '1px solid color-mix(in srgb, white 4%, transparent)' }}>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] mt-0.5 uppercase tracking-widest font-semibold" style={{ color: 'var(--kc-555555)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Setup checklist */}
        <motion.div variants={stagger.item}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-white">Setup Checklist</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--kc-555555)' }}>Complete these to unlock your full system</p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--tc-primary) 10%, transparent)', color: 'var(--tc-primary)' }}>
                0 / {CHECKLIST.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {CHECKLIST.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                  >
                    <Link to={item.path}>
                      <div className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:bg-card/[0.03]"
                        style={{ border: '1px solid color-mix(in srgb, white 4%, transparent)' }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'color-mix(in srgb, var(--tc-primary) 10%, transparent)' }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: 'var(--tc-primary)' }} />
                        </div>
                        <p className="text-sm flex-1" style={{ color: 'var(--kc-c3c3c3)' }}>{item.label}</p>
                        <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--kc-333333)' }} />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* AI Insights */}
        <motion.div variants={stagger.item}>
          <Card>
            <p className="text-sm font-bold text-white mb-3">AI Insights</p>
            <div className="space-y-2">
              {INSIGHTS.map((ins, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-3 px-3 py-3 rounded-xl"
                  style={{ background: 'color-mix(in srgb, white 2%, transparent)', border: '1px solid color-mix(in srgb, white 4%, transparent)' }}>
                  <span className="text-base mt-0.5">{ins.icon}</span>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--kc-9a9a9a)' }}>{ins.text}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={stagger.item}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Users, label: 'Add Client', path: '/clients' },
              { icon: BarChart3, label: 'Analytics', path: '/analytics' },
              { icon: Zap, label: 'Automations', path: '/automations' },
              { icon: TrendingUp, label: 'Revenue', path: '/revenue' },
            ].map((a, i) => {
              const Icon = a.icon;
              return (
                <Link key={i} to={a.path}>
                  <button className="w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl transition-all hover:bg-card/[0.04]"
                    style={{ background: 'var(--tc-foreground)', border: '1px solid color-mix(in srgb, white 6%, transparent)', color: 'var(--kc-b3b3b3)' }}>
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--tc-primary)' }} />
                    <span className="text-sm font-medium">{a.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Enter dashboard CTA */}
        <motion.div variants={stagger.item}>
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 36px color-mix(in srgb, var(--tc-primary) 40%, transparent)' }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2.5"
              style={{ background: 'linear-gradient(135deg, var(--tc-primary), var(--tc-primary))', boxShadow: '0 0 24px color-mix(in srgb, var(--tc-primary) 25%, transparent)' }}
            >
              Enter Full Dashboard
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}