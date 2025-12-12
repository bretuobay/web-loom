import { useMemo } from 'react';
import { useFieldArray } from '@web-loom/forms-react';
import { cn } from '../../utils/cn';
import styles from './Form.module.css';
import type { FormListProps, FormListOperations } from './types';

export function FormList({ name, children, className, style }: FormListProps) {
  const {
    fields,
    append,
    prepend,
    insert,
    remove,
    move,
    swap,
    replace,
    clear,
  } = useFieldArray(name);

  const operations = useMemo<FormListOperations>(
    () => ({ append, prepend, insert, remove, move, swap, replace, clear }),
    [append, prepend, insert, remove, move, swap, replace, clear],
  );

  return (
    <div className={cn(styles.list, className)} style={style}>
      {children(fields, operations)}
    </div>
  );
}
