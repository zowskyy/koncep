export const proposalEventTypes = [
  "created",
  "updated",
  "updated",
  "published",
  "community_backed",
  "completed"
] as const;

export type ProposalEventType = (typeof proposalEventTypes)[number];

export type ProposalEvent = {
  id: number;
  type: ProposalEventType;
  createdAt: Date;
};


