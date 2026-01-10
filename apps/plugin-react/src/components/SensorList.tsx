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
    <>
      <Link to="/" className="back-button">
        <img src={BackArrow} alt="Back to dashboard" style={{ width: '36px', height: '36px' }} />
      </Link>
      <div className="card">
        <h1 className="card-title">Sensors</h1>
        {sensors && sensors.length > 0 ? (
          <ul className="card-content list">
            {sensors.map((sensor) => (
              <li key={sensor.id} className="list-item">
                {sensor.greenhouse.name} {sensor.type} (Status: {sensor.status})
              </li>
            ))}
          </ul>
        ) : (
          <p>No sensors found or still loading...</p>
        )}
      </div>
    </>
  );
}
