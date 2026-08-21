# Feature Brief — Contributor Interest (Phase 1)

## Target User
- **Primary:** A visitor who is **not the owner** of a proposal and wants to contribute a specific skill. Identity is anonymous via an opaque, randomly generated, non-PII `member_id` issued by the existing cookie helper `getOrCreateMemberId()` (`randomUUID` stored in the `koncep_member_id` httpOnly cookie); no account or verified profile is required for this slice.
- **Secondary:** The proposal **owner**, who needs to see who is interested without learning full identities.

## Trigger
- User navigates to the proposal detail route and views the **Needed roles** section. The trigger is discovery of a listed role the user can fill.

## Primary User Action
- Select one listed needed role and submit **one** interest expression: `I’m interested` for that `(proposal, role)` pair. The action is a single server-validated submission, not a message, application, or assignment.

## Required Stored Data
Persisted in `contributor_interests`:
- `proposal_id` — FK to `proposals.id`, not null
- `role` — text, must equal a role currently in `proposalRoles` for that proposal, not null
- `member_id` — opaque, randomly generated, non-PII identifier from `getOrCreateMemberId()` (`koncep_member_id` cookie), not null. It is not derived from personal data and carries no PII.
- `created_at` — timestamp, not null
- Constraint: `UNIQUE (proposal_id, role, member_id)` — one interest per member per role; a different listed role is a separate row. This database constraint is **authoritative** for duplicate handling, including concurrent submissions (enforced via `onConflictDoNothing` on the unique index, not solely by application-level checks).

## Prohibited Stored Data
- No PII, email, name, or account linkage; no full member ID exposure beyond the anonymized label; no support-count mutation; no status transition; no `proposalEvents` entry; no notification or analytics payload; no seed data added by this feature. The full cookie value is never rendered or returned to the client.

## Visibility, Editing, and Deletion Rules
- **Non-owner:** Sees `I’m interested` controls only when `!isOwner && proposal.status !== "completed"`. The existing needed-roles list remains visible to everyone regardless of state.
- **Owner:** Sees an `Interested contributors` section grouped by role. Each entry shows only `Member {memberId.slice(0,6)}` + human-readable `createdAt`. This anonymized label is a **privacy measure** — it avoids exposing the full opaque cookie value. Displaying only six characters reduces linkability but is **not a stable unique identifier**: collisions are possible (two members may share the same six-character prefix) and must be treated as acceptable for this MVP. This section is rendered **only** after a server-side ownership check (`isOwner`); hiding it in the UI alone is not sufficient.
- **Editing/Deletion (MVP):** Not supported. Interest is immutable after creation; no edit or withdraw flow in this slice.

## Duplicate-Submission Behavior
- Same `(proposal, role, member_id)` submitted again returns `alreadyInterested: true`, `interested: false`, `error: null`. No second insert is performed. The **database unique constraint is authoritative** — concurrent submissions for the same tuple are deduplicated via `onConflictDoNothing` on `contributor_interests_proposal_role_member_idx`; application logic alone is not relied upon. The UI shows `Already interested` and remains disabled. A member **may** express interest in a **different** listed role for the same proposal.

## Validation and Failure Behavior
- Server-side, behavior-preserving:
  - Empty/missing `proposalId` or `role` → `A proposal and role are required.` — core is not called, no revalidation
  - `role` not in `neededRoles` → `That role is not part of this proposal.` — no revalidation, no ID disclosure
  - `proposalId` not found → `This proposal could not be found.` — no revalidation, no ID disclosure
  - Owner `memberId` equals `proposals.ownerMemberId` → `You cannot express interest in your own proposal.` — blocked even on crafted requests, no insert
  - DB/unknown failure → generic safe error; no partial state; no silent fallback; no cast/optionality leak
- Client states: `I’m interested` (default) → `Saving interest…` (pending, disabled) → `Interest recorded` (inserted, disabled) → `Already interested` (duplicate, disabled) → `role="alert"` on error

## Success Confirmation
- On `inserted`: UI shows `Interest recorded`, button disabled, and the concrete proposal detail route is revalidated (the actual route for the proposal, e.g., `/proposals/${proposalId}`, per the repository’s App Router convention at `src/app/proposals/[id]/page.tsx`). Revalidation is scoped to that concrete instance, not to a literal route-pattern string.

## Testable Acceptance Criteria
1. `recordContributorInterest` rejects a role not currently listed in `proposalRoles`.
2. Owner cannot interest themselves via `createContributorInterest` even with a crafted payload.
3. Duplicate `(proposal, role, member)` returns the already-interested state without a second row; concurrent submissions are deduplicated by the authoritative database unique constraint.
4. A member can insert interest for two distinct listed roles on the same proposal.
5. Missing `proposalId` or `role` is rejected before calling the core.
6. `inserted` revalidates the concrete proposal detail route (e.g., `/proposals/${proposalId}` per the App Router’s `src/app/proposals/[id]/page.tsx`); `duplicate`/`missing`/`invalid_role`/`owner` do not revalidate.
7. `getOrCreateMemberId` is used for every non-empty submission, supplying the opaque, randomly generated `member_id`.
8. Detail page: non-owner on non-completed proposal sees one button per needed role; completed proposal hides them; owner sees no buttons.
9. Owner sees role-grouped anonymized list with `Member {6-char}` and readable timestamp; the six-character label is a truncated, non-unique privacy display — collisions are possible and the full cookie value is never exposed; non-owner never sees this list.
10. No change to support counts, status flow, or timeline events.
11. All tests use in-memory SQLite or mocks; `data/koncep.db` is never touched.
12. A non-owner cannot retrieve or render the owner-only contributor list through a crafted request — the list is only fetched and rendered after a server-side `isOwner` check; direct access without ownership yields no data.

## Explicit Non-Goals
- Notifications (email, in-app, or webhook)
- Dashboards or aggregated interest metrics beyond the grouped owner list
- Analytics, tracking beyond necessary operational signals
- Direct messaging, assignment, or acceptance of contributors
- Role creation, editing, or removal
- Authentication or profile system (stays anonymous for this slice)
- Collaboration features (comments, tasks, file sharing) and any other unrelated slice
