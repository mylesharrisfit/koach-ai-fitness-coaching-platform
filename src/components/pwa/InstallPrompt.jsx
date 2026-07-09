import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Zap, WifiOff, Smartphone } from 'lucide-react';

const STORAGE_KEY = 'pwa_install_dismissed';
const VISIT_KEY = 'pwa_visit_count';

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

function IOSInstructions({ onClose }) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-card rounded-t-3xl shadow-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-border" />
      </div>

      <div className="px-6 pt-3 pb-6">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))' }}>
            💪
          </div>
          <div>
            <p className="font-black text-foreground text-lg">Add to Home Screen</p>
            <p className="text-muted-foreground text-sm">Install KOACH AI for the best experience</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {[
            { icon: '1️⃣', text: 'Tap the Share button below in Safari' },
            { icon: '2️⃣', text: 'Scroll down and tap "Add to Home Screen"' },
            { icon: '3️⃣', text: 'Tap "Add" to install' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-muted">
              <span className="text-xl">{step.icon}</span>
              <p className="text-foreground text-sm font-semibold">{step.text}</p>
            </div>
          ))}
        </div>

        {/* Safari share icon hint */}
        <div className="flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-primary bg-accent">
          <span className="text-2xl">⬆️</span>
          <p className="text-primary text-sm font-bold">Look for the Share button in Safari's toolbar</p>
        </div>
      </div>
    </motion.div>
  );
}

function AndroidPrompt({ onInstall, onClose }) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-card rounded-t-3xl shadow-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
    >
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-border" />
      </div>

      <div className="px-6 pt-3 pb-6">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))' }}>
            💪
          </div>
          <div>
            <p className="font-black text-foreground text-lg">Install KOACH AI</p>
            <p className="text-muted-foreground text-sm">Add to your home screen</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: <WifiOff className="w-5 h-5" />, label: 'Works offline', color: 'rgb(var(--primary))' },
            { icon: <Zap className="w-5 h-5" />, label: 'Faster', color: 'rgb(var(--ai))' },
            { icon: <Smartphone className="w-5 h-5" />, label: 'Full screen', color: 'rgb(var(--success))' },
          ].map((feat, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: feat.color + '15', color: feat.color }}>
                {feat.icon}
              </div>
              <p className="text-xs font-bold text-muted-foreground">{feat.label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onInstall}
          className="w-full py-4 rounded-2xl font-black text-white text-base mb-3"
          style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}
        >
          <Download className="w-5 h-5 inline mr-2" />
          Install App
        </button>
        <button onClick={onClose} className="w-full py-3 text-muted-foreground text-sm font-semibold">
          Not Now
        </button>
      </div>
    </motion.div>
  );
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Don't show if already installed
    if (isInStandaloneMode()) return;

    // Don't show if dismissed twice
    const dismissed = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
    if (dismissed >= 2) return;

    // Only show after 3rd visit
    const visits = parseInt(localStorage.getItem(VISIT_KEY) || '0') + 1;
    localStorage.setItem(VISIT_KEY, String(visits));
    if (visits < 3) return;

    setIsIOSDevice(isIOS());

    // Android: listen for beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS: show after delay
    if (isIOS()) {
      setTimeout(() => setShow(true), 4000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
        localStorage.setItem(STORAGE_KEY, '2'); // don't show again
      }
      setDeferredPrompt(null);
    }
    setShow(false);
  };

  const handleClose = () => {
    setShow(false);
    const dismissed = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
    localStorage.setItem(STORAGE_KEY, String(dismissed + 1));
  };

  return (
    <>
      <AnimatePresence>
        {show && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/40"
              onClick={handleClose}
            />
            {isIOSDevice
              ? <IOSInstructions onClose={handleClose} />
              : <AndroidPrompt onInstall={handleInstall} onClose={handleClose} />
            }
          </>
        )}
      </AnimatePresence>
    </>
  );
}