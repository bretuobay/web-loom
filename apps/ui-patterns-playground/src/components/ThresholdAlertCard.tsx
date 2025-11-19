import type { ThresholdAlertListData } from '@repo/view-models/ThresholdAlertViewModel';
import React from 'react';
import { Link } from 'react-router-dom';

interface ThresholdAlertCardProps {
  thresholdAlerts: ThresholdAlertListData;
}

const ThresholdAlertCard: React.FC<ThresholdAlertCardProps> = ({ thresholdAlerts }) => {
  return (
    <div className="card">
      <Link to="/threshold-alerts" className="card-header-link">
        <h3 className="class-title">Alerts</h3>
      </Link>
      <p className="card-content">Total Alerts: {thresholdAlerts.length}</p>
    </div>
  );
};

export default ThresholdAlertCard;
