"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { SUPPORT_THRESHOLD } from "@/lib/domain/support";
import { getOrCreateMemberId } from "@/lib/server/auth/member";
import { db } from "@/lib/server/db";
import {
  proposalEvents,
  proposals,
  supportSignals
} from "@/lib/server/db/schema";

type SupportProposalState = {
  error: string | null;
  alreadySupported: boolean;
  supporters: number;
  supported: boolean;
};

export async function supportProposal(
  _previousState: SupportProposalState,
  formData: FormData
): Promise<SupportProposalState> {
  const proposalId = String(formData.get("proposalId") ?? "").trim();

  if (!proposalId) {
    return {
      error: "A proposal ID is required.",
      alreadySupported: false,
      supporters: 0,
      supported: false
    };
  }

  const memberId = await getOrCreateMemberId();

  const current = db
    .select({
      status: proposals.status,
      supporters: proposals.supporters
    })
    .from(proposals)
    .where(eq(proposals.id, proposalId))
    .get();

  if (!current) {
    return {
      error: "Proposal not found.",
      alreadySupported: false,
      supporters: 0,
      supported: false
    };
  }

  const result = db.transaction((transaction) => {
    const signalResult = transaction
      .insert(supportSignals)
      .values({
        proposalId,
        memberId,
        createdAt: new Date()
      })
      .onConflictDoNothing()
      .run();

    if (signalResult.changes === 0) {
      return {
        inserted: false,
        supporters: current.supporters
      };
    }

    const supporters = current.supporters + 1;
    const becameCommunityBacked =
      current.status === "published" &&
      supporters >= SUPPORT_THRESHOLD;

    transaction
      .update(proposals)
      .set({
        supporters,
        status: becameCommunityBacked ? "supported" : current.status
      })
      .where(eq(proposals.id, proposalId))
      .run();

    if (becameCommunityBacked) {
      transaction
        .insert(proposalEvents)
        .values({
          proposalId,
          type: "community_backed",
          createdAt: new Date()
        })
        .run();
    }

    return {
      inserted: true,
      supporters
    };
  });

  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath("/proposals");

  return {
    error: null,
    alreadySupported: !result.inserted,
    supporters: result.supporters,
    supported: true
  };
}
