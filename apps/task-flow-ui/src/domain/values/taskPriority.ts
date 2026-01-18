export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const formatTaskPriority = (priority: TaskPriority) => priority.charAt(0).toUpperCase() + priority.slice(1);
