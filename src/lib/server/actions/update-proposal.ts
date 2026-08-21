"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getOrCreateMemberId } from "@/lib/server/auth/member";
import { db } from "@/lib/server/db";
import {
  proposalEvents,
  proposalRoles,
  proposals
} from "@/lib/server/db/schema";
import { proposalSchema } from "@/lib/validation/proposal";

type UpdateProposalState = {
  error: string | null;
  updated: boolean;
};

const categoryLabels = {
  games: "Games",
  "film-animation": "Film and animation",
  "music-audio": "Music and audio",
  publishing: "Publishing",
  software: "Software",
  education: "Education",
  research: "Research",
  events: "Events",
  "physical-products": "Physical products",
  community: "Community"
} as const;

export async function updateProposal(
  _previousState: UpdateProposalState,
  formData: FormData
): Promise<UpdateProposalState> {
  const proposalId = String(formData.get("proposalId") ?? "").trim();
  const neededRoles = String(formData.get("neededRoles") ?? "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);

  const parsed = proposalSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    description: String(formData.get("description") ?? ""),
    neededRoles
  });

  if (!proposalId || !parsed.success) {
    return {
      error: "Please complete every field with valid information.",
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

  if (!proposal) {
    return {
      error: "Proposal not found.",
      updated: false
    };
  }

  if (!proposal.ownerMemberId || proposal.ownerMemberId !== memberId) {
    return {
      error: "Only the proposal owner can edit this proposal.",
      updated: false
    };
  }

  if (proposal.status !== "draft") {
    return {
      error: "Only draft proposals can be edited.",
      updated: false
    };
  }

  db.transaction((transaction) => {
    const updateResult = transaction
      .update(proposals)
      .set({
        title: parsed.data.title,
        category: categoryLabels[parsed.data.category],
        summary: parsed.data.summary,
        description: parsed.data.description
      })
      .where(
        and(
          eq(proposals.id, proposalId),
          eq(proposals.ownerMemberId, memberId),
          eq(proposals.status, "draft")
        )
      )
      .run();

    if (updateResult.changes === 0) {
      throw new Error("Proposal changed before your edit could be saved.");
    }

    transaction
      .delete(proposalRoles)
      .where(eq(proposalRoles.proposalId, proposalId))
      .run();

    if (parsed.data.neededRoles.length > 0) {
      transaction
        .insert(proposalRoles)
        .values(
          parsed.data.neededRoles.map((role) => ({
            proposalId,
            role
          }))
        )
        .run();
    }

    transaction
      .insert(proposalEvents)
      .values({
        proposalId,
        type: "updated",
        createdAt: new Date()
      })
      .run();
  });

  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath("/proposals");

  return {
    error: null,
    updated: true
  };
}
