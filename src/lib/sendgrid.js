const RESEND_API = 'https://api.resend.com';

const resendRequest = async (endpoint, method = 'POST', body = null) => {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  const response = await fetch(`${RESEND_API}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : null
  });
  if (response.status === 200 || response.status === 201)
    return response.json();
  return { error: 'Failed to send email' };
};

export const sendEmail = async ({ to, toName, subject, html, text }) => {
  const fromEmail = import.meta.env.VITE_FROM_EMAIL || 'onboarding@resend.dev';
  const fromName = import.meta.env.VITE_FROM_NAME || 'KOACH AI';

  return resendRequest('/emails', 'POST', {
    from: `${fromName} <${fromEmail}>`,
    to: [to],
    subject,
    html,
    text: text || subject
  });
};

export const sendBulkEmail = async (recipients, subject, html) => {
  const results = await Promise.allSettled(
    recipients.map(r => sendEmail({
      to: r.email,
      toName: r.name,
      subject,
      html: html.replace('{name}', r.name)
    }))
  );
  return results;
};

export const testConnection = async () => {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  if (!apiKey) return { success: false, error: 'No API key found' };
  const response = await fetch(`${RESEND_API}/domains`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  return response.ok
    ? { success: true }
    : { success: false, error: 'Invalid API key' };
};

// Keep legacy name for backward compat
export const isResendEnabled = () => !!import.meta.env.VITE_RESEND_API_KEY;
export const isSendGridEnabled = isResendEnabled;