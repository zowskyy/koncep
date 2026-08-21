# Worker Patch Protocol

## Scope
- Work only in this Koncep repository.
- Treat `.worker-lab/incoming/create_wonderlog.sh` as reference material only.
- Do not execute that script.
- Do not copy project scaffolding, package manifests, lockfiles, or database reset commands from it.

## Allowed work
- Adapt a narrowly scoped capability to the existing Koncep architecture.
- Preserve Next.js App Router, the existing Drizzle database, current proposal routes, and existing components.
- Prefer adding one component or one small server/query module at a time.

## Required loop
1. Read the relevant existing Koncep files before editing.
2. State the target files and intended behavior in a patch note.
3. Make one small patch.
4. Run `npm run check`.
5. If it passes, run `npm run build`.
6. If either fails, read the complete error, identify the exact file and symbol, patch only the smallest cause, and retry.
7. After three failed repair attempts, stop. Save the full error output and a concise diagnosis to `.worker-lab/logs`.
8. Never delete `.next`, source files, migrations, package-lock.json, or database files unless the patch note explicitly justifies it.
9. Never use force-install or destructive Git commands.
10. Do not claim completion without both `npm run check` and `npm run build` passing.

## Error handling
- TypeScript errors: inspect the named file and use the declared project types.
- Next.js Server Action errors: a `"use server"` module exports only async functions.
- CSS/Tailwind errors: inspect package.json and current PostCSS configuration before changing CSS tooling.
- Database errors: inspect schema and migrations before modifying queries.
- Duplicate imports/components: preserve the existing component and modify its props or behavior instead of creating a parallel implementation.

## Deliverables
For every patch, save:
- `.worker-lab/patches/<feature>-plan.md`
- `.worker-lab/logs/<feature>-check.log`
- `.worker-lab/logs/<feature>-build.log`
- `.worker-lab/reports/<feature>-result.md`
