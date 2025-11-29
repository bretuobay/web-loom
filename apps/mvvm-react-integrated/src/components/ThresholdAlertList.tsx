import { useEffect } from 'react';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { useObservable } from '../hooks/useObservable';
import BackArrow from '../assets/back-arrow.svg';
import { Link } from 'react-router-dom';

export function ThresholdAlertList() {
  const thresholds = useObservable(thresholdAlertViewModel.data$, []);

  useEffect(() => {
    const fetchData = async () => {
      await thresholdAlertViewModel.fetchCommand.execute();
    };
    fetchData();
  }, []);

  return (
    <div className="page-container">
      <Link to="/" className="back-button">
        <img src={BackArrow} alt="Back to dashboard" />
        Back to Dashboard
      </Link>

      <div className="page-header-section">
        <h1 className="page-title">Threshold Alerts</h1>
        <p className="page-description">Monitor and manage sensor threshold alerts</p>
      </div>

      {thresholds && thresholds.length > 0 ? (
        <ul className="list-container">
          {thresholds.map((alert) => (
            <li key={alert.id} className="list-item-card">
              <div className="list-item-header">
                <h3 className="list-item-title">{alert.sensorType} Alert</h3>
                <span className={`status-badge ${alert.sensorType == 'temperature' ? 'inactive' : 'error'}`}>
                  {alert.sensorType == 'temperature'
                    ? 'Temperature sensor'
                    : alert.sensorType == 'humidity'
                      ? 'Humidity sensor'
                      : 'Other sensor'}
                </span>
              </div>
              <div className="list-item-body">
                <div className="list-item-field">
                  <span className="list-item-field-label">Alert ID</span>
                  <span className="list-item-field-value list-item-id">{alert.id}</span>
                </div>
                <div className="list-item-field">
                  <span className="list-item-field-label">Min Value</span>
                  <span className="list-item-field-value">{alert.minValue}</span>
                </div>
                <div className="list-item-field">
                  <span className="list-item-field-label">Max Value</span>
                  <span className="list-item-field-value">{alert.maxValue}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <p className="empty-state-title">No threshold alerts found</p>
          <p className="empty-state-description">Alerts will appear here when sensor thresholds are breached</p>
        </div>
      )}
    </div>
  );
}
