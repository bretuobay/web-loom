import { useEffect } from 'react';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { useObservable } from '../hooks/useObservable';
import { Link } from 'react-router-dom';
import BackArrow from '../assets/back-arrow.svg';

export function SensorList() {
  const sensors = useObservable(sensorViewModel.data$, []);

  useEffect(() => {
    const fetchData = async () => {
      await sensorViewModel.fetchCommand.execute();
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
        <h1 className="page-title">Sensors</h1>
        <p className="page-description">Monitor all sensors across your greenhouses</p>
      </div>

      {sensors && sensors.length > 0 ? (
        <ul className="list-container">
          {sensors.map((sensor) => (
            <li key={sensor.id} className="list-item-card">
              <div className="list-item-header">
                <h3 className="list-item-title">{sensor.type}</h3>
                <span className={`status-badge ${sensor.status === 'active' ? 'active' : 'inactive'}`}>
                  {sensor.status}
                </span>
              </div>
              <div className="list-item-body">
                <div className="list-item-field">
                  <span className="list-item-field-label">Greenhouse</span>
                  <span className="list-item-field-value">{sensor.greenhouse.name}</span>
                </div>
                <div className="list-item-field">
                  <span className="list-item-field-label">Sensor ID</span>
                  <span className="list-item-field-value list-item-id">{sensor.id}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <p className="empty-state-title">No sensors found</p>
          <p className="empty-state-description">Sensors will appear here once they are added to your greenhouses</p>
        </div>
      )}
    </div>
  );
}
