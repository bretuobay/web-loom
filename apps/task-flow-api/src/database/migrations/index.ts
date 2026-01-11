import { Migration } from './runner';
import migration1 from './0001-create-base-schema';

export const migrations: Migration[] = [migration1];
