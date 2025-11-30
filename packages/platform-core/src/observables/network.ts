import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import type { NetworkStatus, NetworkType } from '../types';

/**
 * Observable network status tracker
 */
export class NetworkObservable {
  private _status$ = new BehaviorSubject<NetworkStatus>(this.getCurrentStatus());

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen to online/offline events
      fromEvent(window, 'online').subscribe(() => this.updateStatus());
      fromEvent(window, 'offline').subscribe(() => this.updateStatus());

      // Listen to connection changes if available
      const connection =
        (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        fromEvent(connection, 'change').subscribe(() => this.updateStatus());
      }
    }
  }

  get status$(): Observable<NetworkStatus> {
    return this._status$.asObservable();
  }

  get online$(): Observable<boolean> {
    return this._status$.pipe(map((status) => status.online));
  }

  getCurrentStatus(): NetworkStatus {
    if (typeof window === 'undefined') {
      return { online: true, effectiveType: 'unknown' };
    }

    const connection =
      (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    return {
      online: navigator.onLine,
      effectiveType: (connection?.effectiveType as NetworkType) || 'unknown',
      downlink: connection?.downlink,
      rtt: connection?.rtt,
    };
  }

  private updateStatus(): void {
    this._status$.next(this.getCurrentStatus());
  }
}

export const networkObservable = new NetworkObservable();
