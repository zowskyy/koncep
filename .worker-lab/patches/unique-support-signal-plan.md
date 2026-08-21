# Unique Support Signal Plan

## Goal
Allow one anonymous support signal per browser per proposal.

## Existing data
Use the existing `support_signals` table and its unique
`(proposalId, memberId)` database index.

## Behavior
- Create a durable anonymous `koncep_member_id` cookie if absent.
- Insert a support signal once per proposal and member.
- Increment `proposals.supporters` only for a newly inserted signal.
- Repeated clicks return a friendly already-supported state.
- The client button becomes disabled after successful support.

## Validation
Run npm run check. Run npm run build only after this support phase and the
next planned phase are complete.
