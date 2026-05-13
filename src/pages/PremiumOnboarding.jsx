import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SplashScreen from '@/components/onboarding/SplashScreen';
import WelcomeScreen from '@/components/onboarding/WelcomeScreen';
import RoleSelectScreen from '@/components/onboarding/RoleSelectScreen';
import ClientGoalScreen from '@/components/onboarding/ClientGoalScreen';
import ClientExperienceScreen from '@/components/onboarding/ClientExperienceScreen';
import ClientTrainingStyleScreen from '@/components/onboarding/ClientTrainingStyleScreen';
import ClientScheduleScreen from '@/components/onboarding/ClientScheduleScreen';
import ClientMetricsScreen from '@/components/onboarding/ClientMetricsScreen';
import ClientInjuriesScreen from '@/components/onboarding/ClientInjuriesScreen';
import ClientHealthScreen from '@/components/onboarding/ClientHealthScreen';
import ClientAllergiesScreen from '@/components/onboarding/ClientAllergiesScreen';
import ClientNutritionHabitsScreen from '@/components/onboarding/ClientNutritionHabitsScreen';
import ClientLifestyleScreen from '@/components/onboarding/ClientLifestyleScreen';
import ClientWhyScreen from '@/components/onboarding/ClientWhyScreen';
import ClientObstaclesScreen from '@/components/onboarding/ClientObstaclesScreen';
import ClientAccountabilityScreen from '@/components/onboarding/ClientAccountabilityScreen';
import AIGenerationScreen from '@/components/onboarding/AIGenerationScreen';
import CoachClientsScreen from '@/components/onboarding/CoachClientsScreen';
import CoachTypeScreen from '@/components/onboarding/CoachTypeScreen';
import CoachBottleneckScreen from '@/components/onboarding/CoachBottleneckScreen';
import CoachSoftwareScreen from '@/components/onboarding/CoachSoftwareScreen';
import CoachGenerationScreen from '@/components/onboarding/CoachGenerationScreen';
import OnboardingDashboard from '@/components/onboarding/OnboardingDashboard';

const CLIENT_FLOW = [
  'splash', 'welcome', 'role',
  'client_goal',
  'client_experience',
  'client_training',
  'client_schedule',
  'client_metrics',
  'client_injuries',
  'client_health',
  'client_allergies',
  'client_nutrition_habits',
  'client_lifestyle',
  'client_why',
  'client_obstacles',
  'client_accountability',
  'ai_generation',
  'dashboard',
];

const COACH_FLOW = [
  'splash', 'welcome', 'role',
  'coach_clients', 'coach_type', 'coach_bottleneck', 'coach_software',
  'coach_generation', 'dashboard',
];

export default function PremiumOnboarding() {
  const [step, setStep] = useState('splash');
  const [role, setRole] = useState(null);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState({});

  const getFlow = () => role === 'coach' ? COACH_FLOW : CLIENT_FLOW;

  const next = (newData = {}) => {
    const flow = getFlow();
    const idx = flow.indexOf(step);
    if (idx < flow.length - 1) {
      setDirection(1);
      setData(d => ({ ...d, ...newData }));
      setStep(flow[idx + 1]);
    }
  };

  const back = () => {
    const flow = getFlow();
    const idx = flow.indexOf(step);
    if (idx > 0) {
      setDirection(-1);
      setStep(flow[idx - 1]);
    }
  };

  const handleRoleSelect = (selectedRole, newData = {}) => {
    setRole(selectedRole);
    setData(d => ({ ...d, ...newData, role: selectedRole }));
    setDirection(1);
    setStep(selectedRole === 'coach' ? 'coach_clients' : 'client_goal');
  };

  const flow = getFlow();
  const currentIdx = flow.indexOf(step);
  // Progress excludes splash/welcome/role/dashboard (first 3 + last 1)
  const progressSteps = flow.length - 4;
  const progressIdx = currentIdx - 3;
  const progress = !['splash', 'welcome', 'role', 'dashboard'].includes(step)
    ? Math.max(0, Math.min(1, progressIdx / progressSteps))
    : 0;

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };
  const transition = { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.4 };

  const props = { onNext: next, onBack: back, data, setData };

  const renderStep = () => {
    switch (step) {
      case 'splash': return <SplashScreen onDone={() => { setDirection(1); setStep('welcome'); }} />;
      case 'welcome': return <WelcomeScreen {...props} />;
      case 'role': return <RoleSelectScreen onSelect={handleRoleSelect} onBack={back} data={data} />;
      case 'client_goal': return <ClientGoalScreen {...props} />;
      case 'client_experience': return <ClientExperienceScreen {...props} />;
      case 'client_training': return <ClientTrainingStyleScreen {...props} />;
      case 'client_schedule': return <ClientScheduleScreen {...props} />;
      case 'client_metrics': return <ClientMetricsScreen {...props} />;
      case 'client_injuries': return <ClientInjuriesScreen {...props} />;
      case 'client_health': return <ClientHealthScreen {...props} />;
      case 'client_allergies': return <ClientAllergiesScreen {...props} />;
      case 'client_nutrition_habits': return <ClientNutritionHabitsScreen {...props} />;
      case 'client_lifestyle': return <ClientLifestyleScreen {...props} />;
      case 'client_why': return <ClientWhyScreen {...props} />;
      case 'client_obstacles': return <ClientObstaclesScreen {...props} />;
      case 'client_accountability': return <ClientAccountabilityScreen {...props} />;
      case 'ai_generation': return <AIGenerationScreen {...props} role="client" />;
      case 'coach_clients': return <CoachClientsScreen {...props} />;
      case 'coach_type': return <CoachTypeScreen {...props} />;
      case 'coach_bottleneck': return <CoachBottleneckScreen {...props} />;
      case 'coach_software': return <CoachSoftwareScreen {...props} />;
      case 'coach_generation': return <CoachGenerationScreen {...props} />;
      case 'dashboard': return <OnboardingDashboard data={data} role={role} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#0A0A0A' }}>
      {/* Progress bar */}
      {!['splash', 'welcome', 'role', 'dashboard'].includes(step) && (
        <div className="absolute top-0 left-0 right-0 z-50 h-[2px]" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full"
            style={{ background: 'linear-gradient(90deg, #3B82F6, #60A5FA)' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={step === 'splash' ? {} : variants}
          initial={step === 'splash' ? { opacity: 0 } : 'enter'}
          animate={step === 'splash' ? { opacity: 1 } : 'center'}
          exit={step === 'splash' ? { opacity: 0 } : 'exit'}
          transition={transition}
          className="absolute inset-0"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}