# Proposal Discovery Implementation Plan

## Goal
Add URL-driven search and category filtering to `/proposals`.

## Files
- `src/lib/server/proposals.ts`: add optional database filters to `listProposals`.
- `src/components/projects/proposal-filters.tsx`: add URL-synchronized client controls.
- `src/app/proposals/page.tsx`: read URL parameters, render controls, and show filtered results.

## Data behavior
- `q` searches title, summary, and category without case sensitivity.
- `category` matches an existing category exactly.
- Empty filters preserve the current list order and results.
- No schema or migration changes are required.

## Validation
Run `npm run check`, then `npm run build`.
