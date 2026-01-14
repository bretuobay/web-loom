import { Migration } from './runner.js';
import { DataTypes, QueryInterface, Sequelize, Transaction } from 'sequelize';

const PROJECT_STATUSES = ['planning', 'active', 'paused', 'completed'] as const;
const TASK_STATUSES = ['backlog', 'in-progress', 'review', 'done'] as const;
const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
const USER_ROLES = ['member', 'admin'] as const;

const createTableOptions = (
  queryInterface: QueryInterface,
  name: string,
  columns: Parameters<QueryInterface['createTable']>[1],
  transaction: Transaction
) => queryInterface.createTable(name, columns, { transaction });

const migration: Migration = {
  version: 1,
  name: 'create-base-schema',
  up: async (queryInterface, sequelize, transaction) => {
    await createTableOptions(queryInterface, 'projects', {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
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
        type: DataTypes.STRING(24),
        allowNull: false,
        defaultValue: '#60a5fa'
      },
      status: {
        type: DataTypes.ENUM(...PROJECT_STATUSES),
        allowNull: false,
        defaultValue: PROJECT_STATUSES[0]
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, transaction);

    await createTableOptions(queryInterface, 'users', {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      displayName: {
        type: DataTypes.STRING(120),
        allowNull: false
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      avatarUrl: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      role: {
        type: DataTypes.ENUM(...USER_ROLES),
        allowNull: false,
        defaultValue: USER_ROLES[0]
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, transaction);

    await createTableOptions(queryInterface, 'tasks', {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
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
      assigneeName: {
        field: 'assignee',
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: 'Unassigned'
      },
      status: {
        type: DataTypes.ENUM(...TASK_STATUSES),
        allowNull: false,
        defaultValue: TASK_STATUSES[0]
      },
      priority: {
        type: DataTypes.ENUM(...TASK_PRIORITIES),
        allowNull: false,
        defaultValue: TASK_PRIORITIES[1]
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      assigneeId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, transaction);

    await createTableOptions(queryInterface, 'comments', {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      taskId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      authorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, transaction);
  }
};

export default migration;
