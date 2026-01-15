import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useReducedMotion } from '../hooks/useReducedMotion';
import styles from './OfflineIndicator.module.css';

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const reducedMotion = useReducedMotion();

  if (isOnline && !wasOffline) return null;

  const animationClass = reducedMotion ? '' : styles.animated;

  return (
    <div
      className={`${styles.indicator} ${isOnline ? styles.syncing : styles.offline} ${animationClass}`}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <span className={styles.icon} aria-hidden="true">
            ↻
          </span>
          <span>Syncing...</span>
        </>
      ) : (
        <>
          <span className={styles.icon} aria-hidden="true">
            ⚠
          </span>
          <span>You're offline. Showing cached data.</span>
        </>
      )}
    </div>
  );
}
