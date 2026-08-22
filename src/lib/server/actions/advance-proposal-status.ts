"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  assertProjectStatusTransition,
  projectStatuses,
  type ProjectStatus
} from "@/lib/domain/project";
import { getOrCreateMemberId } from "@/lib/server/auth/member";
import { db } from "@/lib/server/db";
import {
  proposalEvents,
  proposals
} from "@/lib/server/db/schema";

type AdvanceProposalStatusState = {
  error: string | null;
  status: ProjectStatus | null;
  updated: boolean;
};

function isProjectStatus(value: string): value is ProjectStatus {
  return projectStatuses.includes(value as ProjectStatus);
}

function eventTypeForStatus(
  status: ProjectStatus
): "published" | "ceo_review" | "completed" | null {
  if (status === "published") {
    return "published";
  }

  if (status === "ceo_review") {
    return "ceo_review";
  }

  if (status === "completed") {
    return "completed";
  }

  return null;
}

export async function advanceProposalStatus(
  _previousState: AdvanceProposalStatusState,
  formData: FormData
): Promise<AdvanceProposalStatusState> {
  const proposalId = String(formData.get("proposalId") ?? "").trim();
  const requestedStatusValue = String(
    formData.get("nextStatus") ?? ""
  ).trim();

  if (!proposalId || !isProjectStatus(requestedStatusValue)) {
    return {
      error: "The requested status change is invalid.",
      status: null,
      updated: false
    };
  }

  const memberId = await getOrCreateMemberId();

  const proposal = db
    .select({
      ownerMemberId: proposals.ownerMemberId,
      status: proposals.status
    })
    .from(proposals)
    .where(eq(proposals.id, proposalId))
    .get();

  if (!proposal || !isProjectStatus(proposal.status)) {
    return {
      error: "Proposal not found.",
      status: null,
      updated: false
    };
  }

  if (!proposal.ownerMemberId || proposal.ownerMemberId !== memberId) {
    return {
      error: "Only the proposal owner can change its status.",
      status: proposal.status,
      updated: false
    };
  }

  try {
    assertProjectStatusTransition(proposal.status, requestedStatusValue);
  } catch {
    return {
      error: "This status change is not allowed.",
      status: proposal.status,
      updated: false
    };
  }

  db.transaction((transaction) => {
    transaction
      .update(proposals)
      .set({
        status: requestedStatusValue
      })
      .where(eq(proposals.id, proposalId))
      .run();

    const eventType = eventTypeForStatus(requestedStatusValue);

    if (eventType) {
      transaction
        .insert(proposalEvents)
        .values({
          proposalId,
          type: eventType,
          createdAt: new Date()
        })
        .run();
    }
  });

  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath("/proposals");

  return {
    error: null,
    status: requestedStatusValue,
    updated: true
  };
}
