import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/client.js';
import { config } from '../config/index.js';

export interface AttachmentAttributes {
  id: string;
  taskId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  downloadUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AttachmentCreationAttributes
  extends Optional<AttachmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Attachment
  extends Model<AttachmentAttributes, AttachmentCreationAttributes>
  implements AttachmentAttributes
{
  declare id: string;
  declare taskId: string;
  declare originalName: string;
  declare storedName: string;
  declare mimeType: string;
  declare size: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare downloadUrl: string | null;

  toJSON() {
    const values = { ...super.toJSON() } as Record<string, unknown>;
    delete values.storedName;
    return values;
  }
}

Attachment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    storedName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    mimeType: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    size: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    downloadUrl: {
      type: DataTypes.VIRTUAL,
      get() {
        const storedName = this.getDataValue('storedName');
        if (!storedName) {
          return null;
        }
        return `${config.app.baseUrl}/uploads/${storedName}`;
      }
    }
  },
  {
    sequelize,
    tableName: 'attachments',
    timestamps: true
  }
);
