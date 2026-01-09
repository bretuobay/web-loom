import { describe, it, expect, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import './greenhouse-list';

vi.mock('@repo/view-models/GreenHouseViewModel', () => {
  const mockData = [
    { id: '1', name: 'Greenhouse 1', location: 'Location 1', size: '25sqm', cropType: 'Tomatoes' },
    { id: '2', name: 'Greenhouse 2', location: 'Location 2', size: '50sqm', cropType: 'Cucumbers' },
  ];
  const mockViewModel = {
    data$: {
      subscribe: (cb: (data: any) => void) => {
        cb(mockData);
        return {
          unsubscribe: () => {},
        };
      },
    },
    fetchCommand: { execute: () => Promise.resolve() },
    createCommand: { execute: () => Promise.resolve() },
    updateCommand: { execute: () => Promise.resolve() },
    deleteCommand: { execute: () => Promise.resolve() },
  };
  return { greenHouseViewModel: mockViewModel };
});

describe('GreenhouseList', () => {
  it('should render a list of greenhouses', async () => {
    const el = await fixture(html`<greenhouse-list></greenhouse-list>`);
    await (el as any).updateComplete;

    const items = el.querySelectorAll('li');
    expect(items?.length).toBe(2);
    expect(items?.[0].textContent).toContain('Greenhouse 1');
    expect(items?.[1].textContent).toContain('Greenhouse 2');
  });
});
