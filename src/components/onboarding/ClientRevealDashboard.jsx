import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Flame, Droplets, Zap, Footprints, ChevronRight, TrendingUp } from 'lucide-react';

const stagger = { container: { animate: { transition: { staggerChildren: 0.07 } } }, item: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } } } };

function MetricRing({ label, value, max, unit, color, icon: Icon }) {
  const pct = Math.min((value / max) * 100, 100);
  const r = 20; const circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
          <motion.circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3.5"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
            transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-white tabular-nums">{value}{unit}</p>
        <p className="text-[10px]" style={{ color: '#7A7A7A' }}>{label}</p>
      </div>
    </div>
  );
}

function DarkCard({ children, className = '', glow = false }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`}
      style={{
        background: '#161616',
        border: glow ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: glow ? '0 0 20px rgba(59,130,246,0.06)' : 'none',
      }}>
      {children}
    </div>
  );
}

export default function ClientRevealDashboard({ data }) {
  const [tab, setTab] = useState('today');
  const tabs = ['today', 'workout', 'nutrition', 'habits'];
  const goals = data.goals || ['fat_loss'];
  const primaryGoal = goals[0];

  return (
    <div className="w-full h-full overflow-y-auto" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-5 pt-12 pb-4 flex items-center justify-between"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-1" style={{ color: '#3B82F6' }}>
            KOACH AI — Live
          </p>
          <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
            Today
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A7A7A' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
        >
          A
        </div>
      </motion.div>

      {/* Streak banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        className="mx-5 mb-4 p-3.5 rounded-2xl flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(29,78,216,0.08))', border: '1px solid rgba(59,130,246,0.2)' }}
      >
        <span className="text-xl">🔥</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Day 1 Streak — Let's go.</p>
          <p className="text-xs" style={{ color: '#7A7A7A' }}>Consistency is the foundation of elite performance.</p>
        </div>
      </motion.div>

      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="px-5 space-y-3 pb-28"
      >
        {/* Goal rings */}
        <motion.div variants={stagger.item}>
          <DarkCard glow>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">Daily Rings</p>
              <span className="text-xs" style={{ color: '#7A7A7A' }}>0% complete</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <MetricRing label="Calories" value={0} max={2400} unit="" color="#3B82F6" icon={Flame} />
              <MetricRing label="Protein" value={0} max={180} unit="g" color="#22C55E" icon={TrendingUp} />
              <MetricRing label="Hydration" value={0} max={8} unit="L" color="#06B6D4" icon={Droplets} />
              <MetricRing label="Steps" value={0} max={10000} unit="k" color="#F59E0B" icon={Footprints} />
            </div>
          </DarkCard>
        </motion.div>

        {/* Today's workout */}
        <motion.div variants={stagger.item}>
          <DarkCard>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: '#7A7A7A' }}>Today's Workout</p>
                <p className="text-base font-bold text-white">Upper Body — Push A</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
                <Zap className="w-4 h-4" style={{ color: '#3B82F6' }} />
              </div>
            </div>
            <div className="space-y-2 mb-3">
              {['Bench Press', 'Shoulder Press', 'Incline DB Press'].map((ex, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-sm" style={{ color: '#B3B3B3' }}>{ex}</span>
                  <span className="text-xs font-medium" style={{ color: '#7A7A7A' }}>4×8–10</span>
                </div>
              ))}
            </div>
            <button
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
            >
              Start Workout →
            </button>
          </DarkCard>
        </motion.div>

        {/* Macros */}
        <motion.div variants={stagger.item}>
          <DarkCard>
            <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: '#7A7A7A' }}>Nutrition Today</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'Calories', value: '2,400', target: '2,400', color: '#3B82F6' },
                { label: 'Protein', value: '180g', target: '180g', color: '#22C55E' },
                { label: 'Carbs', value: '240g', target: '240g', color: '#F59E0B' },
                { label: 'Fat', value: '75g', target: '75g', color: '#EC4899' },
              ].map(m => (
                <div key={m.label}>
                  <p className="text-xs font-bold" style={{ color: m.color }}>{m.value}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#3A3A3A' }}>target</p>
                  <p className="text-[10px]" style={{ color: '#7A7A7A' }}>{m.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full w-0 rounded-full" style={{ background: 'linear-gradient(90deg, #3B82F6, #22C55E)' }} />
            </div>
          </DarkCard>
        </motion.div>

        {/* Habits */}
        <motion.div variants={stagger.item}>
          <DarkCard>
            <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: '#7A7A7A' }}>Daily Habits</p>
            <div className="space-y-2.5">
              {['Morning workout done', 'Hit protein target', '8 glasses of water', '7+ hours sleep'].map((h, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                  <span className="text-sm" style={{ color: '#7A7A7A' }}>{h}</span>
                </div>
              ))}
            </div>
          </DarkCard>
        </motion.div>

        {/* AI Insight */}
        <motion.div variants={stagger.item}>
          <div
            className="p-4 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(29,78,216,0.04))',
              border: '1px solid rgba(59,130,246,0.15)',
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">✨</span>
              <div>
                <p className="text-sm font-semibold text-white mb-1">AI Insight</p>
                <p className="text-xs leading-relaxed" style={{ color: '#B3B3B3' }}>
                  Based on your goal of <span className="text-white font-medium capitalize">{primaryGoal?.replace('_', ' ')}</span>, your daily protein target is 180g. Prioritize protein in your first meal to hit your targets more consistently.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA to main app */}
        <motion.div variants={stagger.item}>
          <Link to="/">
            <button
              className="w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              Go to Full Dashboard
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}