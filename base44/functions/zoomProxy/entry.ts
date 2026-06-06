import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const getZoomAccessToken = async () => {
  const accountId = Deno.env.get('ZOOM_ACCOUNT_ID');
  const clientId = Deno.env.get('ZOOM_CLIENT_ID');
  const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  const data = await response.json();
  if (!data.access_token) throw new Error(`Zoom token error: ${JSON.stringify(data)}`);
  return data.access_token;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { action, payload = {} } = await req.json();
    const accessToken = await getZoomAccessToken();

    if (action === 'testConnection') {
      const res = await fetch('https://api.zoom.us/v2/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      return Response.json({ success: true, email: data.email, name: `${data.first_name} ${data.last_name}` });
    }

    if (action === 'createMeeting') {
      const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: payload.topic || 'Coaching Session',
          type: 2,
          start_time: payload.start_time,
          duration: payload.duration || 60,
          timezone: payload.timezone || 'UTC',
          agenda: payload.agenda || '',
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            waiting_room: payload.waiting_room !== false,
            auto_recording: payload.auto_record ? 'cloud' : 'none',
          },
        }),
      });
      const data = await res.json();
      return Response.json(data);
    }

    if (action === 'deleteMeeting') {
      await fetch(`https://api.zoom.us/v2/meetings/${payload.meeting_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return Response.json({ success: true });
    }

    if (action === 'getMeeting') {
      const res = await fetch(`https://api.zoom.us/v2/meetings/${payload.meeting_id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      return Response.json(data);
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});