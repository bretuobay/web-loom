import { createHubAndSpoke } from '@web-loom/ui-patterns';
import { useState, useEffect } from 'react';
import './examples.css';

/**
 * Comprehensive Hub & Spoke Pattern Example
 *
 * Demonstrates:
 * - Hub-and-spoke navigation pattern
 * - Nested spokes for hierarchical navigation
 * - Breadcrumb tracking
 * - Navigation history with back/forward
 * - Event bus integration
 * - Dynamic spoke management
 */
export function HubAndSpokeExample() {
  const [hubAndSpoke] = useState(() =>
    createHubAndSpoke({
      spokes: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: '📊',
          subSpokes: [
            { id: 'analytics', label: 'Analytics', icon: '📈' },
            { id: 'reports', label: 'Reports', icon: '📄' },
            { id: 'metrics', label: 'Metrics', icon: '📉' },
          ],
        },
        {
          id: 'users',
          label: 'Users',
          icon: '👥',
          subSpokes: [
            { id: 'user-list', label: 'User List', icon: '📋' },
            { id: 'user-roles', label: 'Roles & Permissions', icon: '🔐' },
            { id: 'user-activity', label: 'Activity Log', icon: '📝' },
          ],
        },
        {
          id: 'content',
          label: 'Content',
          icon: '📝',
          subSpokes: [
            { id: 'articles', label: 'Articles', icon: '📰' },
            { id: 'media', label: 'Media Library', icon: '🖼️' },
            { id: 'categories', label: 'Categories', icon: '🏷️' },
          ],
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: '⚙️',
        },
        {
          id: 'help',
          label: 'Help & Support',
          icon: '❓',
        },
      ],
      onSpokeActivate: (spokeId) => {
        console.log('Spoke activated:', spokeId);
      },
      onReturnToHub: () => {
        console.log('Returned to hub');
      },
    }),
  );

  const [state, setState] = useState(hubAndSpoke.getState());
  const [eventLog, setEventLog] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = hubAndSpoke.subscribe((newState) => {
      setState(newState);
    });

    // Subscribe to navigation events
    const activatedListener = (spokeId: string) => {
      setEventLog((prev) => [...prev, `Spoke activated: ${spokeId}`]);
    };
    hubAndSpoke.eventBus.on('spoke:activated', activatedListener);

    const returnedListener = () => {
      setEventLog((prev) => [...prev, 'Returned to hub']);
    };
    hubAndSpoke.eventBus.on('hub:returned', returnedListener);

    const changedListener = (state: typeof hubAndSpoke extends { getState: () => infer S } ? S : never) => {
      setEventLog((prev) => [...prev, `Navigation changed - Active: ${state.activeSpoke || 'hub'}`]);
    };
    hubAndSpoke.eventBus.on('navigation:changed', changedListener);

    return () => {
      unsubscribe();
      hubAndSpoke.eventBus.off('spoke:activated', activatedListener);
      hubAndSpoke.eventBus.off('hub:returned', returnedListener);
      hubAndSpoke.eventBus.off('navigation:changed', changedListener);
      hubAndSpoke.destroy();
    };
  }, [hubAndSpoke]);

  const handleSpokeClick = (spokeId: string) => {
    hubAndSpoke.actions.activateSpoke(spokeId);
  };

  const handleReturnToHub = () => {
    hubAndSpoke.actions.returnToHub();
  };

  const handleGoBack = () => {
    hubAndSpoke.actions.goBack();
  };

  const handleAddSpoke = () => {
    const newSpoke = {
      id: `custom-${Date.now()}`,
      label: 'Custom Spoke',
      icon: '✨',
    };
    hubAndSpoke.actions.addSpoke(newSpoke);
    setEventLog((prev) => [...prev, `Added spoke: ${newSpoke.label}`]);
  };

  const handleRemoveSpoke = () => {
    if (state.spokes.length > 0) {
      const lastSpoke = state.spokes[state.spokes.length - 1];
      hubAndSpoke.actions.removeSpoke(lastSpoke.id);
      setEventLog((prev) => [...prev, `Removed spoke: ${lastSpoke.label}`]);
    }
  };

  const handleClearLog = () => {
    setEventLog([]);
  };

  // Helper to find spoke by ID (including nested spokes)
  const findSpoke = (spokeId: string): (typeof state.spokes)[0] | null => {
    for (const spoke of state.spokes) {
      if (spoke.id === spokeId) return spoke;
      if (spoke.subSpokes) {
        const found = spoke.subSpokes.find((s) => s.id === spokeId);
        if (found) return found;
      }
    }
    return null;
  };

  const renderHub = () => (
    <div className="hub-view">
      <div className="hub-header">
        <h2>🏠 Application Hub</h2>
        <p className="hub-description">Select a section to navigate. Sections with badges contain subsections.</p>
      </div>
      <div className="hub-grid">
        {state.spokes.map((spoke) => (
          <button key={spoke.id} onClick={() => handleSpokeClick(spoke.id)} className="hub-card">
            <span className="hub-card-icon">{spoke.icon}</span>
            <span className="hub-card-label">{spoke.label}</span>
            {spoke.subSpokes && spoke.subSpokes.length > 0 && (
              <span className="hub-card-badge">{spoke.subSpokes.length}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderSpoke = () => {
    const activeSpoke = findSpoke(state.activeSpoke!);
    if (!activeSpoke) return null;

    // If spoke has sub-spokes, show them
    if (activeSpoke.subSpokes && activeSpoke.subSpokes.length > 0) {
      return (
        <div className="spoke-view">
          <div className="spoke-header">
            <h2>
              {activeSpoke.icon} {activeSpoke.label}
            </h2>
            <p className="spoke-description">Choose a subsection to continue</p>
          </div>
          <div className="spoke-grid">
            {activeSpoke.subSpokes.map((subSpoke) => (
              <button key={subSpoke.id} onClick={() => handleSpokeClick(subSpoke.id)} className="spoke-card">
                <span className="spoke-card-icon">{subSpoke.icon}</span>
                <span className="spoke-card-label">{subSpoke.label}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Leaf spoke - show content
    return (
      <div className="spoke-view">
        <div className="spoke-header">
          <h2>
            {activeSpoke.icon} {activeSpoke.label}
          </h2>
        </div>
        <div className="spoke-content">
          <div className="content-card">
            <h3>Content for {activeSpoke.label}</h3>
            <p>
              This is the content area for the <strong>{activeSpoke.label}</strong> section. In a real application, this
              would contain the actual functionality and data for this section.
            </p>
            <div className="content-features">
              <div className="feature-item">
                <span className="feature-icon">✅</span>
                <span>Feature 1: Data management</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✅</span>
                <span>Feature 2: Real-time updates</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✅</span>
                <span>Feature 3: Export capabilities</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBreadcrumbs = () => {
    const findSpokeLabel = (spokeId: string): string => {
      for (const spoke of state.spokes) {
        if (spoke.id === spokeId) return spoke.label;
        if (spoke.subSpokes) {
          const subSpoke = spoke.subSpokes.find((s) => s.id === spokeId);
          if (subSpoke) return subSpoke.label;
        }
      }
      return spokeId;
    };

    return (
      <div className="breadcrumbs">
        <span className="breadcrumb-item" onClick={handleReturnToHub}>
          🏠 Hub
        </span>
        {state.breadcrumbs.map((crumb, index) => {
          const label = findSpokeLabel(crumb);
          const isLast = index === state.breadcrumbs.length - 1;

          return (
            <span key={crumb}>
              <span className="breadcrumb-separator">/</span>
              <span
                className="breadcrumb-item"
                style={{
                  fontWeight: isLast ? 600 : 400,
                  cursor: isLast ? 'default' : 'pointer',
                }}
                onClick={isLast ? undefined : () => handleSpokeClick(crumb)}
              >
                {label}
              </span>
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="example-container">
      <div className="example-header">
        <h2>Hub & Spoke Navigation Pattern</h2>
        <p>
          A comprehensive example demonstrating hierarchical navigation with a central hub and independent spoke pages.
          Features nested navigation, breadcrumbs, and navigation history.
        </p>
      </div>

      <div className="example-content">
        <div className="navigation-controls">
          <button onClick={handleReturnToHub} disabled={state.isOnHub} className="control-button primary">
            🏠 Return to Hub
          </button>
          <button onClick={handleGoBack} disabled={state.navigationHistory.length <= 1} className="control-button">
            ← Go Back
          </button>
          <button onClick={handleAddSpoke} className="control-button">
            ➕ Add Spoke
          </button>
          <button onClick={handleRemoveSpoke} disabled={state.spokes.length === 0} className="control-button">
            ➖ Remove Last Spoke
          </button>
        </div>

        {renderBreadcrumbs()}

        <div className="hub-spoke-container">{state.isOnHub ? renderHub() : renderSpoke()}</div>

        <div className="navigation-state">
          <h3>Navigation State</h3>
          <div className="state-grid">
            <div className="state-item">
              <span className="state-label">Current Location:</span>
              <span className={`state-value ${state.isOnHub ? 'active' : ''}`}>
                {state.isOnHub ? 'Hub' : state.activeSpoke}
              </span>
            </div>
            <div className="state-item">
              <span className="state-label">Breadcrumb Path:</span>
              <span className="state-value">
                {state.breadcrumbs.length > 0 ? state.breadcrumbs.join(' → ') : 'None'}
              </span>
            </div>
            <div className="state-item">
              <span className="state-label">History Length:</span>
              <span className="state-value">{state.navigationHistory.length}</span>
            </div>
            <div className="state-item">
              <span className="state-label">Total Spokes:</span>
              <span className="state-value">{state.spokes.length}</span>
            </div>
          </div>
        </div>

        <div className="event-log">
          <div className="event-log-header">
            <h3>Event Log</h3>
            <button onClick={handleClearLog} className="control-button">
              Clear Log
            </button>
          </div>
          <ul className="log-list">
            {eventLog.length === 0 ? (
              <li className="log-item empty-state">No events yet</li>
            ) : (
              eventLog
                .slice(-10)
                .reverse()
                .map((event, index) => (
                  <li key={index} className="log-item">
                    {event}
                  </li>
                ))
            )}
          </ul>
        </div>
      </div>

      <div className="example-footer">
        <h3>Key Features Demonstrated</h3>
        <ul>
          <li>
            <strong>Hub-and-Spoke Navigation:</strong> Central hub with independent spoke pages
          </li>
          <li>
            <strong>Nested Spokes:</strong> Hierarchical navigation with parent and child spokes
          </li>
          <li>
            <strong>Breadcrumb Tracking:</strong> Visual navigation path with clickable breadcrumbs
          </li>
          <li>
            <strong>Navigation History:</strong> Back button support with full history tracking
          </li>
          <li>
            <strong>Event Bus Integration:</strong> Real-time event logging for all navigation actions
          </li>
          <li>
            <strong>Dynamic Spoke Management:</strong> Add and remove spokes at runtime
          </li>
          <li>
            <strong>State Management:</strong> Reactive state updates with subscription pattern
          </li>
        </ul>
      </div>
    </div>
  );
}
