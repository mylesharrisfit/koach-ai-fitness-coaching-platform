import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SplashScreen from '@/components/onboarding/SplashScreen';
import WelcomeScreen from '@/components/onboarding/WelcomeScreen';
import CoachClientsScreen from '@/components/onboarding/CoachClientsScreen';
import CoachTypeScreen from '@/components/onboarding/CoachTypeScreen';
import CoachBottleneckScreen from '@/components/onboarding/CoachBottleneckScreen';
import CoachSoftwareScreen from '@/components/onboarding/CoachSoftwareScreen';
import CoachGenerationScreen from '@/components/onboarding/CoachGenerationScreen';
import OnboardingDashboard from '@/components/onboarding/OnboardingDashboard';

// Coach-only flow — no role selection, no client paths
const FLOW = [
  'splash',
  'welcome',
  'coach_clients',
  'coach_type',
  'coach_bottleneck',
  'coach_software',
  'coach_generation',
  'dashboard',
];

const NON_PROGRESS_STEPS = ['splash', 'welcome', 'dashboard'];

export default function PremiumOnboarding() {
  const [step, setStep] = useState('splash');
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState({});

  const currentIdx = FLOW.indexOf(step);

  const next = (newData = {}) => {
    if (currentIdx < FLOW.length - 1) {
      setDirection(1);
      setData(d => ({ ...d, ...newData }));
      setStep(FLOW[currentIdx + 1]);
    }
  };

  const back = () => {
    if (currentIdx > 0) {
      setDirection(-1);
      setStep(FLOW[currentIdx - 1]);
    }
  };

  // Progress bar for the actual question steps
  const progressSteps = FLOW.length - NON_PROGRESS_STEPS.length;
  const progressIdx = currentIdx - (NON_PROGRESS_STEPS.length - 1); // offset past splash+welcome
  const showProgress = !NON_PROGRESS_STEPS.includes(step);
  const progress = showProgress ? Math.max(0, Math.min(1, progressIdx / progressSteps)) : 0;

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };
  const transition = { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.4 };

  const props = { onNext: next, onBack: back, data, setData };

  const renderStep = () => {
    switch (step) {
      case 'splash':          return <SplashScreen onDone={() => { setDirection(1); setStep('welcome'); }} />;
      case 'welcome':         return <WelcomeScreen {...props} />;
      case 'coach_clients':   return <CoachClientsScreen {...props} />;
      case 'coach_type':      return <CoachTypeScreen {...props} />;
      case 'coach_bottleneck':return <CoachBottleneckScreen {...props} />;
      case 'coach_software':  return <CoachSoftwareScreen {...props} />;
      case 'coach_generation':return <CoachGenerationScreen {...props} />;
      case 'dashboard':       return <OnboardingDashboard data={data} role="coach" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#0A0A0A' }}>
      {/* Progress bar */}
      {showProgress && (
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