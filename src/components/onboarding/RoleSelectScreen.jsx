import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, User, ChevronLeft } from 'lucide-react';

const roles = [
  {
    id: 'coach',
    icon: Users,
    label: 'Coach',
    description: 'Manage clients, automate coaching, and scale your business with AI-powered tools.',
    tag: 'Professional',
  },
  {
    id: 'client',
    icon: User,
    label: 'Client / Athlete',
    description: 'Training, nutrition, habits, recovery, and performance — all in one system.',
    tag: 'Personal',
  },
];

export default function RoleSelectScreen({ onSelect, onBack }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#0A0A0A' }}>
      <div className="flex-shrink-0 px-4 pt-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#7A7A7A' }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-16 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-10"
        >
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ color: '#3B82F6' }}>Step 1</p>
            <h2 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
              How will you use<br />the app?
            </h2>
          </div>

          <div className="space-y-3">
            {roles.map((role, i) => {
              const Icon = role.icon;
              const isSelected = selected === role.id;
              return (
                <motion.button
                  key={role.id}
                  onClick={() => setSelected(role.id)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.45 }}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className="relative w-full text-left rounded-2xl p-6 transition-all duration-200 overflow-hidden"
                  style={{
                    background: isSelected ? 'rgba(59,130,246,0.08)' : '#161616',
                    border: isSelected ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: isSelected ? '0 0 28px rgba(59,130,246,0.12)' : 'none',
                  }}
                >
                  {isSelected && (
                    <div className="absolute inset-0 opacity-[0.04]"
                      style={{ background: 'radial-gradient(circle at 20% 50%, #3B82F6, transparent 70%)' }} />
                  )}
                  <div className="relative z-10 flex items-center gap-5">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)' }}
                    >
                      <Icon className="w-6 h-6" style={{ color: isSelected ? '#3B82F6' : '#7A7A7A' }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold" style={{ color: isSelected ? '#fff' : '#B3B3B3' }}>
                          {role.label}
                        </span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                          style={{
                            background: isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                            color: isSelected ? '#3B82F6' : '#555',
                          }}
                        >
                          {role.tag}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: '#7A7A7A' }}>
                        {role.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <motion.button
            onClick={() => selected && onSelect(selected)}
            disabled={!selected}
            whileHover={selected ? { scale: 1.02, boxShadow: '0 0 30px rgba(59,130,246,0.35)' } : {}}
            whileTap={selected ? { scale: 0.98 } : {}}
            className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all disabled:opacity-30"
            style={{
              background: selected ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' : '#222',
              boxShadow: selected ? '0 0 20px rgba(59,130,246,0.2)' : 'none',
            }}
          >
            Continue
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}