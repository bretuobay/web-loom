import { BaseModel, BaseViewModel } from '@web-loom/mvvm-core';
import { z } from 'zod';

const STATUSES = ['Backlog', 'In Progress', 'Review', 'Done'] as const;

type Status = (typeof STATUSES)[number];

const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().min(1),
  color: z.string(),
  status: z.enum(STATUSES),
  tasks: z.number().nonnegative(),
  completed: z.number().nonnegative()
});

const ProjectCollectionSchema = z.array(ProjectSchema);
export type ProjectSnapshot = z.infer<typeof ProjectSchema>;

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `project-${Math.random().toString(36).slice(2, 8)}`;
};

const createProject = (overrides: Partial<ProjectSnapshot> = {}): ProjectSnapshot => ({
  id: createId(),
  name: 'Untitled initiative',
  description: 'Collaborate with the team to finish the next milestone.',
  color: '#818cf8',
  status: 'Backlog',
  tasks: 8,
  completed: 2,
  ...overrides
});

class ProjectCollectionModel extends BaseModel<ProjectSnapshot[], typeof ProjectCollectionSchema> {
  constructor(initial: ProjectSnapshot[]) {
    super({ schema: ProjectCollectionSchema, initialData: initial });
  }

  public addProject(project: ProjectSnapshot) {
    const current = this._data$.getValue() ?? [];
    this.setData([...current, project]);
  }

  public updateStatus(id: string, status: Status) {
    const current = this._data$.getValue() ?? [];
    const index = current.findIndex((item) => item.id === id);
    if (index === -1) {
      return;
    }
    const updated = [...current];
    updated[index] = { ...updated[index], status };
    this.setData(updated);
  }

  public getAll() {
    return this._data$.getValue() ?? [];
  }
}

export class ProjectBoardViewModel extends BaseViewModel<ProjectCollectionModel> {
  constructor() {
    const seedProjects: ProjectSnapshot[] = [
      createProject({
        name: 'Apollo Launch',
        description: 'Move analytics pipelines into the TaskFlow platform ahead of the release.',
        color: '#22d3ee',
        status: 'In Progress',
        tasks: 27,
        completed: 11
      }),
      createProject({
        name: 'Atlas Migration',
        description: 'Rehost dashboards with Web Loom MVVM services and plugin support.',
        color: '#818cf8',
        status: 'Review',
        tasks: 18,
        completed: 14
      }),
      createProject({
        name: 'Comet Calendar',
        description: 'Prototype an offline-first calendar plugin with shared scheduling.',
        color: '#fb7185',
        status: 'Backlog',
        tasks: 12,
        completed: 3
      })
    ];

    super(new ProjectCollectionModel(seedProjects));
  }

  public cycleProjectStatus(projectId: string) {
    const current = this.model.getAll();
    const project = current.find((item) => item.id === projectId);
    if (!project) {
      return;
    }
    const nextIndex = (STATUSES.indexOf(project.status) + 1) % STATUSES.length;
    this.model.updateStatus(projectId, STATUSES[nextIndex]);
  }

  public addProject() {
    const project = createProject({
      name: 'New TaskFlow Sprint',
      description: 'Capture the next plugin experience for the demo.',
      status: 'Backlog'
    });
    this.model.addProject(project);
  }

  public getStatusSummary() {
    const all = this.model.getAll();
    return STATUSES.map((status) => ({
      status,
      count: all.filter((project) => project.status === status).length
    }));
  }
}
