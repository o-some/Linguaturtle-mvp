# LinguaTurtle agent guidance

- Read `docs/NOW.md` first. Open only the files needed for the task; use `docs/ARCHITECTURE.md` for cross-cutting changes.
- The current stack is Vite, browser-native ES modules and CSS, Capacitor, Supabase and Playwright. Do not introduce React, TypeScript, Zustand or IndexedDB unless the task explicitly requests a migration.
- Reuse existing modules, platform APIs and installed dependencies. Prefer the smallest complete change; never simplify away accessibility, child privacy, data integrity or monetary security.
- Route durable state through `src/v3/core/store.js` and `storage.js`. Keep account and economy trust boundaries described in `docs/ARCHITECTURE.md`.
- Keep learning content separate from UI code and add games through the existing game modules.
- Verify proportionally: syntax and architecture checks for focused changes; relevant Playwright tests for behavior; `npm test` for cross-cutting or release work.
- After a material completed task, update `docs/NOW.md` and any affected canonical documentation. Keep `NOW.md` below 400 words. Save a task plan under `docs/plans/` only when work spans multiple sessions.
