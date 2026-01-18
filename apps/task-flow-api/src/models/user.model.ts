import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/client.js';

export const USER_ROLES = ['member', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface UserPreferences {
  theme?: 'light' | 'dark';
}

export interface UserAttributes {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  avatarUrl: string | null;
  role: UserRole;
  preferences: UserPreferences | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<
  UserAttributes,
  'id' | 'avatarUrl' | 'role' | 'createdAt' | 'updatedAt' | 'passwordHash'
> {
  password?: string;
}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare displayName: string;
  declare passwordHash: string;
  declare avatarUrl: string | null;
  declare role: UserRole;
  declare preferences: UserPreferences | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    displayName: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    avatarUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    role: {
      type: DataTypes.ENUM(...USER_ROLES),
      allowNull: false,
      defaultValue: USER_ROLES[0],
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  },
);
