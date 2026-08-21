export type ProposalStatus =
  | "draft"
  | "published"
  | "supported"
  | "completed";

export type Proposal = {
  id: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  status: ProposalStatus;
  supporters: number;
  neededRoles: string[];
};
