import { computed, signal, type ReadonlySignal, type WritableSignal } from '@web-loom/signals-core';

/**
 * The command surface an entity form drives. Structurally compatible with
 * `mvvm-core`'s `RestfulApiViewModel` — kept structural so template-core does
 * not depend on `mvvm-core` (mirroring the integration-test contract).
 */
export interface EntityFormCommands<TEntity> {
  createCommand: { execute(input: Partial<TEntity>): Promise<unknown> };
  updateCommand: { execute(input: { id: string; payload: Partial<TEntity> }): Promise<unknown> };
  deleteCommand: { execute(id: string): Promise<unknown> };
}

export interface EntityFormOptions<TEntity, TField extends string> {
  /** Maps the raw string field signals to the command payload. Defaults to the values as-is. */
  toPayload?: (values: Record<TField, string>) => Partial<TEntity>;
  /** Maps an entity being edited into the string field values. Defaults to `String(entity[field])`. */
  fromEntity?: (entity: TEntity) => Record<TField, string>;
  /** Called when submit/remove commands reject. Defaults to `console.error`. */
  onError?: (error: unknown) => void;
}

export interface EntityForm<TEntity, TField extends string> {
  /** One writable string signal per field — the `bind:value` targets. */
  fields: Record<TField, WritableSignal<string>>;
  editingId$: WritableSignal<string | null>;
  isEditing$: ReadonlySignal<boolean>;
  /** Creates or updates depending on `editingId$`, then resets the form. */
  submit(): Promise<void>;
  /** Loads an entity into the fields and switches submit to update mode. */
  edit(entity: TEntity): void;
  remove(entity: TEntity): Promise<void>;
  reset(): void;
}

/**
 * Derives a complete CRUD form (field signals + submit/edit/remove/reset)
 * from a ViewModel's commands, replacing the per-entity hand-written
 * form-state class. All members are bound, so templates can reference them
 * directly (`on:submit.prevent="greenhouseForm.submit"`).
 */
export function createEntityForm<TEntity extends { id: string }, TField extends string>(
  vm: EntityFormCommands<TEntity>,
  fieldNames: readonly TField[],
  options: EntityFormOptions<TEntity, TField> = {},
): EntityForm<TEntity, TField> {
  const onError = options.onError ?? ((error: unknown) => console.error('[entity-form]', error));

  const fields = {} as Record<TField, WritableSignal<string>>;
  for (const name of fieldNames) {
    fields[name] = signal('');
  }

  const editingId$ = signal<string | null>(null);
  const isEditing$ = computed(() => editingId$.get() !== null);

  const readValues = (): Record<TField, string> => {
    const values = {} as Record<TField, string>;
    for (const name of fieldNames) {
      values[name] = fields[name].peek().trim();
    }
    return values;
  };

  const reset = (): void => {
    for (const name of fieldNames) {
      fields[name].set('');
    }
    editingId$.set(null);
  };

  const toPayload = options.toPayload ?? ((values: Record<TField, string>) => values as Partial<TEntity>);

  const fromEntity =
    options.fromEntity ??
    ((entity: TEntity): Record<TField, string> => {
      const values = {} as Record<TField, string>;
      for (const name of fieldNames) {
        const raw = (entity as Record<string, unknown>)[name];
        values[name] = raw === undefined || raw === null ? '' : String(raw);
      }
      return values;
    });

  const submit = async (): Promise<void> => {
    const payload = toPayload(readValues());
    const id = editingId$.peek();
    try {
      if (id === null) {
        await vm.createCommand.execute(payload);
      } else {
        await vm.updateCommand.execute({ id, payload });
      }
      reset();
    } catch (error) {
      onError(error);
    }
  };

  const edit = (entity: TEntity): void => {
    const values = fromEntity(entity);
    for (const name of fieldNames) {
      fields[name].set(values[name] ?? '');
    }
    editingId$.set(entity.id);
  };

  const remove = async (entity: TEntity): Promise<void> => {
    try {
      await vm.deleteCommand.execute(entity.id);
    } catch (error) {
      onError(error);
    }
    if (editingId$.peek() === entity.id) {
      reset();
    }
  };

  return { fields, editingId$, isEditing$, submit, edit, remove, reset };
}
