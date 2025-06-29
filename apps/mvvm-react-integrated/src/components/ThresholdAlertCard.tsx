import type { ThresholdAlertListData } from '@repo/view-models/ThresholdAlertViewModel';
import React from 'react';
import { Link } from 'react-router-dom';

interface ThresholdAlertCardProps {
  thresholdAlerts: ThresholdAlertListData;
}

const ThresholdAlertCard: React.FC<ThresholdAlertCardProps> = ({ thresholdAlerts }) => {
  return (
    <div className="card">
      <Link to="/threshold-alerts">
        <h3 className="card-header">Alerts</h3>
      </Link>
      <p className="card-body">Total Alerts: {thresholdAlerts.length}</p>
    </div>
  );
};

export default ThresholdAlertCard;
