import { DataTypes, QueryInterface, QueryTypes, Sequelize, Transaction, UniqueConstraintError } from 'sequelize';

const MIGRATION_TABLE = 'migrations_meta';

interface MigrationRecord {
  version: number;
  name: string;
  executedAt: Date;
}

export interface Migration {
  version: number;
  name: string;
  up: (queryInterface: QueryInterface, sequelize: Sequelize, transaction: Transaction) => Promise<void>;
}

const normalizeTableName = (entry: string | { tableName: string }): string =>
  typeof entry === 'string' ? entry : entry.tableName;

async function ensureMigrationTable(queryInterface: QueryInterface, sequelize: Sequelize) {
  const tables = await queryInterface.showAllTables();
  const names = tables.map(normalizeTableName);
  if (!names.includes(MIGRATION_TABLE)) {
    await queryInterface.createTable(MIGRATION_TABLE, {
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      executedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
  }
}

async function readExecutedMigrations(sequelize: Sequelize): Promise<Set<number>> {
  const [records] = await sequelize.query(`SELECT version FROM ${MIGRATION_TABLE}`, {
    type: QueryTypes.SELECT,
  });
  if (!Array.isArray(records)) {
    return new Set();
  }

  const versions = new Set<number>();
  for (const row of records as Record<string, unknown>[]) {
    const value = row.version ?? row['version'];
    const version =
      typeof value === 'string' ? Number.parseInt(value, 10) : typeof value === 'number' ? value : undefined;

    if (version !== undefined && !Number.isNaN(version)) {
      versions.add(version);
    }
  }

  return versions;
}

export async function runMigrations(sequelize: Sequelize, migrations: Migration[]) {
  const queryInterface = sequelize.getQueryInterface();
  await ensureMigrationTable(queryInterface, sequelize);
  const executed = await readExecutedMigrations(sequelize);

  const sortedMigrations = [...migrations].sort((a, b) => a.version - b.version);
  for (const migration of sortedMigrations) {
    if (executed.has(migration.version)) {
      continue;
    }

    await queryInterface.sequelize.transaction(async (transaction: Transaction) => {
      await migration.up(queryInterface, sequelize, transaction);
      try {
        await queryInterface.bulkInsert(
          MIGRATION_TABLE,
          [
            {
              version: migration.version,
              name: migration.name,
              executedAt: new Date(),
            },
          ],
          { transaction },
        );
      } catch (error) {
        if (error instanceof UniqueConstraintError) {
          const versionConflict = Array.isArray(error.fields) && error.fields.includes('version');
          const versionFieldExists =
            typeof error.fields === 'object' &&
            !Array.isArray(error.fields) &&
            Object.prototype.hasOwnProperty.call(error.fields, 'version');

          if (versionConflict || versionFieldExists) {
            return;
          }
        }
        throw error;
      }
    });
  }
}
