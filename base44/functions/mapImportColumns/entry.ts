import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const KOACH_FIELDS = [
  { key: 'name',         label: 'Full Name',    description: 'Client full name' },
  { key: 'email',        label: 'Email',         description: 'Email address' },
  { key: 'phone',        label: 'Phone',         description: 'Phone number' },
  { key: 'height',       label: 'Height',        description: 'Height (string, e.g. 5\'10" or cm)' },
  { key: 'current_weight', label: 'Weight',      description: 'Body weight in lbs or kg' },
  { key: 'sex',          label: 'Sex / Gender',  description: 'Sex or gender' },
  { key: 'date_of_birth', label: 'Date of Birth', description: 'DOB or age' },
  { key: 'location',     label: 'Location',      description: 'City, state, country' },
  { key: 'status',       label: 'Status',        description: 'Active / inactive / prospect' },
  { key: 'lifecycle_status', label: 'Lifecycle Status', description: 'lead / active / at_risk / completed / alumni' },
  { key: 'tags',         label: 'Tags',          description: 'Comma-separated tags or labels' },
  { key: 'start_date',   label: 'Start Date',    description: 'Coaching start date' },
  { key: 'goal',         label: 'Goal',          description: 'Client fitness goal' },
  { key: 'monthly_rate', label: 'Monthly Rate',  description: 'Coaching fee in dollars' },
  { key: 'external_id',  label: 'External ID',   description: 'ID from source platform' },
  { key: 'notes',        label: 'Notes',         description: 'Free-text notes, used for unmapped fields too' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { headers, sample_rows } = await req.json();

    if (!headers || !Array.isArray(headers)) {
      return Response.json({ error: 'headers array is required' }, { status: 400 });
    }

    const fieldsDescription = KOACH_FIELDS.map(f => `"${f.key}" (${f.label}: ${f.description})`).join(', ');
    const sampleJson = JSON.stringify(sample_rows?.slice(0, 3) || []);

    const prompt = `You are a data migration assistant for a fitness coaching platform called KOACH AI.

A coach is importing clients from another platform. Here are the CSV headers:
${JSON.stringify(headers)}

Here are 3 sample rows (as JSON objects keyed by header):
${sampleJson}

The KOACH AI client fields you can map to are:
${fieldsDescription}

Instructions:
1. For each CSV header, propose the best KOACH field to map it to, or null if it cannot be mapped.
2. Set confidence to "high", "medium", "low", or "unmapped".
3. Use "unmapped" when the column contains data that doesn't fit any KOACH field (these will be appended to notes).
4. Use "external_id" for any source platform's client ID column.
5. Look at sample values to understand what data is actually in each column.
6. If a header could map to "notes", only do so if it's clearly a free-text notes field.
7. Never map two different CSV headers to the same KOACH field — if there's a conflict, pick the best match and set the others to null/unmapped.

Respond ONLY with a JSON object with two keys:
- "mapping": object where each key is a CSV header and the value is a KOACH field key string or null
- "confidence": object where each key is a CSV header and the value is "high", "medium", "low", or "unmapped"

Example:
{
  "mapping": { "First Name": "name", "Member Email": "email", "Member ID": "external_id", "Join Date": "start_date", "Activity Score": null },
  "confidence": { "First Name": "high", "Member Email": "high", "Member ID": "high", "Join Date": "medium", "Activity Score": "unmapped" }
}`;

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data?.content?.[0]?.text || '';

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: 'AI did not return valid JSON', raw: text }, { status: 500 });
    }
    const parsed = JSON.parse(jsonMatch[0]);

    return Response.json({
      mapping: parsed.mapping || {},
      confidence: parsed.confidence || {},
      koach_fields: KOACH_FIELDS,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});