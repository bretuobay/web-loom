import { Migration } from './runner.js';
import { DataTypes, QueryInterface, Sequelize, Transaction } from 'sequelize';

const migration: Migration = {
  version: 2,
  name: 'add-assignee-id-to-tasks',
  up: async (queryInterface: QueryInterface, sequelize: Sequelize, transaction: Transaction) => {
    const schema = await queryInterface.describeTable('tasks');
    if (schema.assigneeId) {
      return;
    }

    await queryInterface.addColumn(
      'tasks',
      'assigneeId',
      {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      { transaction },
    );
  },
};

export default migration;
