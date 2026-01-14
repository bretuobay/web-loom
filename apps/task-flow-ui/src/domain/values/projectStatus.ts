export const PROJECT_STATUSES = ['planning', 'active', 'paused', 'completed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const formatProjectStatus = (status: ProjectStatus) =>
  status.charAt(0).toUpperCase() + status.slice(1);
