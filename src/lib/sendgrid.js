const SENDGRID_API = 'https://api.sendgrid.com/v3';

const sgRequest = async (endpoint, method = 'GET', body = null) => {
  const apiKey = import.meta.env.VITE_SENDGRID_API_KEY;
  const response = await fetch(`${SENDGRID_API}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });
  if (response.status === 202 || response.status === 204) return { success: true };
  return response.json();
};

export const sendEmail = async ({ to, toName, subject, html, text }) => {
  const fromEmail = import.meta.env.VITE_SENDGRID_FROM_EMAIL;
  const fromName = import.meta.env.VITE_SENDGRID_FROM_NAME || 'KOACH AI';
  return sgRequest('/mail/send', 'POST', {
    personalizations: [{ to: [{ email: to, name: toName }] }],
    from: { email: fromEmail, name: fromName },
    subject,
    content: [
      { type: 'text/plain', value: text || subject },
      { type: 'text/html', value: html },
    ],
  });
};

export const sendBulkEmail = async (recipients, subject, html) => {
  const fromEmail = import.meta.env.VITE_SENDGRID_FROM_EMAIL;
  const fromName = import.meta.env.VITE_SENDGRID_FROM_NAME || 'KOACH AI';
  return sgRequest('/mail/send', 'POST', {
    personalizations: recipients.map(r => ({
      to: [{ email: r.email, name: r.name }],
      dynamic_template_data: { name: r.name, ...r.data },
    })),
    from: { email: fromEmail, name: fromName },
    subject,
    content: [{ type: 'text/html', value: html }],
  });
};

export const getEmailStats = async () => {
  const end = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return sgRequest(`/stats?start_date=${start}&end_date=${end}`);
};

export const isSendGridEnabled = () => !!import.meta.env.VITE_SENDGRID_API_KEY;