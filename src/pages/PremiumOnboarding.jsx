import React, { useState } from 'react';
// PremiumOnboarding — coach-only onboarding flow that ends with navigate('/') into the real platform
import { motion, AnimatePresence } from 'framer-motion';
import SplashScreen from '@/components/onboarding/SplashScreen';
import WelcomeScreen from '@/components/onboarding/WelcomeScreen';
import CoachProfileScreen from '@/components/onboarding/CoachProfileScreen';
import CoachClientsScreen from '@/components/onboarding/CoachClientsScreen';
import CoachTypeScreen from '@/components/onboarding/CoachTypeScreen';
import CoachBottleneckScreen from '@/components/onboarding/CoachBottleneckScreen';
import CoachSoftwareScreen from '@/components/onboarding/CoachSoftwareScreen';
import CoachPricingScreen from '@/components/onboarding/CoachPricingScreen';
import CoachGenerationScreen from '@/components/onboarding/CoachGenerationScreen';
import { useNavigate } from 'react-router-dom';

// Ordered coach-only flow
const FLOW = [
  'splash',
  'welcome',
  'coach_profile',
  'coach_clients',
  'coach_type',
  'coach_bottleneck',
  'coach_software',
  'coach_pricing',
  'coach_generation',
];

const NO_PROGRESS = new Set(['splash', 'welcome', 'coach_pricing', 'coach_generation']);

export default function PremiumOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState('splash');
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState({});

  const idx = FLOW.indexOf(step);

  const next = (newData = {}) => {
    const merged = { ...data, ...newData };
    setData(merged);
    if (idx < FLOW.length - 1) {
      setDirection(1);
      setStep(FLOW[idx + 1]);
    } else {
      // Onboarding complete — mark in localStorage and go straight to the real platform
      localStorage.setItem('koach_onboarding_complete', '1');
      localStorage.setItem('koach_onboarding_data', JSON.stringify(merged));
      navigate('/', { replace: true });
    }
  };

  const back = () => {
    if (idx > 0) {
      setDirection(-1);
      setStep(FLOW[idx - 1]);
    }
  };

  // Progress bar only for question steps
  const questionSteps = FLOW.filter(s => !NO_PROGRESS.has(s));
  const progressIdx = questionSteps.indexOf(step);
  const showProgress = progressIdx >= 0;
  const progress = showProgress ? (progressIdx + 1) / questionSteps.length : 0;

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };
  const transition = { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.38 };

  const props = { onNext: next, onBack: back, data, setData };

  const renderStep = () => {
    switch (step) {
      case 'splash':           return <SplashScreen onDone={() => { setDirection(1); setStep('welcome'); }} />;
      case 'welcome':          return <WelcomeScreen {...props} />;
      case 'coach_profile':    return <CoachProfileScreen {...props} />;
      case 'coach_clients':    return <CoachClientsScreen {...props} />;
      case 'coach_type':       return <CoachTypeScreen {...props} />;
      case 'coach_bottleneck': return <CoachBottleneckScreen {...props} />;
      case 'coach_software':   return <CoachSoftwareScreen {...props} />;
      case 'coach_pricing':    return <CoachPricingScreen {...props} />;
      case 'coach_generation': return <CoachGenerationScreen onNext={next} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#0A0A0A' }}>
      {/* Progress bar */}
      {showProgress && (
        <div className="absolute top-0 left-0 right-0 z-50 h-[2px]" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #3B82F6, #60A5FA)' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
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