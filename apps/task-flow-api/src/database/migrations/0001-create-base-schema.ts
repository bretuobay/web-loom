import { Migration } from './runner';
import { QueryInterface, Sequelize } from 'sequelize';

const PROJECT_STATUSES = ['planning', 'active', 'paused', 'completed'] as const;
const TASK_STATUSES = ['backlog', 'in-progress', 'review', 'done'] as const;
const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
const USER_ROLES = ['member', 'admin'] as const;

const createTableOptions = (queryInterface: QueryInterface, name: string, columns: Record<string, unknown>, transaction: Sequelize.Transaction) =>
  queryInterface.createTable(name, columns, { transaction });

const migration: Migration = {
  version: 1,
  name: 'create-base-schema',
  up: async (queryInterface, sequelize, transaction) => {
    await createTableOptions(queryInterface, 'projects', {
      id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.DataTypes.UUIDV4
      },
      name: {
        type: Sequelize.DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
      },
      color: {
        type: Sequelize.DataTypes.STRING(24),
        allowNull: false,
        defaultValue: '#60a5fa'
      },
      status: {
        type: Sequelize.DataTypes.ENUM(...PROJECT_STATUSES),
        allowNull: false,
        defaultValue: PROJECT_STATUSES[0]
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, transaction);

    await createTableOptions(queryInterface, 'users', {
      id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.DataTypes.UUIDV4
      },
      email: {
        type: Sequelize.DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      displayName: {
        type: Sequelize.DataTypes.STRING(120),
        allowNull: false
      },
      passwordHash: {
        type: Sequelize.DataTypes.STRING(255),
        allowNull: false
      },
      avatarUrl: {
        type: Sequelize.DataTypes.STRING(255),
        allowNull: true
      },
      role: {
        type: Sequelize.DataTypes.ENUM(...USER_ROLES),
        allowNull: false,
        defaultValue: USER_ROLES[0]
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, transaction);

    await createTableOptions(queryInterface, 'tasks', {
      id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.DataTypes.UUIDV4
      },
      title: {
        type: Sequelize.DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
      },
      assigneeName: {
        field: 'assignee',
        type: Sequelize.DataTypes.STRING(120),
        allowNull: false,
        defaultValue: 'Unassigned'
      },
      status: {
        type: Sequelize.DataTypes.ENUM(...TASK_STATUSES),
        allowNull: false,
        defaultValue: TASK_STATUSES[0]
      },
      priority: {
        type: Sequelize.DataTypes.ENUM(...TASK_PRIORITIES),
        allowNull: false,
        defaultValue: TASK_PRIORITIES[1]
      },
      dueDate: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true
      },
      projectId: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      assigneeId: {
        type: Sequelize.DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, transaction);

    await createTableOptions(queryInterface, 'comments', {
      id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.DataTypes.UUIDV4
      },
      content: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      taskId: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      authorId: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, transaction);
  }
};

export default migration;
