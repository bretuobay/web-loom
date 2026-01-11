import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/client';

export const PROJECT_STATUSES = ['planning', 'active', 'paused', 'completed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface ProjectAttributes {
  id: string;
  name: string;
  description: string;
  color: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectCreationAttributes
  extends Optional<ProjectAttributes, 'id' | 'createdAt' | 'updatedAt' | 'description' | 'color' | 'status'> {}

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  declare id: string;
  declare name: string;
  declare description: string;
  declare color: string;
  declare status: ProjectStatus;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '#60a5fa'
    },
    status: {
      type: DataTypes.ENUM(...PROJECT_STATUSES),
      allowNull: false,
      defaultValue: 'planning'
    }
  },
  {
    sequelize,
    tableName: 'projects',
    timestamps: true
  }
);
