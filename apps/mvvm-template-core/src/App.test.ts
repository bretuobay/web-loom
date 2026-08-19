import { fireEvent, waitFor } from '@testing-library/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app';

const greenhouses = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'North Wing',
    location: 'Field A',
    size: '50sqm',
    cropType: 'Tomato',
  },
];

const sensors = [
  {
    id: '22222222-2222-4222-8222-222222222222',
    type: 'temperature',
    status: 'active',
    greenhouseId: 1,
    greenhouse: {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'North Wing',
      location: 'Field A',
      size: '50sqm',
    },
  },
];

const readings = [
  {
    id: '33333333-3333-4333-8333-333333333333',
    sensorId: 1,
    timestamp: '2026-08-15T10:00:00.000Z',
    value: 21.5,
  },
];

const alerts = [
  {
    id: '44444444-4444-4444-8444-444444444444',
    sensorType: 'temperature',
    minValue: 10,
    maxValue: 30,
    greenhouseId: 1,
  },
];

function jsonResponse(data: unknown): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function mountApp() {
  const container = document.createElement('div');
  document.body.append(container);
  const application = createApp();
  application.mount(container);

  return { application, container };
}

describe('template-core greenhouse demo', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/greenhouses')) return jsonResponse(greenhouses);
        if (url.includes('/api/sensors')) return jsonResponse(sensors);
        if (url.includes('/api/readings')) return jsonResponse(readings);
        if (url.includes('/api/alerts')) return jsonResponse(alerts);
        return jsonResponse([]);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the dashboard from shared ViewModels and .loom templates', async () => {
    const app = mountApp();
    await waitFor(() => expect(app.container.textContent).toContain('Total: 1'));
    expect(app.container.querySelector('.header')?.textContent).toContain('Greenhouses');
    expect(app.container.textContent).toContain('Total Alerts: 1');
    expect(app.container.textContent).toContain('Total Readings: 1');

    app.application.unmount();
    app.container.remove();
  });

  it('navigates to the greenhouse list and disposes mounted views', async () => {
    const app = mountApp();
    await waitFor(() => expect(app.container.querySelector('a[href="/greenhouses"]')).not.toBeNull());

    fireEvent.click(app.container.querySelector<HTMLAnchorElement>('a[href="/greenhouses"]')!);
    await waitFor(() => expect(window.location.pathname).toBe('/greenhouses'));
    await waitFor(() => expect(app.container.querySelector('.form-container')).not.toBeNull());
    expect(app.container.textContent).toContain('North Wing');

    const beforeDispose = app.container.textContent;
    app.application.unmount();
    app.application.unmount();
    expect(beforeDispose).toContain('Greenhouses');
    expect(app.container.textContent).toBe('');
    app.container.remove();
  });

  it('can mount again after a complete teardown', async () => {
    const app = createApp();
    const firstContainer = document.createElement('div');
    const secondContainer = document.createElement('div');
    document.body.append(firstContainer, secondContainer);

    app.mount(firstContainer);
    await waitFor(() => expect(firstContainer.textContent).toContain('Total: 1'));
    app.unmount();

    app.mount(secondContainer);
    await waitFor(() => expect(secondContainer.textContent).toContain('Total: 1'));
    expect(firstContainer.textContent).toBe('');

    app.unmount();
    firstContainer.remove();
    secondContainer.remove();
  });
});
