import { BehaviorSubject, Observable } from 'rxjs';
import type { BatteryStatus } from '../types';

/**
 * Observable battery status tracker
 */
export class BatteryObservable {
  private _status$ = new BehaviorSubject<BatteryStatus | null>(null);
  private _battery: any = null;

  constructor() {
    this.initialize();
  }

  get status$(): Observable<BatteryStatus | null> {
    return this._status$.asObservable();
  }

  private async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !('getBattery' in navigator)) {
      return;
    }

    try {
      this._battery = await (navigator as any).getBattery();
      this.updateStatus();

      // Listen to battery events
      this._battery.addEventListener('levelchange', () => this.updateStatus());
      this._battery.addEventListener('chargingchange', () => this.updateStatus());
      this._battery.addEventListener('chargingtimechange', () => this.updateStatus());
      this._battery.addEventListener('dischargingtimechange', () => this.updateStatus());
    } catch {
      // Battery API not supported
    }
  }

  private updateStatus(): void {
    if (!this._battery) return;

    this._status$.next({
      level: this._battery.level,
      charging: this._battery.charging,
      chargingTime: this._battery.chargingTime === Infinity ? undefined : this._battery.chargingTime,
      dischargingTime: this._battery.dischargingTime === Infinity ? undefined : this._battery.dischargingTime,
    });
  }
}

export const batteryObservable = new BatteryObservable();
