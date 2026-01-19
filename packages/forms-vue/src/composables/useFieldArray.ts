import { computed } from 'vue';
import { useFormContext } from '../components/FormProvider';
import { useFormSubscription } from './useFormSubscription';
import type { UseFieldArrayReturn } from '../types';

/**
 * Vue composable for field array management
 */
export function useFieldArray<TItem = unknown>(name: string): UseFieldArrayReturn<TItem> {
  const { form } = useFormContext();

  // Subscribe to array field value
  const values = useFormSubscription(form, (_state) => {
    const arrayValue = form.getFieldValue(name);
    return Array.isArray(arrayValue) ? arrayValue : [];
  });

  // Create fields with stable keys
  const fields = computed(() => {
    return values.value.map((item: TItem, index: number) => ({
      ...item,
      id: `${name}.${index}`,
      key: `${name}.${index}`,
    }));
  });

  const updateArray = (newValues: TItem[]) => {
    form.setFieldValue(name, newValues);
  };

  const append = (item: TItem) => {
    const currentValues = [...values.value, item];
    updateArray(currentValues);
  };

  const prepend = (item: TItem) => {
    const currentValues = [item, ...values.value];
    updateArray(currentValues);
  };

  const insert = (index: number, item: TItem) => {
    const currentValues = [...values.value];
    currentValues.splice(index, 0, item);
    updateArray(currentValues);
  };

  const remove = (index: number) => {
    const currentValues = [...values.value];
    currentValues.splice(index, 1);
    updateArray(currentValues);
  };

  const move = (fromIndex: number, toIndex: number) => {
    const currentValues = [...values.value];
    const [movedItem] = currentValues.splice(fromIndex, 1);
    currentValues.splice(toIndex, 0, movedItem);
    updateArray(currentValues);
  };

  const swap = (indexA: number, indexB: number) => {
    const currentValues = [...values.value];
    [currentValues[indexA], currentValues[indexB]] = [currentValues[indexB], currentValues[indexA]];
    updateArray(currentValues);
  };

  const replace = (items: TItem[]) => {
    updateArray([...items]);
  };

  const clear = () => {
    updateArray([]);
  };

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
