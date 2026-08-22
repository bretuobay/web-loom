import { cleanup, render } from '@solidjs/testing-library';
import { computed, signal } from '@web-loom/signals-core';
import { afterEach, describe, expect, it } from 'vitest';
import { useSignal } from './useSignal';

afterEach(() => cleanup());

describe('useSignal', () => {
  it('mirrors loom signals into Solid accessors, including computed values', () => {
    const count = signal(1);
    const doubled = computed(() => count.get() * 2);

    function TestComponent() {
      const value = useSignal(doubled);
      return <span>{value()}</span>;
    }

    const { getByText } = render(() => <TestComponent />);
    expect(getByText('2')).toBeTruthy();

    count.set(3);
    expect(getByText('6')).toBeTruthy();
  });

  it('stores array values instead of treating them as Solid updater functions', () => {
    const items = signal<string[]>(['a']);

    function TestComponent() {
      const value = useSignal(items);
      return <span>{value().join(',')}</span>;
    }

    const { getByText } = render(() => <TestComponent />);
    expect(getByText('a')).toBeTruthy();

    items.set(['a', 'b']);
    expect(getByText('a,b')).toBeTruthy();
  });
});
