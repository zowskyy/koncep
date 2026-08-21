# Proposal Route Resilience Plan

## Goal
Add loading skeletons and recoverable error boundaries to proposal routes.

## Files
- src/app/proposals/loading.tsx
- src/app/proposals/error.tsx
- src/app/proposals/[id]/loading.tsx
- src/app/proposals/[id]/error.tsx

## Behavior
- Navigation to the proposal list and detail route shows a themed loading state.
- Unexpected runtime failures show a styled fallback with a retry control.
- Existing not-found handling remains unchanged.
- No database or schema changes.

## Validation
Run npm run check, then npm run build.
