# Proposal Discovery Patch Plan

## Goal
Add URL-driven proposal search and category filtering to `/proposals`.

## Constraints
- Do not replace the existing proposal list page wholesale.
- Inspect `src/app/proposals/page.tsx` and the existing proposal query/database module first.
- Reuse existing proposal cards and routes.
- Preserve current ordering unless search/filter changes require a documented query order.
- Search should match title, summary, and category.
- Category filtering should use the database values already stored by Koncep.
- Filter state must be represented in URL query parameters.
- Empty search/filter must preserve the current list behavior.

## Suggested increments
1. Inspect current list page and data access.
2. Add a small client-side filter-control component only.
3. Wire URL parameters into the existing server-rendered page.
4. Add database filtering only if filtering is not already feasible in the list query.
5. Test direct URLs such as:
   - `/proposals`
   - `/proposals?q=community`
   - `/proposals?category=Software`
   - `/proposals?q=community&category=Community`

## Acceptance checks
- Search changes the URL and list.
- Category filter changes the URL and list.
- Clear filters returns to the full list.
- Every result links to its detail page.
- `npm run check` passes.
- `npm run build` passes.
