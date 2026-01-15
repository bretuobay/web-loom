import { Migration } from './runner.js';
import { DataTypes, QueryInterface, Sequelize, Transaction } from 'sequelize';

const migration: Migration = {
  version: 3,
  name: 'create-attachments-table',
  up: async (queryInterface: QueryInterface, sequelize: Sequelize, transaction: Transaction) => {
    const schema = await queryInterface.describeTable('attachments').catch(() => null);
    if (schema && schema.originalName) {
      return;
    }

    await queryInterface.createTable(
      'attachments',
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4
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
      },
      { transaction }
    );
  }
};

export default migration;
