import { fireEvent, waitFor } from '@testing-library/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GreenhouseAppViewModel } from './app/view-model';
import { GreenhouseAppView } from './app/view';

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
  const appViewModel = new GreenhouseAppViewModel();
  const view = new GreenhouseAppView();
  const mounted = view.mount(container, appViewModel);
  const ready = appViewModel.start();

  return { container, ready, view: mounted, appViewModel };
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
    await app.ready;
    await waitFor(() => expect(app.container.textContent).toContain('Total: 1'));
    expect(app.container.querySelector('.header')?.textContent).toContain('Greenhouses');
    expect(app.container.textContent).toContain('Total Alerts: 1');
    expect(app.container.textContent).toContain('Total Readings: 1');

    app.view.dispose();
    app.appViewModel.dispose();
    app.container.remove();
  });

  it('navigates to the greenhouse list and disposes mounted views', async () => {
    const app = mountApp();
    await app.ready;
    await waitFor(() => expect(app.container.querySelector('a[href="/greenhouses"]')).not.toBeNull());

    fireEvent.click(app.container.querySelector<HTMLAnchorElement>('a[href="/greenhouses"]')!);
    await waitFor(() => expect(app.appViewModel.route$.get()).toBe('/greenhouses'));
    await waitFor(() => expect(app.container.querySelector('.form-container')).not.toBeNull());
    expect(app.container.textContent).toContain('North Wing');

    const beforeDispose = app.container.textContent;
    app.view.dispose();
    app.appViewModel.dispose();
    expect(beforeDispose).toContain('Greenhouses');
    expect(app.container.textContent).toBe('');
    app.container.remove();
  });
});
