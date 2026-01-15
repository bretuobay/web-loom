import { Migration } from './runner.js';
import migration1 from './0001-create-base-schema.js';
import migration2 from './0002-add-assignee-id.js';
import migration3 from './0003-create-attachments.js';

export const migrations: Migration[] = [migration1, migration2, migration3];
