# UX & Polish Upgrades

## Goal
Make ScoutFlow faster to use in the stands, easier to share with decision-makers, and dependable with weak or no connectivity.

## 1. Batch player dossiers

- Add **Export dossier** to the existing multi-select actions in **My Players** and **Shortlists**.
- Let the scout review the selected players, reorder them, and confirm the export. Support the selected set rather than imposing an arbitrary player limit.
- Generate one branded PDF locally, with a cover/index followed by one consistent profile section per player.
- Include core profile details, summary, recommendation, strengths, development areas, risks, average-rating visualization, and clickable player/video/agency/attachment links when available.
- Exclude full observation history, as requested.
- Reuse the existing client-side PDF and native share/download flow. Keep individual player PDF exports unchanged.
- Show generation progress, identify players with missing content, and recover cleanly if an image or link cannot be loaded.

## 2. Mobile swipe actions

- Add a reusable, touch-only swipe row around player cards/list rows.
- Swipe one direction for **Add to shortlist** and the other for **New observation**.
- Require a deliberate drag threshold, snap closed on cancel, and allow only one row open at a time to prevent accidental actions while scrolling.
- Reuse the current shortlist dialog and observation route so behavior stays consistent.
- Preserve tap-to-open and selection mode. Disable swipe gestures while bulk selection is active.
- Keep equivalent visible controls/menu actions for keyboard, screen-reader, and desktop users; gestures are shortcuts, not the only access path.
- Apply the pattern to player lists. Inbox entries do not get these actions because an Inbox item is not yet a full player profile.

## 3. Offline queue and cached profiles

### Offline foundation
- Add a user-scoped local store for drafts, queued operations, cached profile snapshots, and audio blobs.
- Add a central connection/sync provider with states for **offline**, **syncing**, **needs attention**, and **up to date**.
- Show a discreet global status banner and a queue panel where users can review failures and retry or discard individual items.
- Never mix cached or queued data between signed-in users; clear sensitive local data on sign-out.

### Offline creation
- **Observations:** autosave form data and ratings locally; new observations can be submitted to the queue offline. Sync the observation first, then its ratings, using a stable client operation ID to avoid duplicates.
- **Voice notes:** preserve recordings as local audio blobs when upload is unavailable; upload the file first, then save its record after reconnecting. Show queued notes immediately with pending status.
- **Player and Inbox drafts:** autosave unfinished forms and allow new entries to queue offline. Photo and attachment uploads remain visibly pending and sync after the base player exists.
- Editing an existing server record offline remains a draft until reconnect, avoiding silent overwrites.

### Offline reading and synchronization
- Persist recently viewed player profiles and their rating summaries for read-only offline access, with a clear “saved copy” timestamp.
- Serve cached data only when the network request cannot complete; do not replace fresher online data.
- Retry automatically on reconnect and app resume, in dependency order, with manual retry for failed items.
- Use last-write protection for edits: if the server record changed after the local draft began, pause that item and ask the user whether to keep the server version or apply the draft.
- Refresh the relevant lists and profile views after successful sync.

## Technical details

- Continue using `@react-pdf/renderer`; add a multi-player dossier document and extend the existing PDF service rather than introducing server-side PDF generation.
- Capture the existing ratings visualization as an image or render an equivalent PDF-safe chart; sanitize external links and tolerate unavailable remote photos.
- Use IndexedDB for structured drafts, cached snapshots, queue metadata, and audio/file blobs. Keep only lightweight display preferences in local storage.
- Model queued work with stable IDs, user ID, operation type, payload, dependencies, attempt count, timestamps, and status. Make processors idempotent.
- Route online reads through React Query, seed from the offline cache where appropriate, and update the cache after successful fetches.
- Add focused tests for dossier assembly, swipe thresholds, queue ordering/idempotency, user isolation, conflict handling, and failed audio upload recovery.

## Delivery sequence

1. Build batch dossier export and verify a multi-player PDF visually on web and native sharing paths.
2. Add accessible mobile swipe shortcuts and test touch scrolling, selection mode, and both actions.
3. Add the offline store and global sync status.
4. Enable queued observations and voice notes.
5. Enable player/Inbox drafts, deferred files, and recently viewed profile caching.
6. Validate reconnect, duplicate prevention, conflict handling, sign-out cleanup, and solo/team accounts.

## Acceptance criteria

- A scout can select players in My Players or a Shortlist and download/share one readable dossier containing profile summaries, charts, and working media links.
- On mobile, a deliberate swipe exposes shortlist and observation shortcuts without breaking vertical scrolling or normal card navigation.
- Offline users can complete every requested workflow and see exactly what is saved locally, queued, syncing, or failed.
- Reconnecting syncs queued work once, in the correct order, without duplicate players, observations, ratings, or voice notes.
- Recently viewed profiles remain readable offline and are visibly identified as cached copies.
- Existing solo-plan and team-plan permissions remain unchanged.
