import { Migration } from './runner.js';
import { DataTypes, QueryInterface, Sequelize, Transaction } from 'sequelize';

const migration: Migration = {
  version: 5,
  name: 'create-todos',
  up: async (queryInterface: QueryInterface, sequelize: Sequelize, transaction: Transaction) => {
    await queryInterface.createTable(
      'todos',
      {
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
          defaultValue: Sequelize.literal('CURRENT_DATE')
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE',
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
      },
      { transaction }
    );
  }
};

export default migration;
