import { useEffect } from 'react';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { useObservable } from '../hooks/useObservable';
import { Link } from 'react-router-dom';
import BackArrow from '../assets/back-arrow.svg';

export function SensorReadingList() {
  const readingList = useObservable(sensorReadingViewModel.data$, []);

  useEffect(() => {
    const fetchData = async () => {
      await sensorReadingViewModel.fetchCommand.execute();
    };
    fetchData();
  }, []);

  return (
    <>
      <Link to="/" className="back-button">
        <img src={BackArrow} alt="Back to dashboard" style={{ width: '36px', height: '36px' }} />
      </Link>
      <div className="card">
        <h1 className="card-title">Sensor Readings</h1>
        {readingList && readingList.length > 0 ? (
          <ul className="card-content list">
            {readingList.map((reading) => (
              <li key={reading.id + reading.timestamp} className="list-item">
                Reading ID: {reading.sensorId}, Sensor ID: {reading.sensorId}, Timestamp:{' '}
                {new Date(reading.timestamp).toLocaleString()}, Value: {reading.value}
              </li>
            ))}
          </ul>
        ) : (
          <p>No sensor readings found or still loading...</p>
        )}
      </div>
    </>
  );
}
