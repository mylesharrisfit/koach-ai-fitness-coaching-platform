export const BADGE_CONFIG = {
  // Streaks
  streak_7:         { label: '7-Day Streak',     emoji: '🔥', tier: 'bronze',   desc: '7 consecutive check-ins' },
  streak_14:        { label: '14-Day Streak',     emoji: '⚡', tier: 'silver',   desc: '14 consecutive check-ins' },
  streak_30:        { label: '30-Day Streak',     emoji: '💎', tier: 'gold',     desc: '30-day champion' },
  streak_60:        { label: '60-Day Streak',     emoji: '👑', tier: 'platinum', desc: '60 days unstoppable' },
  streak_90:        { label: '90-Day Legend',     emoji: '🌟', tier: 'elite',    desc: '90 days of consistency' },

  // Performance
  pr_hit:           { label: 'PR Smashed',        emoji: '🏆', tier: 'gold',     desc: 'Personal record achieved' },
  first_checkin:    { label: 'First Step',        emoji: '👟', tier: 'bronze',   desc: 'Completed first check-in' },
  perfect_week:     { label: 'Perfect Week',      emoji: '⭐', tier: 'silver',   desc: '4 check-ins all 80%+' },
  perfect_month:    { label: 'Perfect Month',     emoji: '🎖️', tier: 'gold',     desc: 'Full month above 80%' },

  // Nutrition
  nutrition_king:   { label: 'Nutrition King',    emoji: '🥗', tier: 'silver',   desc: '14 days hitting macros' },
  macro_master:     { label: 'Macro Master',      emoji: '⚖️', tier: 'gold',     desc: '30 days hitting macros' },
  hydration_hero:   { label: 'Hydration Hero',    emoji: '💧', tier: 'bronze',   desc: 'Logged water 7 days straight' },

  // Transformation
  goal_reached:     { label: 'Goal Reached',      emoji: '🎯', tier: 'gold',     desc: 'Target achieved' },
  halfway_there:    { label: 'Halfway There',     emoji: '🏁', tier: 'silver',   desc: '50% of goal reached' },
  transformation:   { label: 'Transformation',   emoji: '🦋', tier: 'elite',    desc: 'Complete body transformation' },
  weight_loss_5:    { label: 'Lost 5 lbs',        emoji: '📉', tier: 'bronze',   desc: '5 lbs down' },
  weight_loss_10:   { label: 'Lost 10 lbs',       emoji: '🔽', tier: 'silver',   desc: '10 lbs down' },
  weight_loss_20:   { label: 'Lost 20 lbs',       emoji: '⬇️', tier: 'gold',     desc: '20 lbs down' },

  // Mental/Consistency
  comeback:         { label: 'Comeback Kid',      emoji: '💪', tier: 'silver',   desc: 'Bounced back strong' },
  consistent_month: { label: 'Iron Consistent',   emoji: '📅', tier: 'gold',     desc: '30 days of consistency' },
  mindset_warrior:  { label: 'Mindset Warrior',   emoji: '🧠', tier: 'silver',   desc: 'Logged mood 14 days' },
  early_bird:       { label: 'Early Bird',        emoji: '🌅', tier: 'bronze',   desc: 'Consistent morning training' },
  night_owl:        { label: 'Night Owl',         emoji: '🦉', tier: 'bronze',   desc: 'Consistent evening training' },
};

export const TIER_STYLES = {
  bronze:   { bg: 'bg-[#FDF4EE]', border: 'border-[#D97706]', text: 'text-[#D97706]', label: 'Bronze' },
  silver:   { bg: 'bg-[#F3F4F6]', border: 'border-[#6B7280]', text: 'text-[#6B7280]', label: 'Silver' },
  gold:     { bg: 'bg-[#FFFBEB]', border: 'border-[#D97706]', text: 'text-[#D97706]', label: 'Gold' },
  platinum: { bg: 'bg-[#EFF6FF]', border: 'border-[#2563EB]', text: 'text-[#2563EB]', label: 'Platinum' },
  elite:    { bg: 'bg-[#111827]', border: 'border-[#111827]', text: 'text-white',      label: 'Elite' },
};