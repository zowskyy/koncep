export const projectStatuses = [
  "draft",
  "published",
  "gathering_support",
  "feasibility_review",
  "team_forming",
  "funding_ready",
  "in_production",
  "completed"
] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

export const projectCategories = [
  "games",
  "film-animation",
  "music-audio",
  "publishing",
  "software",
  "education",
  "research",
  "events",
  "physical-products",
  "community"
] as const;

export type ProjectCategory = (typeof projectCategories)[number];

const allowedTransitions: Record<ProjectStatus, ProjectStatus[]> = {
  draft: ["published"],
  published: ["gathering_support"],
  gathering_support: ["feasibility_review"],
  feasibility_review: ["team_forming"],
  team_forming: ["funding_ready"],
  funding_ready: ["in_production"],
  in_production: ["completed"],
  completed: []
};

export function canTransition(
  from: ProjectStatus,
  to: ProjectStatus
): boolean {
  return allowedTransitions[from].includes(to);
}
