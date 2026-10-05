# Architecture Rules

- Keep offline drafts, queued mutations, binary payloads, and cached profiles in a user-scoped IndexedDB store because local storage cannot safely handle the required structured and binary data.
- Generate all scouting reports client-side through the shared PDF service because the app must not depend on report-generation server functions.