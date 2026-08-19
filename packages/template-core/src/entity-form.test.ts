import { describe, expect, it, vi } from 'vitest';
import { createEntityForm, type EntityFormCommands } from './entity-form.js';

interface Greenhouse {
  id: string;
  name: string;
  location: string;
}

function makeCommands(): EntityFormCommands<Greenhouse> & {
  createCommand: { execute: ReturnType<typeof vi.fn> };
  updateCommand: { execute: ReturnType<typeof vi.fn> };
  deleteCommand: { execute: ReturnType<typeof vi.fn> };
} {
  return {
    createCommand: { execute: vi.fn().mockResolvedValue(undefined) },
    updateCommand: { execute: vi.fn().mockResolvedValue(undefined) },
    deleteCommand: { execute: vi.fn().mockResolvedValue(undefined) },
  };
}

const FIELDS = ['name', 'location'] as const;

describe('createEntityForm', () => {
  it('creates when no entity is being edited, then resets', async () => {
    const vm = makeCommands();
    const form = createEntityForm(vm, FIELDS);

    form.fields.name.set('  North Wing ');
    form.fields.location.set('Lot 4');
    await form.submit();

    expect(vm.createCommand.execute).toHaveBeenCalledWith({ name: 'North Wing', location: 'Lot 4' });
    expect(vm.updateCommand.execute).not.toHaveBeenCalled();
    expect(form.fields.name.get()).toBe('');
    expect(form.editingId$.get()).toBeNull();
  });

  it('updates the edited entity and leaves edit mode after submit', async () => {
    const vm = makeCommands();
    const form = createEntityForm(vm, FIELDS);

    form.edit({ id: 'gh-1', name: 'North Wing', location: 'Lot 4' });
    expect(form.fields.name.get()).toBe('North Wing');
    expect(form.isEditing$.get()).toBe(true);

    form.fields.location.set('Lot 9');
    await form.submit();

    expect(vm.updateCommand.execute).toHaveBeenCalledWith({
      id: 'gh-1',
      payload: { name: 'North Wing', location: 'Lot 9' },
    });
    expect(vm.createCommand.execute).not.toHaveBeenCalled();
    expect(form.isEditing$.get()).toBe(false);
  });

  it('deletes an entity and resets only when it was being edited', async () => {
    const vm = makeCommands();
    const form = createEntityForm(vm, FIELDS);

    form.edit({ id: 'gh-1', name: 'North Wing', location: 'Lot 4' });
    await form.remove({ id: 'gh-2', name: 'Other', location: 'Lot 5' });
    expect(vm.deleteCommand.execute).toHaveBeenCalledWith('gh-2');
    expect(form.editingId$.get()).toBe('gh-1');

    await form.remove({ id: 'gh-1', name: 'North Wing', location: 'Lot 4' });
    expect(form.editingId$.get()).toBeNull();
    expect(form.fields.name.get()).toBe('');
  });

  it('keeps field values and reports through onError when submit rejects', async () => {
    const vm = makeCommands();
    const failure = new Error('offline');
    vm.createCommand.execute.mockRejectedValue(failure);
    const onError = vi.fn();
    const form = createEntityForm(vm, FIELDS, { onError });

    form.fields.name.set('North Wing');
    await form.submit();

    expect(onError).toHaveBeenCalledWith(failure);
    expect(form.fields.name.get()).toBe('North Wing');
  });

  it('applies custom toPayload and fromEntity mappings', async () => {
    const vm = makeCommands();
    const form = createEntityForm(vm, FIELDS, {
      toPayload: (values) => ({ name: values.name.toUpperCase(), location: values.location }),
      fromEntity: (entity) => ({ name: entity.name.toLowerCase(), location: entity.location }),
    });

    form.edit({ id: 'gh-1', name: 'North Wing', location: 'Lot 4' });
    expect(form.fields.name.get()).toBe('north wing');

    await form.submit();
    expect(vm.updateCommand.execute).toHaveBeenCalledWith({
      id: 'gh-1',
      payload: { name: 'NORTH WING', location: 'Lot 4' },
    });
  });
});
