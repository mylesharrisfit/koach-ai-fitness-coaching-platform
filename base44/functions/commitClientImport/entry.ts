import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LIFECYCLE_VALUES = ['lead', 'active', 'at_risk', 'completed', 'alumni'];
const STATUS_VALUES = ['active', 'inactive', 'prospect'];
const GOAL_VALUES = ['weight_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility', 'general_fitness'];

function normalizeLifecycle(val) {
  if (!val) return 'lead';
  const v = val.toString().toLowerCase().trim().replace(/[\s-]/g, '_');
  if (LIFECYCLE_VALUES.includes(v)) return v;
  if (v.includes('active')) return 'active';
  if (v.includes('risk')) return 'at_risk';
  if (v.includes('complet')) return 'completed';
  if (v.includes('alumni') || v.includes('former')) return 'alumni';
  return 'lead';
}

function normalizeStatus(val) {
  if (!val) return 'active';
  const v = val.toString().toLowerCase().trim();
  if (STATUS_VALUES.includes(v)) return v;
  if (v.includes('active')) return 'active';
  if (v.includes('inactive') || v.includes('cancel')) return 'inactive';
  return 'active';
}

function normalizeGoal(val) {
  if (!val) return 'general_fitness';
  const v = val.toString().toLowerCase().trim().replace(/[\s-]/g, '_');
  if (GOAL_VALUES.includes(v)) return v;
  if (v.includes('weight') || v.includes('fat') || v.includes('loss')) return 'weight_loss';
  if (v.includes('muscle') || v.includes('bulk') || v.includes('gain')) return 'muscle_gain';
  if (v.includes('strength') || v.includes('power')) return 'strength';
  if (v.includes('endurance') || v.includes('cardio') || v.includes('run')) return 'endurance';
  if (v.includes('flex') || v.includes('mobility')) return 'flexibility';
  return 'general_fitness';
}

function parseHeight(val) {
  if (!val) return null;
  const s = val.toString().trim();
  // Already in feet/inches format  e.g. 5'10" or 5'10
  if (s.includes("'") || s.includes('ft')) return s;
  // Numeric — treat as inches if < 100, else cm
  const n = parseFloat(s);
  if (isNaN(n)) return s;
  if (n < 100) {
    // inches → feet'inches"
    const ft = Math.floor(n / 12);
    const inches = Math.round(n % 12);
    return `${ft}'${inches}"`;
  }
  // cm → feet'inches"
  const totalInches = n / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${ft}'${inches}"`;
}

function parseWeight(val) {
  if (!val) return null;
  const s = val.toString().trim().replace(/[^\d.]/g, '');
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  // Store as-is in lbs (KOACH uses lbs for current_weight)
  return n;
}

function parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function parseTags(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return val.toString().split(/[,;|]/).map(t => t.trim()).filter(Boolean);
}

function parseMonthlyRate(val) {
  if (!val) return null;
  const n = parseFloat(val.toString().replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id } = await req.json();
    if (!job_id) return Response.json({ error: 'job_id required' }, { status: 400 });

    // Fetch the import job
    const job = await base44.entities.ClientImportJob.get(job_id);
    if (!job) return Response.json({ error: 'Import job not found' }, { status: 404 });
    if (job.status !== 'confirmed') {
      return Response.json({ error: 'Job must be in confirmed status before committing' }, { status: 400 });
    }

    const mapping = job.column_mapping || {};
    const rows = job.all_rows || [];

    // Build reverse map: koach_field -> csv_header
    const reverseMap = {};
    Object.entries(mapping).forEach(([csvCol, koachField]) => {
      if (koachField) reverseMap[koachField] = csvCol;
    });

    // Collect unmapped columns (value is null or column not in any mapping value)
    const mappedCsvCols = new Set(Object.values(mapping).filter(Boolean));
    const unmappedCols = Object.keys(mapping).filter(col => !mapping[col]);
    // Also collect columns with data that didn't map
    const allCsvCols = job.headers || [];
    const extraCols = allCsvCols.filter(col => !mappedCsvCols.has(col));

    // Fetch existing clients for duplicate detection (by email)
    const existingClients = await base44.asServiceRole.entities.Client.filter({ created_by_id: user.id });
    const existingEmails = new Set(existingClients.map(c => (c.email || '').toLowerCase().trim()));

    let imported = 0;
    let skipped = 0;
    let flagged = 0;
    const errorLog = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const getVal = (koachField) => {
        const col = reverseMap[koachField];
        return col ? (row[col] ?? null) : null;
      };

      const name = getVal('name');
      const email = getVal('email');

      // Skip rows with no name or no email
      if (!name && !email) {
        errorLog.push(`Row ${i + 1}: skipped — no name or email`);
        skipped++;
        continue;
      }

      // Duplicate check
      if (email && existingEmails.has(email.toLowerCase().trim())) {
        skipped++;
        continue;
      }

      // Build unmapped/extra column notes
      const extraParts = [];
      for (const col of [...unmappedCols, ...extraCols]) {
        const val = row[col];
        if (val !== null && val !== undefined && val !== '') {
          extraParts.push(`${col}: ${val}`);
        }
      }

      // Build notes: merge existing notes field + extra columns
      const notesFromField = getVal('notes') || '';
      const extraNotes = extraParts.length > 0 ? `[Imported fields]\n${extraParts.join('\n')}` : '';
      const finalNotes = [notesFromField, extraNotes].filter(Boolean).join('\n\n');

      const clientData = {
        name: name || email || `Imported Client ${i + 1}`,
        email: email || null,
        phone: getVal('phone') || null,
        height: parseHeight(getVal('height')),
        current_weight: parseWeight(getVal('current_weight')),
        start_date: parseDate(getVal('start_date') || getVal('date_of_birth')),
        status: normalizeStatus(getVal('status')),
        lifecycle_status: normalizeLifecycle(getVal('lifecycle_status') || getVal('status')),
        tags: parseTags(getVal('tags')),
        goal: normalizeGoal(getVal('goal')),
        monthly_rate: parseMonthlyRate(getVal('monthly_rate')),
        external_id: getVal('external_id') || null,
        notes: finalNotes || null,
      };

      // Remove null values to avoid overwriting defaults
      Object.keys(clientData).forEach(k => {
        if (clientData[k] === null || clientData[k] === undefined) delete clientData[k];
      });

      try {
        await base44.asServiceRole.entities.Client.create({ ...clientData, created_by_id: user.id });
        if (email) existingEmails.add(email.toLowerCase().trim());
        imported++;
      } catch (err) {
        flagged++;
        errorLog.push(`Row ${i + 1} (${name || email}): ${err.message}`);
      }
    }

    // Update job to committed
    await base44.entities.ClientImportJob.update(job_id, {
      status: 'committed',
      imported_count: imported,
      skipped_count: skipped,
      flagged_count: flagged,
      error_log: errorLog,
    });

    return Response.json({ success: true, imported, skipped, flagged, error_log: errorLog });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});