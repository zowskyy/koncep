import { eq } from "drizzle-orm";
import { db } from "@/lib/server/db";
import {
  contributorInterests,
  proposals,
  proposalRoles
} from "@/lib/server/db/schema";

export type RecordInterestResult =
  | { outcome: "missing" }
  | { outcome: "invalid_role" }
  | { outcome: "owner" }
  | { outcome: "duplicate" }
  | { outcome: "inserted" };

export type ContributorInterestView = {
  role: string;
  memberId: string;
  createdAt: Date;
};

export function recordContributorInterest(
  proposalId: string,
  role: string,
  memberId: string
): RecordInterestResult {
  const rows = db
    .select({
      ownerMemberId: proposals.ownerMemberId,
      neededRole: proposalRoles.role
    })
    .from(proposals)
    .leftJoin(proposalRoles, eq(proposals.id, proposalRoles.proposalId))
    .where(eq(proposals.id, proposalId))
    .all();

  if (rows.length === 0) {
    return { outcome: "missing" };
  }

  const ownerMemberId = rows[0].ownerMemberId;
  const neededRoles = rows
    .map((row) => row.neededRole)
    .filter((value): value is string => Boolean(value));

  if (ownerMemberId && ownerMemberId === memberId) {
    return { outcome: "owner" };
  }

  if (!neededRoles.includes(role)) {
    return { outcome: "invalid_role" };
  }

  const insertResult = db
    .insert(contributorInterests)
    .values({
      proposalId,
      role,
      memberId,
      createdAt: new Date()
    })
    .onConflictDoNothing({
      target: [
        contributorInterests.proposalId,
        contributorInterests.role,
        contributorInterests.memberId
      ]
    })
    .run();

  return insertResult.changes === 0
    ? { outcome: "duplicate" }
    : { outcome: "inserted" };
}

export function listContributorInterests(
  proposalId: string
): ContributorInterestView[] {
  return db
    .select({
      role: contributorInterests.role,
      memberId: contributorInterests.memberId,
      createdAt: contributorInterests.createdAt
    })
    .from(contributorInterests)
    .where(eq(contributorInterests.proposalId, proposalId))
    .all();
}
