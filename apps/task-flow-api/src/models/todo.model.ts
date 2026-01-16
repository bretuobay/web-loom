import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/client.js';

export interface TodoAttributes {
  id: string;
  title: string;
  details: string;
  completed: boolean;
  dueDate: Date;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TodoCreationAttributes
  extends Optional<TodoAttributes, 'id' | 'details' | 'completed' | 'dueDate' | 'createdAt' | 'updatedAt'> {}

export class Todo extends Model<TodoAttributes, TodoCreationAttributes> implements TodoAttributes {
  declare id: string;
  declare title: string;
  declare details: string;
  declare completed: boolean;
  declare dueDate: Date;
  declare userId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Todo.init(
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
    details: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_DATE')
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'todos',
    timestamps: true
  }
);
