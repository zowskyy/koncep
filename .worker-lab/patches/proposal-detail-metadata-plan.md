# Proposal Detail Metadata and Not-Found Plan

## Goal
Add dynamic proposal metadata and a proposal-specific 404 screen.

## Files
- `src/app/proposals/[id]/page.tsx`
- `src/app/proposals/[id]/not-found.tsx`

## Behavior
- A valid proposal uses its title and summary for browser/search metadata.
- A missing proposal renders a styled page with a link back to all proposals.
- No database schema, migrations, or client-side behavior changes.

## Validation
Run `npm run check`, then `npm run build`.
