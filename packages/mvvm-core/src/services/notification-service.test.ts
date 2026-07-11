import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationService } from './notification-service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new NotificationService();
  });

  afterEach(() => {
    service.dispose();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should initialize with an empty array of notifications', async () => {
    const notifications = service.notifications$.get();
    expect(notifications).toEqual([]);
  });

  it('showSuccess should add a success notification', async () => {
    service.showSuccess('Test success');
    const notifications = service.notifications$.get();
    expect(notifications.length).toBe(1);
    expect(notifications[0].message).toBe('Test success');
    expect(notifications[0].type).toBe('success');
    expect(notifications[0].isPersistent).toBe(false);
  });

  it('showError should add an error notification', async () => {
    service.showError('Test error');
    const notifications = service.notifications$.get();
    expect(notifications.length).toBe(1);
    expect(notifications[0].message).toBe('Test error');
    expect(notifications[0].type).toBe('error');
  });

  it('showInfo should add an info notification', async () => {
    service.showInfo('Test info');
    const notifications = service.notifications$.get();
    expect(notifications.length).toBe(1);
    expect(notifications[0].message).toBe('Test info');
    expect(notifications[0].type).toBe('info');
  });

  it('showWarning should add a warning notification', async () => {
    service.showWarning('Test warning');
    const notifications = service.notifications$.get();
    expect(notifications.length).toBe(1);
    expect(notifications[0].message).toBe('Test warning');
    expect(notifications[0].type).toBe('warning');
  });

  it('showPersistentSuccess should add a persistent success notification', async () => {
    service.showPersistentSuccess('Persistent success');
    const notifications = service.notifications$.get();
    expect(notifications.length).toBe(1);
    expect(notifications[0].type).toBe('success');
    expect(notifications[0].isPersistent).toBe(true);
    expect(notifications[0].duration).toBeUndefined();
  });

  it('showNotification with 0 duration should be persistent', async () => {
    service.showNotification('Persistent zero duration', 'info', 0);
    const notifications = service.notifications$.get();
    expect(notifications.length).toBe(1);
    expect(notifications[0].isPersistent).toBe(true);
  });

  it('showNotification with negative duration should be persistent', async () => {
    service.showNotification('Persistent negative duration', 'info', -100);
    const notifications = service.notifications$.get();
    expect(notifications.length).toBe(1);
    expect(notifications[0].isPersistent).toBe(true);
  });

  it('should generate unique IDs for notifications', () => {
    const id1 = service.showInfo('Info 1');
    const id2 = service.showSuccess('Success 1');
    expect(id1).not.toBe(id2);
  });

  it('dismissNotification should remove a notification by ID', async () => {
    const id1 = service.showInfo('Info 1');
    service.showSuccess('Success 1'); // Keep one notification

    // Wait for both notifications to be present
    expect(service.notifications$.get().length).toBe(2);

    service.dismissNotification(id1);
    // _notifications$ is a BehaviorSubject. After dismissNotification, its value is updated.
    // We want the current value AFTER the dismissal.
    // No skip(1) needed here as dismissNotification should cause an emission with the new state.
    await Promise.resolve(); // Ensure any synchronous changes within dismissNotification propagate
    const notificationsAfterDismiss = service.notifications$.get();
    expect(notificationsAfterDismiss.length).toBe(1);
    expect(notificationsAfterDismiss[0].type).toBe('success');

    // Try dismissing a non-existent ID
    service.dismissNotification('non-existent-id');
    // Ensure no further emissions due to dismissing non-existent ID (can be tricky to test reliably without complex setup)
    // For now, just check current state after a small delay
    await Promise.resolve(); // allow microtasks to flush
    const notificationsAfterNonExistentDismiss = service.notifications$.get();
    expect(notificationsAfterNonExistentDismiss.length).toBe(1);
  });

  it('clearAll should remove all notifications', async () => {
    service.showInfo('Info 1');
    service.showSuccess('Success 1');
    expect(service.notifications$.get().length).toBe(2);

    service.clearAll();
    await Promise.resolve(); // Ensure synchronous changes propagate
    const notifications = service.notifications$.get();
    expect(notifications.length).toBe(0);
  });

  it('clearAll(type) should remove all notifications of a specific type', async () => {
    service.showInfo('Info 1');
    service.showSuccess('Success 1');
    service.showInfo('Info 2');
    service.showError('Error 1');
    expect(service.notifications$.get().length).toBe(4);

    service.clearAll('info');
    await Promise.resolve(); // Ensure synchronous changes propagate
    const notifications = service.notifications$.get();
    expect(notifications.length).toBe(2);
    expect(notifications.find((n) => n.type === 'info')).toBeUndefined();
    expect(notifications.find((n) => n.type === 'success')).toBeDefined();
    expect(notifications.find((n) => n.type === 'error')).toBeDefined();
  });

  describe('Auto-dismissal', () => {
    it('should auto-dismiss a notification after its duration', async () => {
      service.showSuccess('Auto-dismiss test', 100); // Duration 100ms

      // 1. Wait for the notification to be added
      expect(service.notifications$.get().length).toBe(1);

      // 2. Advance timers to trigger dismissal
      vi.runAllTimers(); // This should execute the 100ms timer

      // 3. The signal reflects the dismissal synchronously
      expect(service.notifications$.get().length).toBe(0);
    }, 7000);

    it('persistent notifications should not auto-dismiss', async () => {
      service.showPersistentError('Persistent test');
      expect(service.notifications$.get().length).toBe(1);

      vi.advanceTimersByTime(10000);
      await Promise.resolve(); // Flush microtasks

      const notifications = service.notifications$.get(); // Get current state
      expect(notifications.length).toBe(1);
    });

    it('manually dismissing a notification should cancel its auto-dismiss timer', async () => {
      const id = service.showInfo('Manual dismiss test', 100); // Auto-dismiss in 100ms
      expect(service.notifications$.get().length).toBe(1);

      service.dismissNotification(id); // Manually dismiss it
      await Promise.resolve(); // Allow microtasks to flush
      const notificationsAfterDismiss = service.notifications$.get(); // Get current state
      expect(notificationsAfterDismiss.length).toBe(0);

      vi.advanceTimersByTime(100); // Advance time past when auto-dismiss would have fired
      await Promise.resolve();
      // If timer wasn't cancelled, it might try to dismiss again.
      // We check that the state remains 0 notifications.
      const notificationsAfterTimerWouldHaveFired = service.notifications$.get();
      expect(notificationsAfterTimerWouldHaveFired.length).toBe(0);
    });
  });

  it('dispose should stop further notification updates', () => {
    const spy = vi.fn();
    const unsubscribe = service.notifications$.subscribe(spy);
    service.dispose();
    vi.runAllTimers();
    service.showInfo('after dispose');
    expect(spy).not.toHaveBeenCalled();
    unsubscribe();
  });
});
