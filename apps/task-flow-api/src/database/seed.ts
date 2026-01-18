import bcrypt from 'bcryptjs';
import { Project } from '../models/project.model.js';
import { Task, TASK_PRIORITIES, TASK_STATUSES } from '../models/task.model.js';
import { User } from '../models/user.model.js';
import { Comment } from '../models/comment.model.js';
import { Attachment } from '../models/attachment.model.js';
import { Todo } from '../models/todo.model.js';

const sampleProjects = [
  {
    name: 'Apollo Launch',
    description: 'Prepare a launch-ready project management dashboard for the Apollo program.',
    color: '#2563eb',
    status: 'active' as const,
  },
  {
    name: 'Atlas Migration',
    description: 'Move Atlas analytics to the new Web Loom platform before Q3.',
    color: '#0ea5e9',
    status: 'planning' as const,
  },
  {
    name: 'Comet Calendar',
    description: 'Design a collaborative calendar plugin for space-planning teams.',
    color: '#16a34a',
    status: 'paused' as const,
  },
];

const sampleUsers = [
  {
    email: 'admin@taskflow.local',
    displayName: 'Ivy Turing',
    password: 'supersecure',
    role: 'admin' as const,
    avatarUrl: 'https://i.pravatar.cc/48?img=3',
  },
  {
    email: 'maia@taskflow.local',
    displayName: 'Maia Rivera',
    password: 'maia1234',
    role: 'member' as const,
    avatarUrl: 'https://i.pravatar.cc/48?img=12',
  },
  {
    email: 'leo@taskflow.local',
    displayName: 'Leo Mateo',
    password: 'leoBuilds',
    role: 'member' as const,
    avatarUrl: 'https://i.pravatar.cc/48?img=15',
  },
];

const sampleTasks = [
  {
    title: 'Design Kanban layout',
    description: 'Wireframe the Kanban plugin and define swimlane states.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
  },
  {
    title: 'Review API contracts',
    description: 'Validate TaskFlow API routes with the new OpenAPI generator.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  },
  {
    title: 'Finalize plugin manifest',
    description: 'Document metadata and dependencies for the Kanban widget.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
  },
];

const sampleComments = [
  'Can we add a filter to highlight overdue tasks?',
  'Love the color palette, but let us keep accessibility tokens in mind.',
  'Let’s make sure the plugin manifest includes analytics metadata as part of the release.',
];

const sampleTodos = [
  {
    title: 'Write release notes',
    details: 'Summarize TaskFlow updates and the new TODO workspace.',
    daysFromNow: 0,
  },
  {
    title: 'Review plugin telemetry',
    details: 'Check that the plugin registry metrics match the dashboard.',
    daysFromNow: 1,
  },
  {
    title: 'Refine onboarding guide',
    details: 'Document MVVM tips for new contributors.',
    daysFromNow: 2,
  },
];

export const seedInitialData = async () => {
  const existingUsers = await User.count();
  if (existingUsers > 0) {
    return;
  }

  const existingProjects = await Project.count();
  if (existingProjects > 0) {
    await Attachment.destroy({ where: {}, truncate: true, cascade: true });
    await Comment.destroy({ where: {}, truncate: true, cascade: true });
    await Task.destroy({ where: {}, truncate: true, cascade: true });
    await Todo.destroy({ where: {}, truncate: true, cascade: true });
    await Project.destroy({ where: {}, truncate: true, cascade: true });
  }

  const createdUsers: User[] = [];
  for (const entry of sampleUsers) {
    const passwordHash = await bcrypt.hash(entry.password, 10);
    const user = await User.create({
      email: entry.email,
      displayName: entry.displayName,
      role: entry.role,
      avatarUrl: entry.avatarUrl,
      passwordHash,
    });
    createdUsers.push(user);
  }

  const createdProjects: Project[] = [];
  for (const entry of sampleProjects) {
    const project = await Project.create(entry);
    createdProjects.push(project);
  }

  const createdTasks = [];
  for (const taskTemplate of sampleTasks) {
    const project = createdProjects[Math.floor(Math.random() * createdProjects.length)];
    const assignee = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const task = await Task.create({
      ...taskTemplate,
      status: TASK_STATUSES[Math.floor(Math.random() * TASK_STATUSES.length)],
      priority: TASK_PRIORITIES[Math.floor(Math.random() * TASK_PRIORITIES.length)],
      projectId: project.id,
      assigneeName: assignee.displayName,
      assigneeId: assignee.id,
    });
    createdTasks.push(task);
  }

  for (const comment of sampleComments) {
    const task = createdTasks[Math.floor(Math.random() * createdTasks.length)];
    const author = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    await Comment.create({
      content: comment,
      taskId: task.id,
      authorId: author.id,
    });
  }

  for (const todoTemplate of sampleTodos) {
    const owner = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    await Todo.create({
      title: todoTemplate.title,
      details: todoTemplate.details,
      userId: owner.id,
      dueDate: new Date(Date.now() + todoTemplate.daysFromNow * 86400000),
    });
  }
};
