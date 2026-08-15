import { createRouter, type Router } from '@web-loom/router-core';
import { signal, type WritableSignal } from '@web-loom/signals-core';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';

export type GreenhouseViewKey =
  | 'dashboard'
  | 'greenhouses'
  | 'sensors'
  | 'sensor-readings'
  | 'threshold-alerts'
  | 'not-found';

export class GreenhouseAppViewModel {
  readonly router: Router;
  readonly route$: WritableSignal<string>;
  private started = false;
  private stopRouteSubscription: (() => void) | null = null;

  constructor() {
    this.router = createRouter({
      mode: 'history',
      routes: [
        { path: '/', name: 'home', meta: { view: 'dashboard' satisfies GreenhouseViewKey } },
        { path: '/dashboard', name: 'dashboard', meta: { view: 'dashboard' satisfies GreenhouseViewKey } },
        { path: '/greenhouses', name: 'greenhouses', meta: { view: 'greenhouses' satisfies GreenhouseViewKey } },
        { path: '/sensors', name: 'sensors', meta: { view: 'sensors' satisfies GreenhouseViewKey } },
        {
          path: '/sensor-readings',
          name: 'sensor-readings',
          meta: { view: 'sensor-readings' satisfies GreenhouseViewKey },
        },
        {
          path: '/threshold-alerts',
          name: 'threshold-alerts',
          meta: { view: 'threshold-alerts' satisfies GreenhouseViewKey },
        },
        {
          path: '/:pathMatch(.*)',
          name: 'not-found',
          matchStrategy: 'prefix',
          meta: { view: 'not-found' satisfies GreenhouseViewKey },
        },
      ],
    });
    this.route$ = signal(this.router.currentRoute.path);
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    let initialLoad: Promise<void> | null = null;
    this.stopRouteSubscription = this.router.subscribe((route) => {
      this.route$.set(route.path);
      const pending = this.loadRoute(route.path);
      initialLoad ??= pending;
      void pending;
    });
    await initialLoad;
  }

  async navigate(path: string): Promise<void> {
    await this.router.push(path);
  }

  dispose(): void {
    this.stopRouteSubscription?.();
    this.stopRouteSubscription = null;
    this.router.destroy();
    this.started = false;
  }

  private async loadRoute(path: string): Promise<void> {
    try {
      if (path === '/' || path === '/dashboard') {
        await Promise.all([
          greenHouseViewModel.fetchCommand.execute(),
          sensorViewModel.fetchCommand.execute(),
          sensorReadingViewModel.fetchCommand.execute(),
          thresholdAlertViewModel.fetchCommand.execute(),
        ]);
        return;
      }
      if (path === '/greenhouses') {
        await greenHouseViewModel.fetchCommand.execute();
        return;
      }
      if (path === '/sensors') {
        await sensorViewModel.fetchCommand.execute();
        return;
      }
      if (path === '/sensor-readings') {
        await sensorReadingViewModel.fetchCommand.execute();
        return;
      }
      if (path === '/threshold-alerts') {
        await thresholdAlertViewModel.fetchCommand.execute();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }
}
