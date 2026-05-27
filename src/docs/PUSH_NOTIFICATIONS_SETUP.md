# Push Notifications Setup Guide

## Overview

This guide covers setting up Web Push notifications for KOACH AI across iOS, Android, and desktop browsers.

## Architecture

```
User Device
    ↓
Service Worker (receives push)
    ↓
Push Event Handler
    ↓
Display Notification
    ↓
User Interaction → Click Handler → Open Portal
```

---

## Part 1: VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for Web Push.

### Generate VAPID Keys

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Output:
```
Public Key: B...
Private Key: S...
```

### Store Securely

1. **Public Key** → `VITE_VAPID_PUBLIC_KEY` (client-side, safe to expose)
2. **Private Key** → `VAPID_PRIVATE_KEY` (server-side only, never expose)

Add to `.env`:
```
VITE_VAPID_PUBLIC_KEY=B...
VAPID_PRIVATE_KEY=S...
```

---

## Part 2: Service Worker Setup

The service worker (`public/sw.js`) includes:

### Push Event Listener
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192x192.png',
    actions: data.actions, // Action buttons
    vibrate: data.vibrate, // Haptic feedback
  });
});
```

### Notification Click Handler
```javascript
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data.url;
  event.waitUntil(
    clients.matchAll().then(clients => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
```

---

## Part 3: Permission Request Flow

### Step 1: Trigger Permission Prompt

Show `PushPermissionPrompt` component after onboarding:

```jsx
import PushPermissionPrompt from '@/components/pwa/PushPermissionPrompt';

<PushPermissionPrompt onDismiss={handleDismiss} />
```

### Step 2: Request Notification Permission

```javascript
const permission = await Notification.requestPermission();
// 'granted' | 'denied' | 'default'
```

### Step 3: Subscribe to Push

```javascript
const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY,
});
```

### Step 4: Send Subscription to Backend

```javascript
await base44.functions.invoke('savePushSubscription', {
  subscription: JSON.stringify(subscription),
});
```

---

## Part 4: Sending Notifications from Backend

### Function: Send Push Notification

Create `functions/sendPushNotification.js`:

```javascript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webpush from 'npm:web-push@3.6.7';

webpush.setVapidDetails(
  'mailto:support@koachai.com',
  Deno.env.get('VITE_VAPID_PUBLIC_KEY'),
  Deno.env.get('VAPID_PRIVATE_KEY')
);

