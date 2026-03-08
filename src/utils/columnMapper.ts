// Deterministic fuzzy column mapper for CSV import
// Maps uploaded CSV headers to ScoutFlow player fields using alias dictionary

export interface MappingResult {
  field: string;
  confidence: 'high' | 'medium' | 'none';
}

export interface PlayerFieldOption {
  value: string;
  label: string;
}

export const PLAYER_FIELDS: PlayerFieldOption[] = [
  { value: 'skip', label: 'Skip Column' },
  { value: 'name', label: 'Name' },
  { value: 'position', label: 'Position' },
  { value: 'team', label: 'Team' },
  { value: 'nationality', label: 'Nationality' },
  { value: 'date_of_birth', label: 'Date of Birth' },
  { value: 'height', label: 'Height (cm)' },
  { value: 'weight', label: 'Weight (kg)' },
  { value: 'foot', label: 'Preferred Foot' },
  { value: 'estimated_value', label: 'Estimated Value' },
  { value: 'goals', label: 'Goals' },
  { value: 'assists', label: 'Assists' },
  { value: 'appearances', label: 'Appearances' },
  { value: 'minutes_played', label: 'Minutes Played' },
  { value: 'shirt_number', label: 'Shirt Number' },
  { value: 'profile_summary', label: 'Profile Summary' },
  { value: 'recommendation', label: 'Recommendation' },
  { value: 'scout_notes', label: 'Scout Notes' },
  { value: 'strengths', label: 'Strengths' },
  { value: 'weaknesses', label: 'Weaknesses' },
  { value: 'tags', label: 'Tags' },
  { value: 'contract_expires', label: 'Contract Expires' },
  { value: 'current_salary', label: 'Current Salary' },
  { value: 'agency', label: 'Agency' },
  { value: 'video_link', label: 'Video Link' },
];

// Alias dictionary: field -> list of known aliases (all lowercase)
const ALIAS_MAP: Record<string, string[]> = {
  name: ['name', 'player', 'player name', 'full name', 'fullname', 'player_name', 'playername'],
  position: ['position', 'pos', 'role', 'playing position'],
  team: ['team', 'club', 'current club', 'current team', 'club name', 'team name'],
  nationality: ['nationality', 'nation', 'country', 'nat', 'country of birth', 'citizenship'],
  date_of_birth: ['dob', 'date of birth', 'birth date', 'birthday', 'born', 'birthdate', 'date_of_birth', 'birth_date'],
  height: ['height', 'height cm', 'height (cm)', 'ht', 'size'],
  weight: ['weight', 'weight kg', 'weight (kg)', 'wt', 'mass'],
  foot: ['foot', 'preferred foot', 'strong foot', 'dominant foot', 'footed'],
  estimated_value: ['value', 'market value', 'estimated value', 'transfer value', 'price', 'worth', 'market_value'],
  goals: ['goals', 'gls', 'g', 'goals scored'],
  assists: ['assists', 'ast', 'a', 'assist'],
  appearances: ['appearances', 'apps', 'matches', 'games', 'gp', 'games played', 'caps'],
  minutes_played: ['minutes', 'mins', 'minutes played', 'min', 'mins played'],
  shirt_number: ['number', 'shirt', 'jersey', '#', 'no', 'shirt number', 'jersey number', 'squad number', 'kit number'],
  profile_summary: ['summary', 'profile', 'bio', 'description', 'profile summary'],
  recommendation: ['recommendation', 'verdict', 'assessment', 'eval', 'evaluation'],
  scout_notes: ['notes', 'scout notes', 'scouting notes', 'comments', 'remarks'],
  strengths: ['strengths', 'strong points', 'pros'],
  weaknesses: ['weaknesses', 'weak points', 'cons', 'areas to improve'],
  tags: ['tags', 'labels', 'categories'],
  contract_expires: ['contract', 'contract expires', 'contract end', 'contract expiry', 'end of contract'],
  current_salary: ['salary', 'current salary', 'wage', 'wages', 'pay'],
  agency: ['agency', 'agent', 'representative', 'rep'],
  video_link: ['video', 'video link', 'highlight', 'highlights', 'video url'],
};

function normalize(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[_\-\.]/g, ' ')
    .replace(/[^a-z0-9 #]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function autoMapColumns(headers: string[]): Record<string, MappingResult> {
  const result: Record<string, MappingResult> = {};
  const usedFields = new Set<string>();

  for (const header of headers) {
    const normalized = normalize(header);
    let bestMatch: MappingResult = { field: 'skip', confidence: 'none' };

    for (const [field, aliases] of Object.entries(ALIAS_MAP)) {
      if (usedFields.has(field)) continue;

      // Exact match against aliases
      if (aliases.includes(normalized)) {
        bestMatch = { field, confidence: 'high' };
        break;
      }

      // Check if any alias is contained in the header or vice versa
      for (const alias of aliases) {
        if (normalized.includes(alias) || alias.includes(normalized)) {
          if (bestMatch.confidence !== 'high') {
            bestMatch = { field, confidence: 'medium' };
          }
          break;
        }
      }
    }

    if (bestMatch.field !== 'skip') {
      usedFields.add(bestMatch.field);
    }

    result[header] = bestMatch;
  }

  return result;
}

// CSV parser handling quoted fields and delimiter auto-detection
export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  // Auto-detect delimiter: comma, semicolon, or tab
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  
  let delimiter = ',';
  if (semicolonCount > commaCount && semicolonCount >= tabCount) delimiter = ';';
  else if (tabCount > commaCount && tabCount >= semicolonCount) delimiter = '\t';

  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delimiter) {
          fields.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);

  return { headers, rows };
}

// Parse dates in common formats, return YYYY-MM-DD or null
export function parseDateValue(value: string): string | null {
  if (!value || !value.trim()) return null;
  const v = value.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  let match = v.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  // MM/DD/YYYY (if day > 12, it was caught above as DD/MM)
  // Try native Date parse as fallback
  const date = new Date(v);
  if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
    return date.toISOString().split('T')[0];
  }

  return null;
}

// Parse numeric value, return number or null
export function parseNumericValue(value: string): number | null {
  if (!value || !value.trim()) return null;
  const num = parseFloat(value.replace(/[^0-9.\-]/g, ''));
  return isNaN(num) ? null : num;
}
