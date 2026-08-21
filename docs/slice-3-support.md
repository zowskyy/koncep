# Slice 3 — Persistent proposal support

Read the existing project and docs/slice-2-db-wiring.md before changing code.

Current verified status:
- SQLite migration succeeds.
- Seed succeeds.
- Proposal routes return HTTP 200.
- Seeded proposal titles and roles render.
- npm run check passes.
- npm run build passes.
- SupportButton is still client-only state.
- support_signals exists in the database schema.
- No authentication system currently exists.

Goal:
Make proposal support persistence safe and testable.

Do not implement fake permanent support using an arbitrary client-provided memberId.

Choose one of these approaches after inspecting the project:
A. If authentication already exists, use the authenticated member ID.
B. If authentication does not exist, keep support as a clearly marked demo-only local interaction and do not write support_signals.
C. If implementing a development identity is necessary, use a server-created httpOnly cookie with a documented development-only limitation. Do not treat it as production authentication.

Preferred implementation if no authentication exists:
- Do not persist support_signals yet.
- Add a domain-level support policy explaining that persistent support is deferred until authentication exists.
- Keep SupportButton behavior explicit and accessible.
- Add a TODO document for the authentication prerequisite.
- Do not create an insecure public support endpoint.

If authentication exists:
- Add a server action or route for supporting a proposal.
- Enforce one support per member per proposal using the existing unique index.
- Return the updated supporter count.
- Handle duplicate support idempotently.
- Validate that the proposal exists.
- Never accept supporter counts from the client.
- Keep database imports server-only.
- Keep SupportButton as a client component that calls the server boundary.
- Add loading, success, duplicate, and error states.
- Preserve keyboard accessibility and visible focus.

Tests required:
- Missing proposal is rejected.
- Duplicate support cannot create a second support signal.
- Supporter count comes from the database.
- Invalid client input cannot alter the count.
- The existing project domain tests remain unchanged.

Do not add dependencies.
Do not modify unrelated UI.
Do not modify package-lock.json unless strictly required.
Do not add comments, likes, follows, DMs, notifications, or feeds.

Before editing:
- Inspect the current SupportButton.
- Inspect all existing route/action patterns.
- Inspect package.json and authentication status.
- Produce a short plan.
- Wait for approval if the required authentication decision is ambiguous.

After editing:
- Run npm run check.
- Run npm run build.
- Run npm run db:migrate.
- Run npm run db:seed.
- Create docs/slice-3-report.md with:
  - chosen authentication/support strategy
  - files changed
  - tests added
  - commands and results
  - security limitations
  - next recommended slice
