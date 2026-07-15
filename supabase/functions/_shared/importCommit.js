/**
 * CSV import commit logic (Step 5e) — the value normalizers and the row→client
 * builder from base44/functions/commitClientImport, extracted VERBATIM so the
 * commitClientImport edge function and the local rehearsal build identical
 * client rows (and the rehearsal proves them against the real clients CHECK
 * constraints).
 */

const LIFECYCLE_VALUES = ['lead', 'active', 'at_risk', 'completed', 'alumni'];
const STATUS_VALUES = ['active', 'inactive', 'prospect'];
const GOAL_VALUES = ['weight_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility', 'general_fitness'];

export function normalizeLifecycle(val) {
  if (!val) return 'lead';
  const v = val.toString().toLowerCase().trim().replace(/[\s-]/g, '_');
  if (LIFECYCLE_VALUES.includes(v)) return v;
  if (v.includes('active')) return 'active';
  if (v.includes('risk')) return 'at_risk';
  if (v.includes('complet')) return 'completed';
  if (v.includes('alumni') || v.includes('former')) return 'alumni';
  return 'lead';
}

export function normalizeStatus(val) {
  if (!val) return 'active';
  const v = val.toString().toLowerCase().trim();
  if (STATUS_VALUES.includes(v)) return v;
  if (v.includes('active')) return 'active';
  if (v.includes('inactive') || v.includes('cancel')) return 'inactive';
  return 'active';
}

export function normalizeGoal(val) {
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

export function parseHeight(val) {
  if (!val) return null;
  const s = val.toString().trim();
  if (s.includes("'") || s.includes('ft')) return s;
  const n = parseFloat(s);
  if (isNaN(n)) return s;
  if (n < 100) {
    const ft = Math.floor(n / 12);
    const inches = Math.round(n % 12);
    return `${ft}'${inches}"`;
  }
  const totalInches = n / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${ft}'${inches}"`;
}

export function parseWeight(val) {
  if (!val) return null;
  const s = val.toString().trim().replace(/[^\d.]/g, '');
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return n;
}

export function parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

export function parseTags(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return val.toString().split(/[,;|]/).map((t) => t.trim()).filter(Boolean);
}

export function parseMonthlyRate(val) {
  if (!val) return null;
  const n = parseFloat(val.toString().replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

/**
 * Build one client row from a CSV row + mapping (verbatim commit logic).
 * Returns { skip: 'reason' } or { clientData, email, name }.
 */
export function buildClientRow(row, index, { reverseMap, lastNameCol, unmappedCols, extraCols }) {
  const getVal = (koachField) => {
    const col = reverseMap[koachField];
    return col ? (row[col] ?? null) : null;
  };

  let name = getVal('name');
  if (lastNameCol && row[lastNameCol]) {
    const lastName = row[lastNameCol].trim();
    name = name ? `${name.trim()} ${lastName}` : lastName;
  }
  const email = getVal('email');

  if (!name && !email) return { skip: `Row ${index + 1}: skipped — no name or email` };

  const extraParts = [];
  for (const col of [...unmappedCols, ...extraCols]) {
    const val = row[col];
    if (val !== null && val !== undefined && val !== '') {
      extraParts.push(`${col}: ${val}`);
    }
  }

  const notesFromField = getVal('notes') || '';
  const extraNotes = extraParts.length > 0 ? `[Imported fields]\n${extraParts.join('\n')}` : '';
  const finalNotes = [notesFromField, extraNotes].filter(Boolean).join('\n\n');

  const clientData = {
    name: name || email || `Imported Client ${index + 1}`,
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
  Object.keys(clientData).forEach((k) => {
    if (clientData[k] === null || clientData[k] === undefined) delete clientData[k];
  });

  return { clientData, email, name };
}

/**
 * Precompute the mapping helpers the commit loop needs.
 *
 * BUGFIX vs Base44: it computed extraCols as headers not present in
 * `Object.values(mapping)` — comparing CSV HEADER names against KOACH FIELD
 * names — so every mapped column ("Email" vs 'email') also counted as
 * "extra" and its raw value was duplicated into the client's notes as
 * "[Imported fields]" garbage on every import (null-mapped columns landed
 * twice). extraCols now means what was intended: headers that carry data but
 * appear in the mapping not at all; unmapped-and-extra columns are deduped.
 */
export function mappingContext(mapping, headers) {
  const reverseMap = {};
  let lastNameCol = null;
  Object.entries(mapping || {}).forEach(([csvCol, koachField]) => {
    if (koachField === '__last_name__') { lastNameCol = csvCol; return; }
    if (koachField) reverseMap[koachField] = csvCol;
  });

  const trackedCols = new Set(Object.keys(mapping || {}));
  const unmappedCols = Object.keys(mapping || {}).filter((col) => !mapping[col]);
  const extraCols = (headers || []).filter((col) => !trackedCols.has(col));

  return { reverseMap, lastNameCol, unmappedCols: [...new Set([...unmappedCols, ...extraCols])], extraCols: [] };
}
