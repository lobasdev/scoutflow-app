

# Smart Data Import Wizard

## Overview

A 3-step wizard for bulk-importing players from CSV files. Uses deterministic fuzzy matching to auto-suggest column mappings, with a full manual review/override interface as a dedicated step.

## User Flow

```text
Players Page → "Import" button
  → Step 1: UPLOAD — drag-and-drop or pick CSV, preview first 5 rows
  → Step 2: MAP — review auto-suggested mappings, override via dropdowns, see live preview per column
  → Step 3: REVIEW — full table preview with validation warnings, confirm & import with progress bar
```

## Step 2: Column Mapping Interface (the key step)

This is the interactive mapping review screen:

```text
┌─────────────────────────────────────────────────────────────┐
│  Column Mapping                                    3 of 8   │
│  Review and adjust how your columns map to player fields    │
│                                                             │
│  YOUR COLUMN        →    SCOUTFLOW FIELD       SAMPLE DATA  │
│  ─────────────────────────────────────────────────────────  │
│  "Full Name"        →  [Name         ▼]  ✅   "John Smith"  │
│  "Club"             →  [Team         ▼]  ✅   "Arsenal"     │
│  "DOB"              →  [Date of Birth▼]  ✅   "1998-03-15"  │
│  "Pos"              →  [Position     ▼]  ✅   "CB"          │
│  "Market Val"       →  [Est. Value   ▼]  ✅   "€5M"         │
│  "XYZ Rating"       →  [Skip Column  ▼]  ⚠️   "8.2"         │
│  "Notes"            →  [Summary      ▼]  ✅   "Solid def.." │
│  "Country"          →  [Nationality  ▼]  ✅   "England"     │
│                                                             │
│  ✅ 7 mapped  ⚠️ 1 skipped  ⚠️ "name" must be mapped       │
│                                                             │
│              [← Back]                    [Next: Review →]   │
└─────────────────────────────────────────────────────────────┘
```

Each row shows:
- The original CSV header
- A dropdown pre-filled with the auto-suggested field (or "Skip Column")
- A confidence indicator (green check for match, yellow warning for skip/uncertain)
- Sample data from the first row so the user can verify the mapping makes sense
- Duplicate mapping warning if two columns map to the same field

The "Next" button is disabled until `name` is mapped to at least one column.

## Files to Create

1. **`src/utils/columnMapper.ts`** — Alias dictionary + normalize/match function. Maps headers like "Full Name"→`name`, "Club"→`team`, "DOB"→`date_of_birth`. Returns `Record<string, { field: string, confidence: 'high'|'medium'|'none' }>`.

2. **`src/pages/ImportPlayers.tsx`** — 3-step wizard page with stepper indicators.

3. **`src/components/import/FileUploadStep.tsx`** — Drag-and-drop zone, CSV parsing (manual parser handling quoted fields + delimiter auto-detect), preview table of first 5 rows.

4. **`src/components/import/ColumnMappingStep.tsx`** — The mapping review interface described above. Each column gets a `Select` dropdown with all available player fields + "Skip". Shows sample data beside each mapping. Validates that `name` is mapped.

5. **`src/components/import/ReviewImportStep.tsx`** — Mapped data preview table (first 20 rows), validation warnings (missing names, bad dates, potential duplicates), import button with progress bar, success/error summary.

## Files to Modify

6. **`src/pages/Home.tsx`** — Add "Import" button (Upload icon) in the toolbar next to the existing Export CSV button.

7. **`src/App.tsx`** — Add route `/players/import` → `ProtectedRoute` with `requireSubscription`.

## Mappable Player Fields

Based on the existing `players` table: `name`, `position`, `team`, `nationality`, `date_of_birth`, `height`, `weight`, `foot`, `estimated_value`, `goals`, `assists`, `appearances`, `minutes_played`, `shirt_number`, `profile_summary`, `recommendation`, `strengths`, `weaknesses`, `tags`, `contract_expires`, `current_salary`, `agency`, `video_link`, `scout_notes`.

## Technical Notes

- CSV parsing is fully client-side, no edge functions needed
- Date parsing uses `date-fns` (already installed) to try multiple formats
- Value parsing reuses existing `parseEstimatedValue`
- Batch insert in groups of 50 via `supabase.from('players').insert()`
- `scout_id` is set automatically from `auth.uid()`
- No database changes required

