/**
 * CSV import column mapping (Step 5d) — the deterministic rule mapper +
 * AI-merge policy from base44/functions/mapImportColumns, extracted VERBATIM
 * to _shared so the mapImportColumns edge function and the local rehearsal
 * run the same code (the deterministic path is fully testable offline; the
 * AI pass only fills nulls and can never downgrade a deterministic match).
 */
export const KOACH_FIELDS = [
  { key: 'name',             label: 'Full Name',       description: 'Client full name' },
  { key: 'email',            label: 'Email',            description: 'Email address' },
  { key: 'phone',            label: 'Phone',            description: 'Phone number' },
  { key: 'height',           label: 'Height',           description: "Height (string, e.g. 5'10\" or cm)" },
  { key: 'current_weight',   label: 'Weight',           description: 'Current body weight in lbs or kg' },
  { key: 'starting_weight',  label: 'Starting Weight',  description: 'Starting / baseline body weight in lbs or kg' },
  { key: 'target_weight',    label: 'Target Weight',    description: 'Target / goal body weight in lbs or kg' },
  { key: 'sex',              label: 'Sex / Gender',     description: 'Sex or gender' },
  { key: 'date_of_birth',    label: 'Date of Birth',    description: 'DOB or age' },
  { key: 'location',         label: 'Location',         description: 'City, state, country' },
  { key: 'status',           label: 'Status',           description: 'Active / inactive / prospect' },
  { key: 'lifecycle_status', label: 'Lifecycle Status', description: 'lead / active / at_risk / completed / alumni' },
  { key: 'tags',             label: 'Tags',             description: 'Comma-separated tags or labels' },
  { key: 'start_date',       label: 'Start Date',       description: 'Coaching start date' },
  { key: 'goal',             label: 'Goal',             description: 'Client fitness goal' },
  { key: 'monthly_rate',     label: 'Monthly Rate',     description: 'Coaching fee in dollars' },
  { key: 'external_id',      label: 'External ID',      description: 'ID from source platform' },
  { key: 'notes',            label: 'Notes',            description: 'Free-text notes' },
];

// ─── Deterministic rule-based mapper ───────────────────────────────────────
// Each rule: { field, patterns[] } where patterns are lowercase substrings or exact matches.
// Rules are ordered by specificity — first match wins.
const RULES = [
  // External / platform IDs (check before generic "id" patterns)
  { field: 'external_id',    confidence: 'high',   patterns: ['member id', 'client id', 'member_id', 'client_id', 'external id', 'external_id', 'truecoach id', 'ptd id', 'platform id', 'user id', 'userid', 'contact id'] },

  // Name — combined first+last handled post-pass; direct name columns
  { field: 'name',           confidence: 'high',   patterns: ['full name', 'fullname', 'client name', 'name', 'display name', 'displayname', 'customer name'] },

  // Email
  { field: 'email',          confidence: 'high',   patterns: ['email', 'e-mail', 'email address', 'emailaddress', 'client email', 'member email', 'contact email'] },

  // Phone
  { field: 'phone',          confidence: 'high',   patterns: ['phone', 'phone number', 'phonenumber', 'mobile', 'cell', 'telephone', 'contact number', 'tel'] },

  // Height
  { field: 'height',         confidence: 'high',   patterns: ['height', 'ht', 'height (in)', 'height (cm)', 'height_in', 'height_cm'] },

  // Weight — current first, then starting, then target (order matters for deduplication)
  { field: 'current_weight',  confidence: 'high',   patterns: ['current weight', 'current_weight', 'weight (lbs)', 'weight (kg)', 'weight_lbs', 'weight_kg', 'body weight', 'bodyweight', 'weight', 'wt', 'bw'] },
  { field: 'starting_weight', confidence: 'high',   patterns: ['starting weight', 'starting_weight', 'start weight', 'initial weight', 'initial_weight', 'baseline weight', 'starting_lbs'] },
  { field: 'target_weight',   confidence: 'high',   patterns: ['target weight', 'target_weight', 'goal weight', 'goal_weight', 'desired weight', 'ideal weight'] },

  // Sex / Gender
  { field: 'sex',             confidence: 'high',   patterns: ['sex', 'gender', 'biological sex', 'sex/gender', 'sex / gender'] },

  // Date of birth
  { field: 'date_of_birth',  confidence: 'high',   patterns: ['date of birth', 'dob', 'birth date', 'birthdate', 'birthday', 'birth_date', 'date_of_birth'] },

  // Location
  { field: 'location',       confidence: 'high',   patterns: ['location', 'city', 'state', 'country', 'address', 'city/state', 'city, state', 'region', 'area', 'postal', 'zip'] },

  // Lifecycle / Status
  { field: 'lifecycle_status', confidence: 'high', patterns: ['lifecycle', 'lifecycle status', 'lifecycle_status', 'stage', 'pipeline stage'] },
  { field: 'status',           confidence: 'high', patterns: ['status', 'client status', 'member status', 'account status', 'active status'] },

  // Tags / Labels
  { field: 'tags',           confidence: 'high',   patterns: ['tags', 'tag', 'labels', 'label', 'categories', 'category', 'groups', 'group'] },

  // Start date
  { field: 'start_date',     confidence: 'high',   patterns: ['start date', 'start_date', 'join date', 'join_date', 'joined', 'enrollment date', 'signup date', 'onboard date', 'contract start', 'began', 'member since', 'since'] },

  // Goal
  { field: 'goal',           confidence: 'medium', patterns: ['goal', 'fitness goal', 'primary goal', 'client goal', 'objective'] },

  // Monthly rate / revenue
  { field: 'monthly_rate',   confidence: 'high',   patterns: ['monthly rate', 'rate', 'monthly fee', 'fee', 'price', 'revenue', 'monthly revenue', 'amount', 'billing amount', 'subscription'] },

  // Notes
  { field: 'notes',          confidence: 'high',   patterns: ['notes', 'note', 'comments', 'comment', 'memo', 'remarks', 'description', 'coach notes', 'internal notes'] },
];

