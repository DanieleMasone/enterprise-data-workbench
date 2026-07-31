import { describe, expect, it } from 'vitest';
import { createInitialWorkspace } from '../data/initialWorkspace';
import { DexieWorkspacePersistence } from './persistence.service';

describe('Dexie workspace persistence', () => {
  it('saves and loads the persisted workspace document', async () => {
    const persistence = new DexieWorkspacePersistence(
      `test-db-${crypto.randomUUID()}`,
      'workspace',
    );
    const workspace = createInitialWorkspace();

    await persistence.save(workspace);
    const loaded = await persistence.load();

    expect(loaded?.records).toHaveLength(workspace.records.length);
    expect(loaded?.fieldOrder).toEqual(workspace.fieldOrder);
  });
});
