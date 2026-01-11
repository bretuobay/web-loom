import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/client';

export const TASK_STATUSES = ['backlog', 'in-progress', 'review', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface TaskAttributes {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeName: string;
  assigneeId: string | null;
  dueDate: Date | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskCreationAttributes
  extends Optional<TaskAttributes, 'id' | 'dueDate' | 'createdAt' | 'updatedAt' | 'assigneeName' | 'assigneeId'> {}

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  declare id: string;
  declare title: string;
  declare description: string;
  declare status: TaskStatus;
  declare priority: TaskPriority;
  declare assigneeName: string;
  declare assigneeId: string | null;
  declare dueDate: Date | null;
  declare projectId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
    status: {
      type: DataTypes.ENUM(...TASK_STATUSES),
      allowNull: false,
      defaultValue: 'backlog'
    },
    priority: {
      type: DataTypes.ENUM(...TASK_PRIORITIES),
      allowNull: false,
      defaultValue: 'medium'
    },
    assigneeName: {
      field: 'assignee',
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: 'Unassigned'
    },
    assigneeId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'tasks',
    timestamps: true
  }
);
