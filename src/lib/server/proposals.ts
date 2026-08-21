import { and, asc, desc, eq, like, or } from "drizzle-orm";
import type { Proposal } from "../domain/proposals";
import { db } from "./db/client";
import {
  proposalEvents,
  proposalRoles,
  proposals
} from "./db/schema";

export const proposalSortOptions = [
  "newest",
  "oldest",
  "supporters"
] as const;

export type ProposalSort = (typeof proposalSortOptions)[number];

function groupProposalRows(
  rows: Array<{
    proposal: typeof proposals.$inferSelect;
    role: string | null;
  }>
): Proposal[] {
  const grouped = new Map<string, Proposal>();

  for (const row of rows) {
    const existing = grouped.get(row.proposal.id);

    if (existing) {
      if (row.role) {
        existing.neededRoles.push(row.role);
      }

      continue;
    }

    grouped.set(row.proposal.id, {
      id: row.proposal.id,
      title: row.proposal.title,
      category: row.proposal.category,
      summary: row.proposal.summary,
      description: row.proposal.description,
      status: row.proposal.status as Proposal["status"],
      supporters: row.proposal.supporters,
      neededRoles: row.role ? [row.role] : []
    });
  }

  return [...grouped.values()];
}

export type ProposalListFilters = {
  category?: string;
  query?: string;
  status?: Proposal["status"];
  sort?: ProposalSort;
};

export function listProposals(filters: ProposalListFilters = {}): Proposal[] {
  const query = filters.query?.trim() ?? "";
  const category = filters.category?.trim() ?? "";
  const status = filters.status?.trim() ?? "";
  const sort = filters.sort ?? "newest";
  const conditions = [];

  if (query) {
    const pattern = `%${query}%`;

    conditions.push(
      or(
        like(proposals.title, pattern),
        like(proposals.summary, pattern),
        like(proposals.category, pattern)
      )
    );
  }

  if (category) {
    conditions.push(eq(proposals.category, category));
  }

  if (status) {
    conditions.push(eq(proposals.status, status));
  }

  const orderBy = {
    newest: [desc(proposals.createdAt), desc(proposals.id)],
    oldest: [asc(proposals.createdAt), asc(proposals.id)],
    supporters: [
      desc(proposals.supporters),
      desc(proposals.createdAt),
      desc(proposals.id)
    ]
  } satisfies Record<ProposalSort, readonly unknown[]>;

  const rows = db
    .select({
      proposal: proposals,
      role: proposalRoles.role
    })
    .from(proposals)
    .leftJoin(
      proposalRoles,
      eq(proposals.id, proposalRoles.proposalId)
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(...orderBy[sort])
    .all();

  return groupProposalRows(rows);
}

export function getProposalById(id: string): Proposal | undefined {
  const rows = db
    .select({
      proposal: proposals,
      role: proposalRoles.role
    })
    .from(proposals)
    .leftJoin(
      proposalRoles,
      eq(proposals.id, proposalRoles.proposalId)
    )
    .where(eq(proposals.id, id))
    .all();

  return groupProposalRows(rows)[0];
}

export function listProposalEvents(
  id: string
): import("../domain/proposal-events").ProposalEvent[] {
  const rows = db
    .select({
      id: proposalEvents.id,
      type: proposalEvents.type,
      createdAt: proposalEvents.createdAt
    })
    .from(proposalEvents)
    .where(eq(proposalEvents.proposalId, id))
    .orderBy(asc(proposalEvents.createdAt), asc(proposalEvents.id))
    .all();

  const validTypes = new Set([
    "created",
    "updated",
    "published",
    "community_backed",
    "completed"
  ]);

  return rows
    .filter((row) => validTypes.has(row.type))
    .map((row) => ({
      id: row.id,
      type: row.type as import("../domain/proposal-events").ProposalEvent["type"],
      createdAt: row.createdAt
    }));
}

