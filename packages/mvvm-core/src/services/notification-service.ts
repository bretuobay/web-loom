import { signal, type ReadonlySignal } from '@web-loom/signals-core';

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
  private readonly _notifications = signal<Notification[]>([]);
  private readonly _dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private _isDisposed = false;

  public readonly notifications$: ReadonlySignal<Notification[]> = this._notifications.asReadonly();

  private generateId(): string {
    return `notif-${Date.now()}-${this.notificationIdCounter++}`;
  }

  public showNotification(
    message: string,
    type: Notification['type'],
    duration?: number, // If duration is 0 or undefined, it's persistent
  ): string {
    const id = this.generateId();
    if (this._isDisposed) return id;
    const isPersistent = duration === undefined || duration <= 0;
    const notification: Notification = {
      id,
      message,
      type,
      duration: isPersistent ? undefined : duration,
      timestamp: new Date(),
      isPersistent,
    };

    this._notifications.set([...this._notifications.peek(), notification]);

    if (!isPersistent && duration && duration > 0) {
      // Auto-dismiss after the duration; manual dismissal clears the timer.
      const timer = setTimeout(() => {
        this._dismissTimers.delete(id);
        this.dismissNotification(id);
      }, duration);
      this._dismissTimers.set(id, timer);
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
    if (this._isDisposed) return;
    const timer = this._dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this._dismissTimers.delete(id);
    }
    const currentNotifications = this._notifications.peek();
    const notificationExists = currentNotifications.some((n) => n.id === id);
    if (notificationExists) {
      this._notifications.set(currentNotifications.filter((n) => n.id !== id));
    }
  }

  public clearAll(type?: Notification['type']): void {
    if (this._isDisposed) return;
    if (type) {
      const remaining = this._notifications.peek().filter((n) => n.type !== type);
      // Cancel timers for the notifications being cleared
      for (const n of this._notifications.peek()) {
        if (n.type === type) {
          const timer = this._dismissTimers.get(n.id);
          if (timer) {
            clearTimeout(timer);
            this._dismissTimers.delete(n.id);
          }
        }
      }
      this._notifications.set(remaining);
    } else {
      for (const timer of this._dismissTimers.values()) clearTimeout(timer);
      this._dismissTimers.clear();
      this._notifications.set([]);
    }
  }

  public dispose(): void {
    this._isDisposed = true;
    for (const timer of this._dismissTimers.values()) clearTimeout(timer);
    this._dismissTimers.clear();
  }
}
