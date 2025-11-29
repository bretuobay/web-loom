import type { ThresholdAlertListData } from '@repo/view-models/ThresholdAlertViewModel';
import React from 'react';
import { Link } from 'react-router-dom';

interface ThresholdAlertCardProps {
  thresholdAlerts: ThresholdAlertListData;
}

const ThresholdAlertCard: React.FC<ThresholdAlertCardProps> = ({ thresholdAlerts }) => {
  return (
    <div className="card card-alert">
      <h3 className="card-header">
        <Link to="/threshold-alerts" className="card-link card-header-link">
          Threshold Alerts
        </Link>
      </h3>
      <div className="card-body">
        <span className="card-value card-value-alert">{thresholdAlerts.length}</span>
        <span className="card-label">Active Warnings</span>
      </div>
    </div>
  );
};

export default ThresholdAlertCard;
