import { memo } from 'react';
import { AccountPanel } from '../components/AccountPanel';

export const Settings = memo(function Settings() {
  return (
    <div className="page-container">
      <header className="page-header-section">
        <h1 className="page-title">Account Settings</h1>
        <p className="page-description">Manage your account details and security settings</p>
      </header>
      <AccountPanel />
    </div>
  );
});
