import { BehaviorSubject, Observable, timer, filter, map, takeUntil } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning'; // Added 'warning' type
  duration?: number; // in ms. If undefined or 0, notification is persistent.
  timestamp: Date;
  isPersistent: boolean;
}

export class NotificationService {
  private notificationIdCounter = 0;
  private readonly _notifications$ = new BehaviorSubject<Notification[]>([]);
  public readonly notifications$: Observable<Notification[]> = this._notifications$.asObservable();

  private generateId(): string {
    return `notif-${Date.now()}-${this.notificationIdCounter++}`;
  }

  public showNotification(
    message: string,
    type: Notification['type'],
    duration?: number // If duration is 0 or undefined, it's persistent
  ): string {
    const id = this.generateId();
    const isPersistent = duration === undefined || duration <= 0;
    const notification: Notification = {
      id,
      message,
      type,
      duration: isPersistent ? undefined : duration,
      timestamp: new Date(),
      isPersistent,
    };

    this._notifications$.next([...this._notifications$.getValue(), notification]);

    if (!isPersistent && duration && duration > 0) {
      timer(duration)
        .pipe(takeUntil(this._notifications$.pipe(
            // Stop the timer if the notification is manually dismissed before the duration.
            // The condition for stopping is when the notification is NO LONGER found.
            filter(notifications => !notifications.some(n => n.id === id))
        )))
        .subscribe(() => {
          // This will only be called if takeUntil hasn't already completed the stream.
          this.dismissNotification(id);
        });
    }
    return id;
  }

  public showSuccess(message: string, duration: number = 5000): string {
    return this.showNotification(message, 'success', duration);
  }

  public showError(message: string, duration: number = 7000): string {
    // Errors might often be desired to be persistent or have longer default duration
    return this.showNotification(message, 'error', duration);
  }

  public showInfo(message: string, duration: number = 4000): string {
    return this.showNotification(message, 'info', duration);
  }

  public showWarning(message: string, duration: number = 6000): string {
    return this.showNotification(message, 'warning', duration);
  }

  public showPersistentSuccess(message: string): string {
    return this.showNotification(message, 'success', 0);
  }

  public showPersistentError(message: string): string {
    return this.showNotification(message, 'error', 0);
  }

  public showPersistentInfo(message: string): string {
    return this.showNotification(message, 'info', 0);
  }

  public showPersistentWarning(message: string): string {
    return this.showNotification(message, 'warning', 0);
  }


  public dismissNotification(id: string): void {
    const currentNotifications = this._notifications$.getValue();
    const notificationExists = currentNotifications.some(n => n.id === id);
    if (notificationExists) {
        this._notifications$.next(
            currentNotifications.filter(n => n.id !== id)
        );
    }
  }

  public clearAll(type?: Notification['type']): void {
    if (type) {
      this._notifications$.next(
        this._notifications$.getValue().filter(n => n.type !== type)
      );
    } else {
      this._notifications$.next([]);
    }
  }

  public dispose(): void {
    // Complete the subject to clean up subscriptions to notifications$
    this._notifications$.complete();
    // Any active timers will complete on their own or when their takeUntil condition is met.
    // For very robust cleanup of timers, you might need more complex management,
    // e.g., storing subscriptions and unsubscribing them here, but for typical
    // use cases with `timer` and `takeUntil`, this should be sufficient.
  }
}
