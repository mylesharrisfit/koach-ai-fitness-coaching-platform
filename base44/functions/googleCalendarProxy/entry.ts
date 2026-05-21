import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, payload } = body;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    if (action === 'getEvents') {
      const { timeMin, timeMax } = payload;
      const res = await fetch(
        `${CALENDAR_API}/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=100`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      return Response.json({ events: data.items || [], error: data.error });
    }

    if (action === 'createEvent') {
      const res = await fetch(
        `${CALENDAR_API}/calendars/primary/events`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload.event),
        }
      );
      const data = await res.json();
      return Response.json({ event: data, error: data.error });
    }

    if (action === 'deleteEvent') {
      await fetch(
        `${CALENDAR_API}/calendars/primary/events/${payload.eventId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return Response.json({ success: true });
    }

    if (action === 'listCalendars') {
      const res = await fetch(
        `${CALENDAR_API}/users/me/calendarList`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      return Response.json({ calendars: data.items || [], error: data.error });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});