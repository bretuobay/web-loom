import { PROJECT_STATUSES, type ProjectStatus } from '../values/projectStatus';
import { TaskEntity, type TaskApiResponse } from './task';

export interface ProjectApiResponse {
  id: string;
  name: string;
  description: string;
  color: string;
  status: ProjectStatus | (string & {});
  tasks?: TaskApiResponse[];
}

type ProjectProps = {
  id: string;
  name: string;
  description: string;
  color: string;
  status: ProjectStatus;
  tasks: TaskEntity[];
};

export class ProjectEntity {
  readonly props: ProjectProps;

  constructor(props: ProjectProps) {
    this.props = props;
  }

  get id() {
    return this.props.id;
  }

  get name() {
    return this.props.name;
  }

  get description() {
    return this.props.description;
  }

  get color() {
    return this.props.color;
  }

  get status(): ProjectStatus {
    return this.props.status;
  }

  get tasks() {
    return this.props.tasks;
  }

  get tasksCount() {
    return this.tasks.length;
  }

  get completedCount() {
    return this.tasks.filter((task) => task.isDone).length;
  }

  static fromApi(payload: ProjectApiResponse) {
    const status = PROJECT_STATUSES.includes(payload.status as ProjectStatus)
      ? (payload.status as ProjectStatus)
      : PROJECT_STATUSES[0];

    const tasks = (payload.tasks ?? []).map(TaskEntity.fromApi);

    return new ProjectEntity({
      id: payload.id,
      name: payload.name,
      description: payload.description,
      color: payload.color,
      status,
      tasks
    });
  }

  static createDraft(overrides: Partial<ProjectProps> = {}) {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `project-${Math.random()}`;
    return new ProjectEntity({
      id,
      name: 'New TaskFlow project',
      description: 'Pilot the next plugin experience.',
      color: '#38bdf8',
      status: PROJECT_STATUSES[0],
      tasks: [],
      ...overrides
    });
  }

  withStatus(status: ProjectStatus) {
    return new ProjectEntity({ ...this.props, status });
  }

  withTasks(tasks: TaskEntity[]) {
    return new ProjectEntity({ ...this.props, tasks });
  }
}
