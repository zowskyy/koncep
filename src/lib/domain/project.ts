export const projectStatuses = [
  "draft",
  "published",
  "supported",
  "completed"
] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

const allowedTransitions: Record<ProjectStatus, readonly ProjectStatus[]> = {
  draft: ["published"],
  published: ["supported"],
  supported: ["completed"],
  completed: []
};

export function canTransitionProjectStatus(
  currentStatus: ProjectStatus,
  nextStatus: ProjectStatus
): boolean {
  return allowedTransitions[currentStatus].includes(nextStatus);
}

export function assertProjectStatusTransition(
  currentStatus: ProjectStatus,
  nextStatus: ProjectStatus
): void {
  if (!canTransitionProjectStatus(currentStatus, nextStatus)) {
    throw new Error(
      `Cannot transition a project from "${currentStatus}" to "${nextStatus}".`
    );
  }
}
