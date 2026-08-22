import { cleanup, render } from '@solidjs/testing-library';
import { MemoryRouter, Route } from '@solidjs/router';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@repo/view-models/GreenHouseViewModel', () => {
  const mockData = [
    { id: '1', name: 'Greenhouse 1', location: 'Location 1', size: '25sqm', cropType: 'Tomatoes' },
    { id: '2', name: 'Greenhouse 2', location: 'Location 2', size: '50sqm', cropType: 'Cucumbers' },
  ];
  return {
    greenHouseViewModel: {
      data$: {
        get: () => mockData,
        peek: () => mockData,
        subscribe: (_cb: (data: typeof mockData) => void) => () => {},
      },
      isLoading$: {
        get: () => false,
        peek: () => false,
        subscribe: (_cb: (loading: boolean) => void) => () => {},
      },
      fetchCommand: { execute: () => Promise.resolve() },
      createCommand: { execute: () => Promise.resolve() },
      updateCommand: { execute: () => Promise.resolve() },
      deleteCommand: { execute: () => Promise.resolve() },
    },
  };
});

import { GreenhouseList } from './GreenhouseList';

afterEach(() => cleanup());

describe('GreenhouseList', () => {
  it('renders greenhouses from the shared ViewModel', () => {
    const { getByText } = render(() => (
      <MemoryRouter>
        <Route path="/" component={GreenhouseList} />
      </MemoryRouter>
    ));

    expect(getByText('Greenhouse 1')).toBeTruthy();
    expect(getByText('Greenhouse 2')).toBeTruthy();
  });
});