/**
 * Normalize a column header for matching:
 * lowercase, trim, collapse spaces, remove surrounding quotes.
 */
function normalize(s) {
  return s.toLowerCase().trim().replace(/\s+/g, ' ').replace(/['"]/g, '');
}

/**
 * Run deterministic rule-based mapping on a list of headers.
 * Returns { mapping, confidence } where unmapped columns get null / 'unmapped'.
 * Handles "First Name" + "Last Name" by combining them into 'name'.
 */
export function deterministicMap(headers) {
  const mapping = {};
  const confidence = {};
  const usedFields = new Set();

  const normed = headers.map(h => normalize(h));

  // Special case: "first name" + "last name" → both map to 'name' isn't possible
  // (two cols can't map to same field). Instead: map "first name" to name, mark "last name"
  // as a special sentinel '__last_name__' so commit can merge it.
  // Simpler approach used here: map first name → name (high), last name → null but note it.
  // The commit function already concatenates via the name field from the CSV.
  // For the mapping UI we just flag first name → name, last name → unmapped with a note.
  const hasFirstName = normed.some(n => n === 'first name' || n === 'firstname');
  const hasLastName  = normed.some(n => n === 'last name'  || n === 'lastname');

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    const n = normed[i];

    // Combined first+last name: map first → name, skip last (handled in commit)
    if (hasFirstName && hasLastName) {
      if (n === 'first name' || n === 'firstname') {
        mapping[h] = 'name';
        confidence[h] = 'high';
        usedFields.add('name');
        continue;
      }
      if (n === 'last name' || n === 'lastname') {
        // mark specially so commit knows to append it to name
        mapping[h] = '__last_name__';
        confidence[h] = 'high';
        continue;
      }
    }

    // Plain "name" when no separate first/last
    if (!hasFirstName && !hasLastName && (n === 'name' || n === 'full name' || n === 'fullname' || n === 'client name')) {
      if (!usedFields.has('name')) {
        mapping[h] = 'name';
        confidence[h] = 'high';
        usedFields.add('name');
        continue;
      }
    }

    // Trainer/Coach → skip (not a client field; route to notes)
    if (n === 'trainer' || n === 'coach' || n === 'assigned trainer' || n === 'assigned coach' || n === 'trainer name' || n === 'coach name') {
      mapping[h] = null; // goes to notes
      confidence[h] = 'unmapped';
      continue;
    }

    // Generic id — external_id if not already taken
    if ((n === 'id' || n.endsWith(' id') || n.startsWith('id ')) && !usedFields.has('external_id')) {
      mapping[h] = 'external_id';
      confidence[h] = 'medium';
      usedFields.add('external_id');
      continue;
    }

    // Run through ordered rules.
    // BUGFIX vs Base44: short abbreviation patterns ('ht', 'wt', 'bw', 'tel',
    // 'id') must match EXACTLY — Base44 substring-matched everything, so a
    // plain "Weight" column hit the height rule via 'weig**ht**'.includes('ht')
    // and imports landed body weight in the height field.
    let matched = false;
    for (const rule of RULES) {
      if (usedFields.has(rule.field)) continue; // already claimed
      for (const pattern of rule.patterns) {
        if (n === pattern || (pattern.length >= 3 && n.includes(pattern))) {
          mapping[h] = rule.field;
          confidence[h] = rule.confidence;
          usedFields.add(rule.field);
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    if (!matched) {
      mapping[h] = null;
      confidence[h] = 'unmapped';
    }
  }

  return { mapping, confidence };
}

// ─── Merge AI result into deterministic base ───────────────────────────────
// Only allow AI to fill in nulls; never override a deterministic match.
export function mergeResults(base, ai, headers) {
  const merged = { mapping: { ...base.mapping }, confidence: { ...base.confidence } };
  const usedFields = new Set(Object.values(base.mapping).filter(f => f && f !== '__last_name__'));

  if (!ai) return merged;

  for (const h of headers) {
    // Only fill in if deterministic left it null/unmapped
    if (base.mapping[h] !== null && base.mapping[h] !== undefined) continue;

    const aiField = ai.mapping?.[h];
    if (aiField && aiField !== 'null' && !usedFields.has(aiField)) {
      merged.mapping[h] = aiField;
      merged.confidence[h] = ai.confidence?.[h] || 'low';
      usedFields.add(aiField);
    }
  }

  return merged;
}

