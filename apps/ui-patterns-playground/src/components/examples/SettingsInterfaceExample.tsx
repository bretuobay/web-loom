import { createHubAndSpoke } from '@web-loom/ui-patterns';
import './examples.css';

interface SettingOption {
  id: string;
  label: string;
  value: string | boolean;
}

/**
 * Settings Interface Example with Hub & Spoke
 *
 * Demonstrates:
 * - Hub-and-spoke navigation pattern
 * - Breadcrumb tracking
 * - Nested spokes for hierarchical settings
 */
export function SettingsInterfaceExample() {
  const hubAndSpoke = createHubAndSpoke({
    spokes: [
      {
        id: 'account',
        label: 'Account',
        icon: '👤',
        subSpokes: [
          { id: 'profile', label: 'Profile', icon: '📝' },
          { id: 'security', label: 'Security', icon: '🔒' },
          { id: 'privacy', label: 'Privacy', icon: '🛡️' },
        ],
      },
      {
        id: 'appearance',
        label: 'Appearance',
        icon: '🎨',
        subSpokes: [
          { id: 'theme', label: 'Theme', icon: '🌓' },
          { id: 'layout', label: 'Layout', icon: '📐' },
        ],
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: '🔔',
        subSpokes: [
          { id: 'email', label: 'Email', icon: '📧' },
          { id: 'push', label: 'Push', icon: '📱' },
        ],
      },
      {
        id: 'advanced',
        label: 'Advanced',
        icon: '⚙️',
      },
    ],
  });

  const state = hubAndSpoke.getState();

  const settingsData: Record<string, SettingOption[]> = {
    profile: [
      { id: 'name', label: 'Display Name', value: 'John Doe' },
      { id: 'email', label: 'Email', value: 'john@example.com' },
      { id: 'bio', label: 'Bio', value: 'Software developer' },
    ],
    security: [
      { id: '2fa', label: 'Two-Factor Authentication', value: true },
      { id: 'sessions', label: 'Active Sessions', value: '3 devices' },
      { id: 'password', label: 'Password', value: '••••••••' },
    ],
    privacy: [
      { id: 'profile-visibility', label: 'Profile Visibility', value: 'Public' },
      { id: 'data-sharing', label: 'Data Sharing', value: false },
      { id: 'activity', label: 'Activity Status', value: true },
    ],
    theme: [
      { id: 'color-scheme', label: 'Color Scheme', value: 'Dark' },
      { id: 'accent-color', label: 'Accent Color', value: 'Blue' },
      { id: 'font-size', label: 'Font Size', value: 'Medium' },
    ],
    layout: [
      { id: 'sidebar', label: 'Sidebar Position', value: 'Left' },
      { id: 'density', label: 'Density', value: 'Comfortable' },
      { id: 'animations', label: 'Animations', value: true },
    ],
    email: [
      { id: 'newsletter', label: 'Newsletter', value: true },
      { id: 'updates', label: 'Product Updates', value: true },
      { id: 'marketing', label: 'Marketing', value: false },
    ],
    push: [
      { id: 'mentions', label: 'Mentions', value: true },
      { id: 'messages', label: 'Messages', value: true },
      { id: 'reminders', label: 'Reminders', value: false },
    ],
    advanced: [
      { id: 'developer-mode', label: 'Developer Mode', value: false },
      { id: 'debug-logs', label: 'Debug Logs', value: false },
      { id: 'experimental', label: 'Experimental Features', value: false },
    ],
  };

  const handleSpokeClick = (spokeId: string) => {
    hubAndSpoke.actions.activateSpoke(spokeId);
  };

  const handleReturnToHub = () => {
    hubAndSpoke.actions.returnToHub();
  };

  const handleGoBack = () => {
    hubAndSpoke.actions.goBack();
  };

  const renderHub = () => (
    <div className="settings-hub">
      <h2>Settings</h2>
      <p className="hub-description">Choose a category to configure</p>
      <div className="settings-grid">
        {state.spokes.map((spoke) => (
          <button key={spoke.id} onClick={() => handleSpokeClick(spoke.id)} className="settings-category">
            <span className="category-icon">{spoke.icon}</span>
            <span className="category-label">{spoke.label}</span>
            {spoke.subSpokes && spoke.subSpokes.length > 0 && (
              <span className="category-badge">{spoke.subSpokes.length}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderSpoke = () => {
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

    const activeSpoke = findSpoke(state.activeSpoke!);
    if (!activeSpoke) return null;

    // Check if this spoke has sub-spokes
    if (activeSpoke.subSpokes && activeSpoke.subSpokes.length > 0) {
      return (
        <div className="settings-spoke">
          <h2>
            {activeSpoke.icon} {activeSpoke.label}
          </h2>
          <p className="spoke-description">Choose a subcategory</p>
          <div className="settings-grid">
            {activeSpoke.subSpokes.map((subSpoke) => (
              <button key={subSpoke.id} onClick={() => handleSpokeClick(subSpoke.id)} className="settings-category">
                <span className="category-icon">{subSpoke.icon}</span>
                <span className="category-label">{subSpoke.label}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Render settings for this spoke
    const settings = settingsData[state.activeSpoke!] || [];
    return (
      <div className="settings-spoke">
        <h2>
          {activeSpoke.icon} {activeSpoke.label}
        </h2>
        <div className="settings-list">
          {settings.length > 0 ? (
            settings.map((setting) => (
              <div key={setting.id} className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">{setting.label}</div>
                </div>
                <div className="setting-value">
                  {typeof setting.value === 'boolean' ? (
                    <label className="toggle">
                      <input type="checkbox" checked={setting.value} readOnly />
                      <span className="toggle-slider"></span>
                    </label>
                  ) : (
                    <span className="value-text">{setting.value}</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No settings available for this category.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="example-container">
      <div className="example-header">
        <h2>Settings Interface with Hub & Spoke</h2>
        <p>
          This example demonstrates the <code>createHubAndSpoke</code> pattern for hierarchical navigation with
          breadcrumb tracking.
        </p>
      </div>

      <div className="example-content">
        <div className="navigation-controls">
          <button onClick={handleReturnToHub} disabled={state.isOnHub} className="control-button">
            🏠 Return to Hub
          </button>
          <button onClick={handleGoBack} disabled={state.navigationHistory.length <= 1} className="control-button">
            ← Go Back
          </button>
        </div>

        <div className="breadcrumbs">
          <span className="breadcrumb-item" onClick={handleReturnToHub}>
            Settings
          </span>
          {state.breadcrumbs.map((crumb, index) => {
            // Helper to find spoke label
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

        <div className="settings-container">{state.isOnHub ? renderHub() : renderSpoke()}</div>

        <div className="navigation-state">
          <h3>Navigation State</h3>
          <div className="state-grid">
            <div className="state-item">
              <span className="state-label">Is On Hub:</span>
              <span className={`state-value ${state.isOnHub ? 'active' : ''}`}>{state.isOnHub ? 'Yes' : 'No'}</span>
            </div>
            <div className="state-item">
              <span className="state-label">Active Spoke:</span>
              <span className="state-value">{state.activeSpoke || 'None'}</span>
            </div>
            <div className="state-item">
              <span className="state-label">Breadcrumbs:</span>
              <span className="state-value">{state.breadcrumbs.join(' → ') || 'None'}</span>
            </div>
            <div className="state-item">
              <span className="state-label">History Length:</span>
              <span className="state-value">{state.navigationHistory.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="example-footer">
        <h3>Key Features</h3>
        <ul>
          <li>Hub-and-spoke navigation pattern</li>
          <li>Nested spokes for hierarchical settings</li>
          <li>Breadcrumb tracking for navigation context</li>
          <li>Navigation history with back button</li>
          <li>Visual state indicators</li>
        </ul>
      </div>
    </div>
  );
}
