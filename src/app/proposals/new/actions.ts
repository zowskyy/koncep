"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import {
  proposalEvents,
  proposalRoles,
  proposals
} from "@/lib/server/db/schema";
import { db } from "@/lib/server/db";
import { getOrCreateMemberId } from "@/lib/server/auth/member";
import { proposalSchema } from "@/lib/validation/proposal";

type CreateProposalState = {
  error: string | null;
};

function makeProposalId(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return `${slug || "proposal"}-${randomUUID().slice(0, 8)}`;
}

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

export async function createProposal(
  _previousState: CreateProposalState,
  formData: FormData
): Promise<CreateProposalState> {
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

  if (!parsed.success) {
    return {
      error: "Please complete every field with valid information."
    };
  }

  const proposalId = makeProposalId(parsed.data.title);
  const ownerMemberId = await getOrCreateMemberId();

  db.transaction((transaction) => {
    transaction
      .insert(proposals)
      .values({
        id: proposalId,
        ownerMemberId,
        title: parsed.data.title,
        category: categoryLabels[parsed.data.category],
        summary: parsed.data.summary,
        description: parsed.data.description,
        supporters: 0,
        createdAt: new Date()
      })
      .run();

    transaction
      .insert(proposalRoles)
      .values(
        parsed.data.neededRoles.map((role) => ({
          proposalId,
          role
        }))
      )
      .run();

    transaction
      .insert(proposalEvents)
      .values({
        proposalId,
        type: "created",
        createdAt: new Date()
      })
      .run();
  });

  redirect(`/proposals/${proposalId}`);
}


