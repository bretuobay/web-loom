import { Project } from '../models/project.model';
import { Task, TASK_PRIORITIES, TASK_STATUSES } from '../models/task.model';

const sampleProjects = [
  {
    name: 'Apollo Launch',
    description: 'Prepare a launch-ready project management dashboard for the Apollo program.',
    color: '#2563eb',
    status: 'active' as const
  },
  {
    name: 'Atlas Migration',
    description: 'Move Atlas analytics to the new Web Loom platform before Q3.',
    color: '#0ea5e9',
    status: 'planning' as const
  },
  {
    name: 'Comet Calendar',
    description: 'Design a collaborative calendar plugin for space-planning teams.',
    color: '#16a34a',
    status: 'paused' as const
  }
];

const sampleTasks = [
  {
    title: 'Design Kanban layout',
    description: 'Wireframe the Kanban plugin and define swimlane states.',
    assignee: 'Ayesha',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4)
  },
  {
    title: 'Review API contracts',
    description: 'Validate TaskFlow API routes with the new OpenAPI generator.',
    assignee: 'Mateo',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
  },
  {
    title: 'Finalize plugin manifest',
    description: 'Document metadata and dependencies for the Kanban widget.',
    assignee: 'Sora',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2)
  }
];

export const seedInitialData = async () => {
  const existing = await Project.count();
  if (existing > 0) {
    return;
  }

  const createdProjects: Project[] = [];
  for (const entry of sampleProjects) {
    const project = await Project.create(entry);
    createdProjects.push(project);
  }

  for (const taskTemplate of sampleTasks) {
    const project = createdProjects[Math.floor(Math.random() * createdProjects.length)];
    await Task.create(
      {
        ...taskTemplate,
        status: TASK_STATUSES[Math.floor(Math.random() * TASK_STATUSES.length)],
        priority: TASK_PRIORITIES[Math.floor(Math.random() * TASK_PRIORITIES.length)],
        projectId: project.id
      }
    );
  }
};
