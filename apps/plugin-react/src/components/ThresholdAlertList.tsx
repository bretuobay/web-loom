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
    <>
      <Link to="/" className="back-button">
        <img src={BackArrow} alt="Back to dashboard" style={{ width: '36px', height: '36px' }} />
      </Link>
      <div className="card">
        <h1 className="card-title">Threshold Alerts</h1>
        {thresholds && thresholds.length > 0 ? (
          <ul className="card-content list">
            {thresholds.map((alert) => (
              <li key={alert.id} className="list-item">
                Alert ID: {alert.id}, Sensor ID: {alert.sensorType}, Message: Max: {alert.maxValue}, Min:{' '}
                {alert.minValue}
              </li>
            ))}
          </ul>
        ) : (
          <p>No threshold alerts found or still loading...</p>
        )}
      </div>
    </>
  );
}
