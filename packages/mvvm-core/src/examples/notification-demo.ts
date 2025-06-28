import { SimpleDIContainer, ServiceRegistry } from '../core/di-container';
import { NotificationService, Notification } from '../services/notification-service';
import { Subscription } from 'rxjs';

// Augment ServiceRegistry for this example
declare module '../core/di-container' {
  interface ServiceRegistry {
    notificationService: NotificationService;
  }
}

// --- 1. Setup DI Container ---
function setupDI() {
  if (!SimpleDIContainer.isRegistered('notificationService')) {
    SimpleDIContainer.register('notificationService', NotificationService, { isSingleton: true });
  }
}

// --- 2. Main Example Logic ---
export async function runNotificationDemo() {
  console.log('--- Running Notification Demo ---');
  setupDI();

  const notificationService = SimpleDIContainer.resolve('notificationService');
  const subscriptions: Subscription[] = [];

  // --- 3. Subscribe to Notifications (Simulating a UI Notification Area) ---
  console.log('Subscribing to notifications. New notifications will appear below:');
  subscriptions.push(
    notificationService.notifications$.subscribe((notifications: Notification[]) => {
      if (notifications.length > 0) {
        console.log('\n🔔 Current Notifications:');
        notifications.forEach(n => {
          console.log(`  [${n.type.toUpperCase()}] (ID: ${n.id}) ${n.message} ${n.isPersistent ? '(Persistent)' : `(Dismisses in ${n.duration}ms)`}`);
        });
      } else {
        console.log('\n🔕 No active notifications.');
      }
    })
  );

  // --- 4. Simulate Showing Different Types of Notifications ---
  notificationService.showInfo('Welcome to the notification demo!', 3000);
  await new Promise(resolve => setTimeout(resolve, 500)); // Stagger notifications

  const successId = notificationService.showSuccess('Your action was successful.', 2500);
  await new Promise(resolve => setTimeout(resolve, 500));

  notificationService.showWarning('Please check your input values.', 4000);
  await new Promise(resolve => setTimeout(resolve, 500));

  const errorId = notificationService.showError('An error occurred while processing your request!', 7000);
  await new Promise(resolve => setTimeout(resolve, 500));

  const persistentInfoId = notificationService.showPersistentInfo('This is a persistent informational message. It needs manual dismissal.');
  await new Promise(resolve => setTimeout(resolve, 500));

  notificationService.showPersistentError('CRITICAL: System component failed. Please contact support.');


  // Wait for some timed notifications to disappear
  console.log('\nWaiting for some notifications to auto-dismiss (approx 4s)...');
  await new Promise(resolve => setTimeout(resolve, 4000));

  // --- 5. Simulate Manual Dismissal ---
  console.log(`\nManually dismissing the first success notification (ID: ${successId})...`);
  notificationService.dismissNotification(successId); // Might already be gone, but dismiss is safe

  console.log(`\nManually dismissing the persistent info notification (ID: ${persistentInfoId})...`);
  notificationService.dismissNotification(persistentInfoId);
  await new Promise(resolve => setTimeout(resolve, 500));


  // --- 6. Simulate Clearing Notifications ---
  notificationService.showSuccess('Another success message before clear.', 2000);
  notificationService.showError('Another error message before clear.', 2000);
  notificationService.showInfo('Another info message before clear.', 2000);
  await new Promise(resolve => setTimeout(resolve, 100)); // Let them register

  console.log('\nClearing all "error" notifications...');
  notificationService.clearAll('error');
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\nClearing ALL remaining notifications...');
  notificationService.clearAll();
  await new Promise(resolve => setTimeout(resolve, 500));

  // --- 7. Cleanup ---
  subscriptions.forEach(sub => sub.unsubscribe());
  // NotificationService itself doesn't hold resources that need explicit disposal beyond its subject,
  // which is handled if the service instance is garbage collected or via its own dispose() if called.
  // For a long-running app, if the DI container is reset or service re-registered,
  // calling dispose on the old instance would be good.
  // notificationService.dispose(); // Call if you are done with this instance specifically.

  console.log('--- Notification Demo Complete ---');
}

// To run this example:
if (require.main === module) {
    runNotificationDemo().catch(err => {
        console.error("Unhandled error in example execution:", err);
    });
}
