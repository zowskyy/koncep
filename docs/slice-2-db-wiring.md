# Slice 2 — Wire proposal pages to SQLite

Read the existing project before changing code.

Current status:
- Drizzle SQLite database is working.
- Database schema exists at src/lib/server/db/schema.ts.
- Database client exists at src/lib/server/db/client.ts.
- Server-only wrapper exists at src/lib/server/db/index.ts.
- Seed data exists in data/koncep.db.
- Existing proposal pages still read from the static array in src/lib/domain/proposals.ts.
- Current lint, typecheck, tests, and production build pass.

Goal:
Replace static proposal reads with database-backed server queries without changing the existing visual design.

Implement only this slice:
1. Create a server-side proposal query module.
2. Add:
   - listProposals()
   - getProposalById(id)
3. Join proposals with proposal_roles.
4. Map database rows into the existing Proposal shape:
   - id
   - title
   - category
   - summary
   - description
   - supporters
   - neededRoles
5. Update:
   - src/app/proposals/page.tsx
   - src/app/proposals/[id]/page.tsx
   to use database-backed queries.
6. Preserve the existing page markup and styling.
7. Keep client components free of database imports.
8. Keep src/lib/domain/project.ts and its tests unchanged.
9. Do not add authentication.
10. Do not implement support persistence yet.
11. Do not add new dependencies.
12. Do not delete the existing seed data.
13. Handle missing proposal IDs with notFound().
14. Make database query functions async if required by the selected Drizzle driver.
15. Add tests for row-to-Proposal mapping and missing/empty role handling.
16. Do not use innerHTML or unsafe rendering.
17. Do not modify package-lock.json unless strictly required.

Before editing:
- Inspect all current proposal page files.
- Inspect src/lib/server/db/schema.ts.
- Inspect src/lib/domain/proposals.ts.
- Produce a short implementation plan.

After editing:
- Run npm run check.
- Run npm run build.
- Run npm run db:migrate.
- Run npm run db:seed.
- Start the development server only if needed.
- Verify:
  /proposals
  /proposals/animation-timeline-editor
  /proposals/community-animated-short
  /proposals/accessible-controller
- Confirm the seeded titles and roles render from SQLite.
- Create docs/slice-2-report.md containing changed files, tests, build result, route results, and remaining limitations.

Do not implement features outside this slice.
