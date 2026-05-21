const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export const getCalendarEvents = async (accessToken, timeMin, timeMax) => {
  const response = await fetch(
    `${CALENDAR_API}/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.json();
};

export const createCalendarEvent = async (accessToken, event) => {
  const response = await fetch(
    `${CALENDAR_API}/calendars/primary/events`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }
  );
  return response.json();
};

export const deleteCalendarEvent = async (accessToken, eventId) => {
  await fetch(
    `${CALENDAR_API}/calendars/primary/events/${eventId}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
  );
};

export const buildSessionEvent = (client, session) => ({
  summary: `Coaching Session — ${client.name}`,
  description: `1:1 coaching session with ${client.name}\n\nGoal: ${client.goal || 'General Coaching'}\nNotes: ${session.notes || ''}`,
  start: {
    dateTime: session.start_time,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  end: {
    dateTime: session.end_time,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  attendees: client.email ? [{ email: client.email }] : [],
  reminders: {
    useDefault: false,
    overrides: [
      { method: 'email', minutes: 24 * 60 },
      { method: 'popup', minutes: 30 },
    ],
  },
  colorId: '9',
});