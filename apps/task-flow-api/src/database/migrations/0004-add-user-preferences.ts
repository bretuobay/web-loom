import { Migration } from './runner.js';
import { DataTypes, QueryInterface, Sequelize, Transaction } from 'sequelize';

const migration: Migration = {
  version: 4,
  name: 'add-user-preferences',
  up: async (queryInterface: QueryInterface, sequelize: Sequelize, transaction: Transaction) => {
    const schema = await queryInterface.describeTable('users');
    if (schema.preferences) {
      return;
    }

    await queryInterface.addColumn(
      'users',
      'preferences',
      {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
      },
      { transaction }
    );
  }
};

export default migration;
