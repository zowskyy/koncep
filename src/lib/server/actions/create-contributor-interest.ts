"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateMemberId } from "@/lib/server/auth/member";
import {
  recordContributorInterest,
  type RecordInterestResult
} from "@/lib/server/contributor-interest";

export type CreateContributorInterestState = {
  error: string | null;
  interested: boolean;
  alreadyInterested: boolean;
};

export async function createContributorInterest(
  _previousState: CreateContributorInterestState,
  formData: FormData
): Promise<CreateContributorInterestState> {
  const proposalId = String(formData.get("proposalId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();

  if (!proposalId || !role) {
    return {
      error: "A proposal and role are required.",
      interested: false,
      alreadyInterested: false
    };
  }

  const memberId = await getOrCreateMemberId();
  const result = recordContributorInterest(proposalId, role, memberId);

  const stateByOutcome: Record<
    RecordInterestResult["outcome"],
    CreateContributorInterestState
  > = {
    inserted: { error: null, interested: true, alreadyInterested: false },
    duplicate: { error: null, interested: false, alreadyInterested: true },
    missing: {
      error: "This proposal could not be found.",
      interested: false,
      alreadyInterested: false
    },
    invalid_role: {
      error: "That role is not part of this proposal.",
      interested: false,
      alreadyInterested: false
    },
    owner: {
      error: "You cannot express interest in your own proposal.",
      interested: false,
      alreadyInterested: false
    }
  };

  const state = stateByOutcome[result.outcome];

  if (result.outcome === "inserted") {
    revalidatePath(`/proposals/${proposalId}`);
  }

  return state;
}
