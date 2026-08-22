export const proposalEventTypes = [
  "created",
  "updated",
  "published",
  "community_backed",
  "ceo_review",
  "completed"
] as const;

export type ProposalEventType = (typeof proposalEventTypes)[number];

export type ProposalEvent = {
  id: number;
  type: ProposalEventType;
  createdAt: Date;
};


