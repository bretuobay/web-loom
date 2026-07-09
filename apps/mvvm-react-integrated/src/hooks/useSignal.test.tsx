import { act, render, screen } from '@testing-library/react';
import { computed, signal } from '@web-loom/signals-core';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { useSignal } from './useSignal';

describe('useSignal', () => {
  it('reads and subscribes to computed signals without losing method context', () => {
    const count = signal(1);
    const doubled = computed(() => count.get() * 2);

    function TestComponent() {
      const value = useSignal(doubled);
      return <span>{value}</span>;
    }

    render(<TestComponent />);

    expect(screen.getByText('2')).toBeInTheDocument();

    act(() => {
      count.set(3);
    });

    expect(screen.getByText('6')).toBeInTheDocument();
  });
});
