import { isRef, ref, type Ref } from 'vue';

export type MaybeRef<T> = T | Ref<T>;

export function toReactiveRef<T>(value?: MaybeRef<T>): Ref<T> {
  if (isRef(value)) {
    return value as Ref<T>;
  }
  return ref(value as T) as Ref<T>;
}
