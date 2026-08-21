# Unique Support Signal Result

Check exit code: 0

Changed files:
- src/lib/server/actions/support-proposal.ts
- src/components/projects/support-button.tsx

Manual test:
1. Open a proposal in a fresh browser session.
2. Click Support proposal once.
3. Confirm the button changes to You support this proposal.
4. Refresh the page and verify database duplicate protection by submitting again only if
   the button is manually re-enabled in development tools.
