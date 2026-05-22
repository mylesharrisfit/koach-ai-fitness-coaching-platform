const CALENDLY_API = 'https://api.calendly.com';

const calendlyRequest = async (endpoint, method = 'GET', body = null) => {
  const token = import.meta.env.VITE_CALENDLY_TOKEN;
  if (!token) throw new Error('VITE_CALENDLY_TOKEN not set');
  const response = await fetch(`${CALENDLY_API}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });
  return response.json();
};

export const getCalendlyUser = () => calendlyRequest('/users/me');

export const getEventTypes = (userUri) =>
  calendlyRequest(`/event_types?user=${encodeURIComponent(userUri)}&active=true`);

export const getScheduledEvents = (userUri, minTime, maxTime) =>
  calendlyRequest(
    `/scheduled_events?user=${encodeURIComponent(userUri)}&min_start_time=${minTime}&max_start_time=${maxTime}&status=active`
  );

export const getEventInvitees = (eventUri) => {
  const uuid = eventUri.split('/').pop();
  return calendlyRequest(`/scheduled_events/${uuid}/invitees`);
};

export const createSingleUseLink = (eventTypeUri, maxUses = 1) =>
  calendlyRequest('/scheduling_links', 'POST', {
    max_event_count: maxUses,
    owner: eventTypeUri,
    owner_type: 'EventType',
  });

export const isCalendlyEnabled = () => !!import.meta.env.VITE_CALENDLY_TOKEN;