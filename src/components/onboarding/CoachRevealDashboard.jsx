import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, AlertTriangle, ChevronRight, BarChart3, Zap } from 'lucide-react';

const stagger = { container: { animate: { transition: { staggerChildren: 0.07 } } }, item: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } } } };

function DarkCard({ children, className = '', glow = false }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`} style={{ background: '#161616', border: glow ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(255,255,255,0.06)' }}>
      {children}
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <p className="text-2xl font-bold" style={{ color: color || '#fff' }}>{value}</p>
      <p className="text-[10px] mt-0.5 uppercase tracking-widest font-semibold" style={{ color: '#7A7A7A' }}>{label}</p>
    </div>
  );
}

const ALERTS = [
  { icon: '⚠️', text: 'Client adherence dropped 15% this week.', color: '#F59E0B', urgency: 'high' },
  { icon: '📉', text: 'Weight stalled for 9 days — adjust calories.', color: '#EF4444', urgency: 'critical' },
  { icon: '💤', text: 'Recovery score decreasing for 2 clients.', color: '#8B5CF6', urgency: 'medium' },
  { icon: '🚨', text: '1 client at cancellation risk.', color: '#EF4444', urgency: 'critical' },
];

export default function CoachRevealDashboard({ data }) {
  return (
    <div className="w-full h-full overflow-y-auto" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-4"
      >
        <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-1" style={{ color: '#3B82F6' }}>
          KOACH AI — Live
        </p>
        <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
          Coach Dashboard
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#7A7A7A' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
      </motion.div>

      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="px-5 space-y-3 pb-28"
      >
        {/* Stats overview */}
        <motion.div variants={stagger.item}>
          <DarkCard glow>
            <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: '#7A7A7A' }}>Overview</p>
            <div className="grid grid-cols-3 gap-2">
              <StatPill label="Clients" value="0" color="#3B82F6" />
              <StatPill label="Adherence" value="—" color="#22C55E" />
              <StatPill label="Check-ins" value="0" color="#F59E0B" />
            </div>
          </DarkCard>
        </motion.div>

        {/* AI Alerts */}
        <motion.div variants={stagger.item}>
          <DarkCard>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-white">AI Alerts</p>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
              >
                {ALERTS.length} active
              </span>
            </div>
            <div className="space-y-2.5">
              {ALERTS.map((alert, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <span className="text-base mt-0.5">{alert.icon}</span>
                  <p className="text-xs leading-relaxed" style={{ color: '#B3B3B3' }}>{alert.text}</p>
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: alert.color }}
                  />
                </motion.div>
              ))}
            </div>
          </DarkCard>
        </motion.div>

        {/* Pending check-ins */}
        <motion.div variants={stagger.item}>
          <DarkCard>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
                <BarChart3 className="w-4 h-4" style={{ color: '#3B82F6' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Check-ins</p>
                <p className="text-xs" style={{ color: '#7A7A7A' }}>0 pending review</p>
              </div>
            </div>
            <div className="text-center py-6" style={{ color: '#3A3A3A' }}>
              <p className="text-sm">No check-ins yet</p>
              <p className="text-xs mt-1">Invite clients to get started</p>
            </div>
          </DarkCard>
        </motion.div>

        {/* Revenue snapshot */}
        <motion.div variants={stagger.item}>
          <DarkCard>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-white">Revenue</p>
              <TrendingUp className="w-4 h-4" style={{ color: '#22C55E' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold text-white">$0</p>
                <p className="text-xs" style={{ color: '#7A7A7A' }}>This month</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-xs" style={{ color: '#7A7A7A' }}>Active clients</p>
              </div>
            </div>
          </DarkCard>
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={stagger.item}>
          <DarkCard>
            <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: '#7A7A7A' }}>Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Users, label: 'Add Client', path: '/clients' },
                { icon: Zap, label: 'Create Program', path: '/programs' },
                { icon: BarChart3, label: 'View Analytics', path: '/analytics' },
                { icon: TrendingUp, label: 'Revenue', path: '/revenue' },
              ].map((a, i) => (
                <Link key={i} to={a.path}>
                  <button
                    className="w-full flex items-center gap-2.5 p-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#B3B3B3' }}
                  >
                    <a.icon className="w-4 h-4 flex-shrink-0" style={{ color: '#3B82F6' }} />
                    {a.label}
                  </button>
                </Link>
              ))}
            </div>
          </DarkCard>
        </motion.div>

        {/* CTA to main app */}
        <motion.div variants={stagger.item}>
          <Link to="/">
            <button
              className="w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', boxShadow: '0 0 20px rgba(59,130,246,0.2)' }}
            >
              Enter Full Dashboard
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}