Deno.serve(async (req) => {
  const { subscription, title, body, url, actions, icon } = await req.json();
  
  try {
    await webpush.sendNotification(
      JSON.parse(subscription),
      JSON.stringify({
        title,
        body,
        icon: icon || '/icon-192x192.png',
        badge: '/badge-72x72.png',
        url,
        actions: actions || [],
        vibrate: [200],
      })
    );
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### Usage Examples

**Check-in Reminder**:
```javascript
await base44.functions.invoke('sendPushNotification', {
  subscription: userSubscription,
  title: '📋 Weekly Check-in Due',
  body: 'Submit your check-in to stay accountable',
  url: '/portal/checkin',
  actions: [
    { action: 'start_checkin', title: 'Start Check-in' },
    { action: 'snooze', title: 'Remind in 1 hour' },
  ],
});
```

**Coach Message**:
```javascript
await base44.functions.invoke('sendPushNotification', {
  subscription: userSubscription,
  title: '💬 Coach sent you a message',
  body: message.content.substring(0, 80),
  url: '/portal/messages',
  actions: [
    { action: 'reply', title: 'Reply' },
  ],
});
```

**Achievement Unlocked**:
```javascript
await base44.functions.invoke('sendPushNotification', {
  subscription: userSubscription,
  title: '🏆 Achievement Unlocked!',
  body: 'You completed your 30-day check-in streak',
  url: '/portal/progress',
  actions: [
    { action: 'view', title: 'View Achievement' },
  ],
});
```

---

## Part 5: iOS-Specific Setup

### Requirements
- iOS 16.4+ (push support for PWA)
- App must be installed to home screen
- Browser: Safari only

### Implementation

1. **Detect iOS**:
```javascript
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
```

2. **Prompt to Add to Home Screen**:
```jsx
import AddToHomeScreenPrompt from '@/components/pwa/AddToHomeScreenPrompt';

{isIOS && <AddToHomeScreenPrompt onDismiss={handleDismiss} />}
```

3. **iOS Push Permissions**:
After adding to home screen, request notification permission using standard flow (see Part 3).

### iOS Limitations
- Push notifications only work in PWA mode (added to home screen)
- Not available in Safari tab
- Requires iOS 16.4+

---

## Part 6: Android-Specific Setup

### Requirements
- Android 5+
- Chrome 54+ (or compatible browser)
- Service Worker support

### Notification Channels

For Android 8+, configure notification channels:

```javascript
// In service worker or main app
const channels = [
  { id: 'messages', importance: 4, sound: 'default' },      // High
  { id: 'reminders', importance: 3, sound: 'default' },      // Default
  { id: 'payments', importance: 4, vibration: [300] },       // High
  { id: 'achievements', importance: 2, sound: 'default' },   // Low
];
```

### Notification Icons

Create Android notification icons:

- **Small Icon** (notification bar): `public/icon-72x72.png`
  - White logo on transparent background
  - 72×72px PNG
  
- **Large Icon** (expanded notification): `public/icon-192x192.png`
  - Colored app icon
  - 192×192px PNG

---

## Part 7: Testing

### Test on Desktop (Chrome)

1. Open DevTools → Application → Service Workers
2. Check "Offline" to simulate offline push
3. In Service Worker console, test:

```javascript
// Simulate push event
self.dispatchEvent(new PushEvent('push', {
  data: new Blob([JSON.stringify({
    title: 'Test Notification',
    body: 'This is a test',
  })]),
}));
```

### Test on Android

1. Install on Chrome mobile
2. Bookmark to home screen
3. Request notification permission
4. Use backend function to send test push

### Test on iOS

1. Open in Safari
2. Share → Add to Home Screen
3. Launch from home screen
4. Request notification permission
5. Test via backend function

---

## Part 8: Notification Sending Automation

### Entity Automation: Check-in Reminder

Create automation in platform:
- **Type**: Scheduled
- **Schedule**: Every Sunday at 9:00 AM
- **Function**: `sendCheckInReminders`
- **Condition**: Client has push subscription

### Function: Send Check-in Reminders

```javascript
// functions/sendCheckInReminders.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  // Get all active clients
  const clients = await base44.asServiceRole.entities.Client
    .filter({ lifecycle_status: 'active' }, '', 1000);
  
  for (const client of clients) {
    if (!client.push_subscriptions) continue;
    
    // Check if check-in is due
    const lastCheckIn = await base44.asServiceRole.entities.CheckIn
      .filter({ client_id: client.id }, '-date', 1);
    
    if (lastCheckIn.length === 0 || /* due logic */) {
      await base44.asServiceRole.functions.invoke('sendPushNotification', {
        subscription: client.push_subscriptions,
        title: '📋 Weekly Check-in Due',
        body: 'Submit your check-in to stay accountable',
        url: '/portal/checkin',
        actions: [
          { action: 'start_checkin', title: 'Start Now' },
        ],
      });
    }
  }
  
  return Response.json({ sent: clients.length });
});
```

---

## Part 9: Permission Handling Edge Cases

### Denied Permissions

After user denies:
1. Wait 14 days before asking again
2. After 2nd denial, show in-app banner
3. Provide "Settings" button to re-enable

### Revoked Permissions

User can revoke in device settings:
- Store permission status in localStorage
- Check on app load
- Don't ask repeatedly

---

## Troubleshooting

### Notifications Not Showing

**Checklist**:
- [ ] Service Worker registered and active
- [ ] Notification permission granted
- [ ] `Notification.permission === 'granted'`
- [ ] VAPID keys correct
- [ ] Push subscription valid (not expired)
- [ ] Payload is valid JSON

### iOS Push Not Working

- [ ] iOS 16.4+
- [ ] App installed to home screen (not in Safari tab)
- [ ] Notification permission granted
- [ ] Test with Safari browser push first

### Android Push Not Working

- [ ] Chrome 54+ or compatible browser
- [ ] Notification permission granted
- [ ] Service Worker running
- [ ] Notification channels configured (Android 8+)

---

## Security Best Practices

1. **Store VAPID Private Key securely** — Never expose in client code
2. **Validate subscriptions** — Check expiry before sending
3. **Rate limit** — Don't spam users with notifications
4. **Respect notification settings** — Honor user preferences
5. **Test before deploy** — Use internal testing track first

---

## Further Reading

- [Web Push Protocol (RFC 8030)](https://tools.ietf.org/html/rfc8030)
- [Push API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [iOS PWA Support](https://webkit.org/blog/12445/updates-to-web-push-notifications-in-ios-and-ipados/)