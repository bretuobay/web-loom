import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/client.js';

export interface CommentAttributes {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CommentCreationAttributes extends Optional<CommentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
  declare id: string;
  declare content: string;
  declare taskId: string;
  declare authorId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Comment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'comments',
    timestamps: true,
  },
);
