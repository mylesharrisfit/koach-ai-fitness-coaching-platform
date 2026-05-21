const ZOOM_API = 'https://api.zoom.us/v2';

export const createZoomMeeting = async (accessToken, meetingData) => {
  const response = await fetch(`${ZOOM_API}/users/me/meetings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: meetingData.topic,
      type: 2,
      start_time: meetingData.start_time,
      duration: meetingData.duration || 60,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      agenda: meetingData.agenda || '',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        waiting_room: meetingData.waiting_room !== false,
        auto_recording: meetingData.auto_record ? 'cloud' : 'none',
        mute_upon_entry: false,
      },
    }),
  });
  return response.json();
};

export const deleteZoomMeeting = async (accessToken, meetingId) => {
  await fetch(`${ZOOM_API}/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
};

export const getZoomMeeting = async (accessToken, meetingId) => {
  const response = await fetch(`${ZOOM_API}/meetings/${meetingId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.json();
};

export const listZoomMeetings = async (accessToken) => {
  const response = await fetch(`${ZOOM_API}/users/me/meetings?type=upcoming`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.json();
};