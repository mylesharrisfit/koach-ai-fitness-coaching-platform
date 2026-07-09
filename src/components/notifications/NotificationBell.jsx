import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationCenter from './NotificationCenter';

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const { notifications, unreadCount, loading, markRead, markAllRead, dismiss } = useNotifications();
  const isMobile = useIsMobile();
  const prevCountRef = useRef(unreadCount);
  const wrapperRef = useRef(null);
  const bellRef = useRef(null);

  // Pulse when new notification arrives
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setPulse(true);
      setTimeout(() => setPulse(false), 2000);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  // Keyboard shortcut: N
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Calculate panel position from bell's bounding rect
  const calcPos = useCallback(() => {
    if (!bellRef.current) return;
    const rect = bellRef.current.getBoundingClientRect();
    const panelWidth = 420;
    // Position panel below the bell, ensure it stays within viewport
    let left = rect.left;
    if (left + panelWidth > window.innerWidth - 8) {
      left = window.innerWidth - panelWidth - 8;
    }
    setPanelPos({
      top: rect.bottom + 8,
      left: Math.max(8, left),
    });
  }, []);

  // Close on outside click (desktop)
  useEffect(() => {
    if (!open || isMobile) return;
    calcPos();
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, isMobile, calcPos]);

  const displayCount = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Bell Button */}
      <button
        ref={bellRef}
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/10 transition-colors"
        title="Notifications (N)"
      >
        {/* Pulse ring */}
        {pulse && (
          <motion.span
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute inset-0 rounded-xl bg-primary"
          />
        )}
        <motion.div
          animate={pulse ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          <Bell className="w-4 h-4 text-white/70" />
        </motion.div>

        {/* Badge */}
        {displayCount && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[17px] h-[17px] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none"
            style={{ background: 'linear-gradient(135deg, rgb(var(--destructive)), rgb(var(--destructive)))', boxShadow: '0 0 0 2px #0D0D0D' }}
          >
            {displayCount}
          </motion.span>
        )}
      </button>

      {/* Mobile: full page overlay */}
      {isMobile && (
        <AnimatePresence>
          {open && (
            <NotificationCenter
              notifications={notifications}
              unreadCount={unreadCount}
              loading={loading}
              markRead={markRead}
              markAllRead={markAllRead}
              dismiss={dismiss}
              onClose={() => setOpen(false)}
              isMobile={true}
            />
          )}
        </AnimatePresence>
      )}

      {/* Desktop: dropdown panel rendered in a portal so it escapes sidebar overflow/stacking */}
      {!isMobile && createPortal(
        <>
          {open && <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />}
          <AnimatePresence>
            {open && (
              <div
                className="fixed z-[9999]"
                style={{ top: panelPos.top, left: panelPos.left }}
              >
                <NotificationCenter
                  notifications={notifications}
                  unreadCount={unreadCount}
                  loading={loading}
                  markRead={markRead}
                  markAllRead={markAllRead}
                  dismiss={dismiss}
                  onClose={() => setOpen(false)}
                  isMobile={false}
                />
              </div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
}