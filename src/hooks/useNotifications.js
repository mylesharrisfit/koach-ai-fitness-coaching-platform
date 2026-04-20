import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async (currentUser) => {
    if (!currentUser) return;
    const data = await base44.entities.Notification.filter(
      { recipient_id: currentUser.email },
      '-created_date',
      30
    );
    setNotifications(data);
  }, []);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      fetchNotifications(u).finally(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.recipient_id !== user.email) return;
      if (event.type === 'create') {
        setNotifications(prev => [event.data, ...prev].slice(0, 30));
      } else if (event.type === 'update') {
        setNotifications(prev => prev.map(n => n.id === event.id ? event.data : n));
      } else if (event.type === 'delete') {
        setNotifications(prev => prev.filter(n => n.id !== event.id));
      }
    });
    return unsub;
  }, [user]);

  const markRead = useCallback(async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, unreadCount, loading, markRead, markAllRead };
}