import { useCallback, useMemo } from 'react';
import { useFormContext } from '../components/FormProvider';
import { useFormSubscription } from './useFormSubscription';
import type { UseFieldArrayReturn } from '../types';

/**
 * Generate unique ID for array items
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * React hook for field array management
 */
export function useFieldArray<TItem = unknown>(name: string): UseFieldArrayReturn<TItem> {
  const { form } = useFormContext();

  // Subscribe to array field value
  const values = useFormSubscription(
    form,
    useCallback(
      (state) => {
        const arrayValue = form.getFieldValue(name);
        return Array.isArray(arrayValue) ? arrayValue : [];
      },
      [form, name],
    ),
  ) as TItem[];

  // Create fields with stable keys
  const fields = useMemo(() => {
    return values.map((item, index) => ({
      ...item,
      id: `${name}.${index}`,
      key: `${name}.${index}`,
    }));
  }, [values, name]);

  const updateArray = useCallback(
    (newValues: TItem[]) => {
      form.setFieldValue(name, newValues);
    },
    [form, name],
  );

  const append = useCallback(
    (item: TItem) => {
      const currentValues = [...values, item];
      updateArray(currentValues);
    },
    [values, updateArray],
  );

  const prepend = useCallback(
    (item: TItem) => {
      const currentValues = [item, ...values];
      updateArray(currentValues);
    },
    [values, updateArray],
  );

  const insert = useCallback(
    (index: number, item: TItem) => {
      const currentValues = [...values];
      currentValues.splice(index, 0, item);
      updateArray(currentValues);
    },
    [values, updateArray],
  );

  const remove = useCallback(
    (index: number) => {
      const currentValues = [...values];
      currentValues.splice(index, 1);
      updateArray(currentValues);
    },
    [values, updateArray],
  );

  const move = useCallback(
    (fromIndex: number, toIndex: number) => {
      const currentValues = [...values];
      const [movedItem] = currentValues.splice(fromIndex, 1);
      if (movedItem !== undefined) {
        currentValues.splice(toIndex, 0, movedItem);
      }
      updateArray(currentValues);
    },
    [values, updateArray],
  );

  const swap = useCallback(
    (indexA: number, indexB: number) => {
      const currentValues = [...values];
      const itemA = currentValues[indexA];
      const itemB = currentValues[indexB];
      if (itemA !== undefined && itemB !== undefined) {
        currentValues[indexA] = itemB;
        currentValues[indexB] = itemA;
      }
      updateArray(currentValues);
    },
    [values, updateArray],
  );

  const replace = useCallback(
    (items: TItem[]) => {
      updateArray([...items]);
    },
    [updateArray],
  );

  const clear = useCallback(() => {
    updateArray([]);
  }, [updateArray]);

  return {
    fields,
    append,
    prepend,
    insert,
    remove,
    move,
    swap,
    replace,
    clear,
  };
}
